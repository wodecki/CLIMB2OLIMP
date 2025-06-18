import os
import json
import tomllib
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from state import DocumentState

# Load environment variables
load_dotenv()

def create_llm_for_branch(provider: str):
    """Create LLM instance for specific branch provider with improved timeout and retry settings"""
    if provider == "openai":
        model_name = os.getenv("OPENAI_MODEL", "o3-2025-04-16")
        # o3 models don't support custom temperature
        if "o3" in model_name:
            return ChatOpenAI(
                model=model_name,
                max_tokens=8000,  # Reasonable limit to prevent truncation
                timeout=300,      # 5 minutes timeout
                max_retries=5,    # More retries for reliability
                openai_api_key=os.getenv("OPENAI_API_KEY"),
                request_timeout=300  # Request-level timeout
            )
        else:
            return ChatOpenAI(
                model=model_name,
                temperature=0.2,  # OpenAI optimal temperature
                max_tokens=8000,  # Reasonable limit to prevent truncation
                timeout=300,      # 5 minutes timeout
                max_retries=5,    # More retries for reliability
                openai_api_key=os.getenv("OPENAI_API_KEY"),
                request_timeout=300  # Request-level timeout
            )
    elif provider == "anthropic":
        model_name = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        anthropic_kwargs = {
            "model": model_name,
            "temperature": 0.1,  # Anthropic optimal temperature
            "max_retries": 5,     # More retries for reliability
            "anthropic_api_key": os.getenv("ANTHROPIC_API_KEY"),
            "max_tokens": 8000,   # Reasonable limit to prevent truncation
            "timeout": 300        # 5 minutes timeout
        }
        return ChatAnthropic(**anthropic_kwargs)
    elif provider == "gemini":
        # Use stable Gemini model instead of preview
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.1,     # Gemini optimal temperature
            max_tokens=8000,     # Reasonable limit to prevent truncation
            timeout=300,         # 5 minutes timeout
            max_retries=5,       # More retries for 504 errors
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            request_timeout=300  # Request-level timeout
        )
    else:
        raise ValueError(f"Unsupported provider: {provider}")

def generate_recommendation_for_branch(state: DocumentState, branch_suffix: str, provider: str) -> DocumentState:
    """
    Generate recommendation for specific branch (A, B, or C)
    
    Args:
        state: Current document state
        branch_suffix: 'A', 'B', or 'C'
        provider: 'openai', 'anthropic', or 'gemini'
    """
    print(f"Generating recommendations for Branch {branch_suffix} using {provider}...")
    
    # Check if gaps exist
    if not state.get("gaps"):
        print(f"No gaps found in state - skipping Branch {branch_suffix} recommendations")
        print(f"State keys: {list(state.keys())}")
        if "gaps" in state:
            print(f"Gaps data type: {type(state['gaps'])}, content: {state['gaps']}")
        return state
    
    # Check if gaps is empty dict
    if isinstance(state.get("gaps"), dict) and len(state["gaps"]) == 0:
        print(f"Empty gaps dictionary found - skipping Branch {branch_suffix} recommendations")
        return state
    
    # Initialize branch data if not present
    if "branch_data" not in state:
        state["branch_data"] = {}
    
    branch_key = f"branch_{branch_suffix}"
    if branch_key not in state["branch_data"]:
        state["branch_data"][branch_key] = {
            "recommendations": None,
            "evaluation_feedback": None,
            "evaluation_iterations": 0,
            "recommendation_approved": False,
            "provider": provider
        }
    
    try:
        # Create LLM for this branch
        llm = create_llm_for_branch(provider)
        print(f"Initialized {provider} model for Branch {branch_suffix}")
        
        # Load recommendation prompt from config
        try:
            with open("./config/prompts.toml", "rb") as f:
                prompts_config = tomllib.load(f)
            
            if "recommend" not in prompts_config or "recommendation_prompt" not in prompts_config["recommend"]:
                print("Error: recommendation_prompt not found in config/prompts.toml")
                return state
            
            recommendation_prompt = prompts_config["recommend"]["recommendation_prompt"]
                
        except Exception as e:
            print(f"Error loading recommendation prompt config: {e}")
            return state
        
        # Load supplementary context
        supplementary_answers = None
        try:
            with open("./data/process/A_1.json", "r", encoding="utf-8") as f:
                supplementary_answers = json.load(f)
            print(f"Loaded supplementary questionnaire data for Branch {branch_suffix}")
        except FileNotFoundError:
            print(f"A_1.json not found - proceeding without supplementary context for Branch {branch_suffix}")
        except Exception as e:
            print(f"Error loading A_1.json: {e} - proceeding without supplementary context")
        
        # Format gaps data and supplementary context
        gaps_json = json.dumps(state["gaps"], ensure_ascii=False, indent=2)
        
        if supplementary_answers:
            supplementary_json = json.dumps(supplementary_answers, ensure_ascii=False, indent=2)
            formatted_prompt = recommendation_prompt.format(
                gaps_data=gaps_json,
                supplementary_context=supplementary_json
            )
        else:
            formatted_prompt = recommendation_prompt.format(
                gaps_data=gaps_json,
                supplementary_context="Brak dodatkowych danych z kwestionariusza."
            )
        
        print(f"Generating recommendations for Branch {branch_suffix} using {provider}...")
        
        # Create message for LangChain
        message = HumanMessage(content=formatted_prompt)
        
        # Generate recommendations
        response = llm.invoke([message])
        
        if not response.content:
            print(f"Error: No response from {provider} for Branch {branch_suffix}")
            return state
            
        # Clean the response
        recommendation_report = response.content.strip()
        if recommendation_report.startswith('```markdown'):
            recommendation_report = recommendation_report[11:]
        if recommendation_report.startswith('```'):
            recommendation_report = recommendation_report[3:]
        if recommendation_report.endswith('```'):
            recommendation_report = recommendation_report[:-3]
        recommendation_report = recommendation_report.strip()
        
        # Save to individual file for tracking
        output_filename = f"A_recommendations_branch_{branch_suffix}_{provider}.md"
        reports_dir = "./data/reports/interim_reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        output_path = f"{reports_dir}/{output_filename}"
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(f"# Branch {branch_suffix} Recommendations ({provider.upper()})\\n\\n")
                f.write(recommendation_report)
            print(f"Branch {branch_suffix} recommendations saved to {output_path}")
        except Exception as e:
            print(f"Error saving Branch {branch_suffix} recommendations: {e}")
        
        # Update branch-specific state using reducer-compatible format
        branch_update = {
            branch_key: {
                **state["branch_data"][branch_key],
                "recommendations": recommendation_report
            }
        }
        
        print(f"Branch {branch_suffix} recommendations generated successfully")
        
        # Return state update for the reducer
        return {
            "branch_data": branch_update
        }
        
    except Exception as e:
        print(f"Error generating recommendations for Branch {branch_suffix}: {e}")
        return state

# Branch-specific recommendation functions
def recommend_A(state: DocumentState) -> DocumentState:
    """Branch A: OpenAI recommendations"""
    return generate_recommendation_for_branch(state, "A", "openai")

def recommend_B(state: DocumentState) -> DocumentState:
    """Branch B: Claude recommendations"""
    return generate_recommendation_for_branch(state, "B", "anthropic")

def recommend_C(state: DocumentState) -> DocumentState:
    """Branch C: Gemini recommendations"""
    return generate_recommendation_for_branch(state, "C", "gemini")