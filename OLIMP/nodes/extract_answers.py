import os
import json
import glob
import tomllib
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from state import DocumentState
from progress_tracker import progress_tracker

# Load environment variables
load_dotenv()

def extract_answers(state: DocumentState) -> DocumentState:
    """
    Node to read PDF files and extract sections, questions, and answers using Gemini 2.5 Pro
    
    Args:
        state: The current state
        
    Returns:
        Updated state with document content and extracted answers
    """
    progress_tracker.update_step("extract_answers", "running", "Reading PDF files and extracting data")
    print("Reading PDF files...")
    
    # Find all PDF files starting with A_
    pdf_pattern = "./data/input/A_*.pdf"
    pdf_files = glob.glob(pdf_pattern)
    pdf_files.sort()  # Ensure consistent order
    
    if not pdf_files:
        progress_tracker.update_step("extract_answers", "completed", "No PDF files found, using existing data")
        return {
            **state,
            "document_content": "No PDF files found matching pattern A_*.pdf",
            "answers": {}
        }
    
    # Check if extraction is already done
    expected_files = []
    for pdf_path in pdf_files:
        filename = Path(pdf_path).stem
        expected_files.append(f"./data/process/{filename}.json")
    expected_files.append("./data/process/A.json")
    
    all_files_exist = all(os.path.exists(file_path) for file_path in expected_files)
    
    # Check if A.json exists and is valid (skip PDF processing if so)
    if os.path.exists("./data/process/A.json"):
        print("A.json exists - loading existing answers...")
        try:
            with open("./data/process/A.json", "r", encoding="utf-8") as f:
                integrated_results = json.load(f)
            
            if integrated_results and "OLIMP" in integrated_results:
                print(f"Successfully loaded A.json with keys: {list(integrated_results.keys())}")
                progress_tracker.update_step("extract_answers", "completed", "Loaded existing answers from A.json")
                return {
                    **state,
                    "document_content": f"Loaded existing answers from A.json (skipped PDF processing)",
                    "answers": integrated_results
                }
        except Exception as e:
            print(f"Error loading A.json: {e}")
    
    if all_files_exist:
        print("All individual JSON files exist, but A.json missing/invalid - attempting to recreate...")
        try:
            # Try to recreate A.json from individual files
            all_results = {}
            for pdf_path in pdf_files:
                filename = Path(pdf_path).stem
                individual_path = f"./data/process/{filename}.json"
                with open(individual_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                questionnaire_type = data.get("questionnaire", "UNKNOWN")
                all_results[questionnaire_type] = data
            
            # Save integrated file
            with open("./data/process/A.json", "w", encoding="utf-8") as f:
                json.dump(all_results, f, ensure_ascii=False, indent=2)
            
            print(f"Recreated A.json with keys: {list(all_results.keys())}")
            return {
                **state,
                "document_content": f"Recreated A.json from existing individual files",
                "answers": all_results
            }
        except Exception as e:
            print(f"Error recreating A.json: {e}")
            # Continue with extraction if loading fails
    
    try:
        # Configure Gemini API
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.5-pro-preview-05-06"))
        
        all_results = {}
        processed_files = []
        
        for pdf_path in pdf_files:
            print(f"Processing {pdf_path}...")
            
            # Determine questionnaire type based on filename
            filename = Path(pdf_path).stem  # e.g., "A_1" or "A_2"
            if filename.endswith("_1"):
                questionnaire_type = "CLIMB_2"
            elif filename.endswith("_2"):
                questionnaire_type = "OLIMP"
            else:
                questionnaire_type = "UNKNOWN"
            
            # Read PDF file as bytes
            with open(pdf_path, "rb") as pdf_file:
                pdf_data = pdf_file.read()
            
            print(f"PDF loaded successfully. Size: {len(pdf_data)} bytes")
            
            # Upload the PDF to Gemini
            pdf_file_obj = genai.upload_file(pdf_path, mime_type="application/pdf")
            
            print(f"PDF uploaded to Gemini. Extracting sections, questions, and answers...")
            
            # Load extraction prompt from config
            with open("./config/prompts.toml", "rb") as f:
                prompts_config = tomllib.load(f)
            
            extraction_prompt = prompts_config["extract_answers"]["extraction_prompt"].format(
                questionnaire_type=questionnaire_type
            )
            
            # Get structured data from Gemini with retry logic
            max_retries = 3
            retry_delay = 5  # seconds
            
            for attempt in range(max_retries):
                try:
                    response = model.generate_content([pdf_file_obj, extraction_prompt])
                    break  # Success, exit retry loop
                except Exception as e:
                    if "503" in str(e) and attempt < max_retries - 1:
                        print(f"Gemini API 503 error, retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries})")
                        import time
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                        continue
                    else:
                        raise e  # Re-raise if not 503 or max retries reached
            
            try:
                # Clean the response content to extract JSON
                response_content = response.text.strip()
                
                # Find JSON content between code blocks or extract JSON directly
                if '```json' in response_content:
                    # Extract content between ```json and ```
                    start_idx = response_content.find('```json') + 7
                    end_idx = response_content.find('```', start_idx)
                    if end_idx != -1:
                        response_content = response_content[start_idx:end_idx]
                    else:
                        # If no closing ```, take everything after ```json
                        response_content = response_content[start_idx:]
                elif '```' in response_content:
                    # Handle case where it starts with ``` but not ```json
                    start_idx = response_content.find('```') + 3
                    end_idx = response_content.find('```', start_idx)
                    if end_idx != -1:
                        response_content = response_content[start_idx:end_idx]
                    else:
                        response_content = response_content[start_idx:]
                
                response_content = response_content.strip()
                
                # Try to find the JSON object boundaries if parsing fails
                if response_content.startswith('{'):
                    # Find the matching closing brace
                    brace_count = 0
                    for i, char in enumerate(response_content):
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                response_content = response_content[:i+1]
                                break
                
                # Parse the JSON response
                extracted_data = json.loads(response_content)
                
                # Save individual file result
                individual_path = f"./data/process/{filename}.json"
                os.makedirs(os.path.dirname(individual_path), exist_ok=True)
                
                with open(individual_path, "w", encoding="utf-8") as f:
                    json.dump(extracted_data, f, ensure_ascii=False, indent=2)
                
                print(f"Individual extraction saved to {individual_path}")
                
                # Store for integration
                questionnaire_key = questionnaire_type
                all_results[questionnaire_key] = extracted_data
                processed_files.append(pdf_path)
                
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response for {pdf_path}: {e}")
                print("Raw response:", response.text[:500])
                
                # Save error response
                error_data = {"error": "Failed to parse JSON", "raw_response": response.text}
                individual_path = f"./data/process/{filename}.json"
                os.makedirs(os.path.dirname(individual_path), exist_ok=True)
                
                with open(individual_path, "w", encoding="utf-8") as f:
                    json.dump(error_data, f, ensure_ascii=False, indent=2)
                
                processed_files.append(f"{pdf_path} (ERROR)")
            
            # Clean up uploaded file
            try:
                genai.delete_file(pdf_file_obj.name)
            except:
                pass  # Ignore cleanup errors
        
        # Create integrated file (A.json)
        if all_results:
            integrated_path = "./data/process/A.json"
            with open(integrated_path, "w", encoding="utf-8") as f:
                json.dump(all_results, f, ensure_ascii=False, indent=2)
            
            print(f"Integrated results saved to {integrated_path}")
        
        document_content = f"Processed {len(pdf_files)} PDF files with Gemini {os.getenv('GEMINI_MODEL')}"
        
        print("All extractions completed successfully")
        progress_tracker.update_step("extract_answers", "completed", f"Processed {len(pdf_files)} PDF files successfully")
        
        # Update state
        return {
            **state,
            "document_content": document_content,
            "answers": all_results
        }
        
    except Exception as e:
        print(f"Error processing documents: {e}")
        return {
            **state,
            "document_content": f"Error reading PDFs: {e}",
            "answers": {}
        }
