import os
import json
from state import DocumentState
from logging_utils import get_node_logger, log_state_info, save_node_progress

def extract_answers(state: DocumentState) -> DocumentState:
    """
    Node to load questionnaire data from frontend-generated files (A.json)
    
    MODERN ARCHITECTURE: This node loads data prepared by the frontend workflow.
    No PDF processing - data comes from CLIMB2 analysis + OLIMP questionnaire.
    
    Args:
        state: The current state
        
    Returns:
        Updated state with document content and extracted answers
    """
    logger = get_node_logger("extract_answers")
    
    logger.info("🔍 extract_answers node called!")
    logger.debug(f"Current working directory: {os.getcwd()}")
    log_state_info("extract_answers", state, "start")
    logger.info("Loading questionnaire data from frontend...")
    
    import time
    node_start = time.time()
    
    save_node_progress("extract_answers", {"status": "starting", "step": "initialization"})
    
    # MODERN ARCHITECTURE: Data comes from frontend, not PDFs
    integrated_file_path = "./data/process/A.json"
    
    logger.info(f"Checking for frontend-generated data: {integrated_file_path}")
    
    if not os.path.exists(integrated_file_path):
        logger.error("❌ No A.json file found!")
        logger.error("This indicates a critical problem with the frontend data flow")
        logger.error("The frontend should generate A.json before starting OLIMP analysis")
        
        node_end = time.time()
        save_node_progress("extract_answers", {"status": "failed", "step": "no_frontend_data"})
        
        return {
            **state,
            "document_content": "ERROR: No A.json file found from frontend workflow",
            "answers": {}
        }
    
    logger.info("✅ Found frontend-generated A.json file")
    save_node_progress("extract_answers", {"status": "loading_frontend_data", "step": "reading_A_json"})
    
    try:
        with open(integrated_file_path, "r", encoding="utf-8") as f:
            integrated_results = json.load(f)
        
        logger.info(f"Loaded A.json with keys: {list(integrated_results.keys())}")
        
        # Validate the data structure
        if not integrated_results:
            raise ValueError("A.json file is empty")
        
        if "OLIMP" not in integrated_results:
            logger.error("❌ A.json missing OLIMP data structure")
            logger.error(f"Available keys: {list(integrated_results.keys())}")
            raise ValueError("Invalid A.json structure - missing OLIMP data")
        
        logger.info("✅ Valid OLIMP data found in A.json")
        
        # Extract OLIMP data for validation
        olimp_data = integrated_results["OLIMP"]
        sections = olimp_data.get("sections", [])
        logger.debug(f"OLIMP sections: {len(sections)}")
        
        # Count potential gaps for analysis
        gap_count = 0
        total_questions = 0
        
        for section in sections:
            questions = section.get("questions", [])
            total_questions += len(questions)
            
            for question in questions:
                selected_answer = question.get("selected_answer")
                if selected_answer and selected_answer in ['A', 'B', 'C', 'D']:
                    gap_count += 1
        
        logger.info(f"Data validation: {total_questions} total questions, {gap_count} potential gaps")
        
        # Also check for CLIMB_2 data if present
        climb2_info = ""
        if "CLIMB_2" in integrated_results:
            climb2_sections = integrated_results["CLIMB_2"].get("sections", [])
            climb2_info = f", CLIMB_2: {len(climb2_sections)} sections"
            logger.info(f"Also found CLIMB_2 data: {len(climb2_sections)} sections")
        
        node_end = time.time()
        logger.info(f"✅ Node completed (frontend data) in {node_end - node_start:.2f} seconds")
        save_node_progress("extract_answers", {
            "status": "completed", 
            "step": "loaded_frontend_data", 
            "total_questions": total_questions,
            "gaps_found": gap_count
        })
        
        return {
            **state,
            "document_content": f"Loaded questionnaire data from frontend: OLIMP {len(sections)} sections, {total_questions} questions, {gap_count} gaps{climb2_info}",
            "answers": integrated_results
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in A.json file: {e}")
        node_end = time.time()
        save_node_progress("extract_answers", {"status": "failed", "step": "json_parse_error"})
        
        return {
            **state,
            "document_content": f"ERROR: Invalid JSON in A.json file: {e}",
            "answers": {}
        }
        
    except Exception as e:
        logger.error(f"❌ Error loading A.json: {e}")
        node_end = time.time()
        save_node_progress("extract_answers", {"status": "failed", "step": "load_error"})
        
        return {
            **state,
            "document_content": f"ERROR: Failed to load questionnaire data: {e}",
            "answers": {}
        }