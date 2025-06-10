import json
import os
import tomllib
from state import DocumentState
from typing import Dict, List, Any
from progress_tracker import progress_tracker


def identify_gaps(state: DocumentState) -> DocumentState:
    """
    Node to identify gaps between current OLIMP answers and maximum level E
    for all OLIMP sections based on configuration
    
    Args:
        state: The current state containing answers
        
    Returns:
        Updated state with gaps analysis
    """
    progress_tracker.update_step("identify_gaps", "running", "Analyzing gaps between current and target levels")
    # Load target sections from configuration
    try:
        with open("./config/areas_for_improvement.toml", "rb") as f:
            config = tomllib.load(f)
        target_sections = config["gap_analysis"]["target_sections"]
    except Exception as e:
        print(f"Error loading configuration: {e}")
        # Fallback to all sections
        target_sections = [
            "TECHNOLOGIA I INFRASTRUKTURA",
            "DANE",
            "LUDZIE I KOMPETENCJE", 
            "ORGANIZACJA I PROCESY",
            "STRATEGIA I ZARZĄDZANIE",
            "BUDŻET",
            "PRODUKTY I USŁUGI",
            "ETYKA I REGULACJE"
        ]
    
    # Answer level progression mapping
    level_progression = {
        'A': ['B', 'C', 'D', 'E'],
        'B': ['C', 'D', 'E'],
        'C': ['D', 'E'],
        'D': ['E'],
        'E': []  # Already at maximum
    }
    
    gaps = {}
    
    # Check if answers exist and contain OLIMP data
    if not state.get("answers") or "OLIMP" not in state["answers"]:
        print("No OLIMP answers found in state")
        return {
            **state,
            "gaps": {}
        }
    
    olimp_data = state["answers"]["OLIMP"]
    
    # Check if sections exist
    if "sections" not in olimp_data:
        print("No sections found in OLIMP data")
        return {
            **state,
            "gaps": {}
        }
    
    # Process each target section
    for section in olimp_data["sections"]:
        section_name = section.get("section_name", "")
        
        if section_name in target_sections:
            gaps[section_name] = {}
            
            # Process each question in the section
            for question in section.get("questions", []):
                question_text = question.get("question_text", "")
                selected_answer = question.get("selected_answer", "")
                answer_options = question.get("answer_options", {})
                
                if selected_answer and selected_answer in level_progression:
                    steps_to_e = level_progression[selected_answer]
                    
                    # Get verbose descriptions for present state and steps
                    present_verbose = answer_options.get(selected_answer, "")
                    steps_verbose = []
                    for step in steps_to_e:
                        step_verbose = answer_options.get(step, "")
                        steps_verbose.append({
                            "level": step,
                            "description": step_verbose
                        })
                    
                    gaps[section_name][question_text] = {
                        "present": {
                            "level": selected_answer,
                            "description": present_verbose
                        },
                        "steps": steps_verbose
                    }
    
    # Print essential summary
    total_questions = sum(len(section_gaps) for section_gaps in gaps.values())
    print(f"Gaps analysis completed: {total_questions} questions across {len(gaps)} sections")
    progress_tracker.update_step("identify_gaps", "completed", f"Analyzed {total_questions} questions across {len(gaps)} sections")
    
    # Save gaps to JSON file
    # Determine the output filename based on integrated file name
    output_filename = None
    if "answers" in state and isinstance(state["answers"], dict):
        # Try to find an integrated file pattern (like A.json)
        if os.path.exists("./data/process/A.json"):
            output_filename = "A_gaps.json"
        else:
            # Fallback to generic name
            output_filename = "gaps.json"
    else:
        output_filename = "gaps.json"
    
    output_path = f"./data/process/{output_filename}"
    
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(gaps, f, ensure_ascii=False, indent=2)
        print(f"Results saved to {output_path}")
    except Exception as e:
        print(f"Error saving gaps to file: {e}")
    
    # Update state with gaps
    return {
        **state,
        "gaps": gaps
    }