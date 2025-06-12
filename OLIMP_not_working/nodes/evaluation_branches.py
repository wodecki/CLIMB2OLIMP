import os
import json
import tomllib
import re
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from state import DocumentState

# Load environment variables
load_dotenv()

# Maximum number of evaluation iterations per branch
MAX_EVALUATION_ITERATIONS = 3
# Minimum score threshold for approval (out of 100)
MIN_APPROVAL_SCORE = 80

def save_final_branch_recommendation(state: DocumentState, branch_suffix: str, provider: str):
    """Save the final version of a branch recommendation to reports directory"""
    branch_key = f"branch_{branch_suffix}"
    branch_data = state.get("branch_data", {}).get(branch_key, {})
    
    if not branch_data.get("recommendations"):
        print(f"Warning: No recommendation found for Branch {branch_suffix}")
        return
    
    final_filename = f"A_recommendations_FINAL_branch_{branch_suffix}_{provider}.md"
    reports_dir = "./data/reports/interim_reports"
    os.makedirs(reports_dir, exist_ok=True)
    
    final_path = f"{reports_dir}/{final_filename}"
    try:
        with open(final_path, "w", encoding="utf-8") as f:
            f.write(f"# FINAL Branch {branch_suffix} Recommendations ({provider.upper()})\\n\\n")
            f.write(f"**Provider**: {provider.upper()}\\n")
            f.write(f"**Total Iterations**: {branch_data.get('evaluation_iterations', 0)}\\n")
            f.write(f"**Status**: FINAL (Approved for Consensus)\\n")
            f.write(f"**Timestamp**: {Path().absolute()}\\n\\n")
            f.write("---\\n\\n")
            f.write(branch_data["recommendations"])
        print(f"📁 FINAL Branch {branch_suffix} recommendation saved to {final_path}")
    except Exception as e:
        print(f"Error saving final Branch {branch_suffix} recommendation: {e}")

def create_evaluator_llm(provider: str):
    """Create evaluator LLM for specific branch (same model as recommender)"""
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        model_name = os.getenv("OPENAI_MODEL", "o3-2025-04-16")
        # o3 models don't support custom temperature, must use default (1)
        if "o3" in model_name:
            return ChatOpenAI(
                model=model_name,
                temperature=1,  # o3 models only support temperature=1
                max_tokens=None,
                timeout=None,
                max_retries=2,
                openai_api_key=api_key
            )
        else:
            return ChatOpenAI(
                model=model_name,
                temperature=0.1,
                max_tokens=None,
                timeout=None,
                max_retries=2,
                openai_api_key=api_key
            )
    elif provider == "anthropic":
        model_name = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        anthropic_kwargs = {
            "model": model_name,
            "temperature": 0.1,
            "max_retries": 2,
            "timeout": 120,  # Add 2-minute timeout to prevent hanging
            "max_tokens": 64000,  # Anthropic models require max_tokens to be set
            "anthropic_api_key": api_key
        }
        return ChatAnthropic(**anthropic_kwargs)
    elif provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro-preview-05-06")
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.1,
            max_tokens=None,
            timeout=None,
            max_retries=2,
            google_api_key=api_key
        )
    else:
        raise ValueError(f"Unsupported provider: {provider}")

def evaluate_branch_recommendation(state: DocumentState, branch_suffix: str, provider: str) -> DocumentState:
    """
    Evaluate recommendation for specific branch using same model
    
    Args:
        state: Current document state
        branch_suffix: 'A', 'B', or 'C'
        provider: 'openai', 'anthropic', or 'gemini'
    """
    branch_name = f"branch_{branch_suffix}"
    print(f"Evaluating Branch {branch_suffix} recommendation using {provider}...")
    
    # Get branch data
    branch_key = f"branch_{branch_suffix}"
    if "branch_data" not in state or branch_key not in state["branch_data"]:
        print(f"No branch data found for Branch {branch_suffix} - skipping evaluation")
        return state
    
    branch_data = state["branch_data"][branch_key].copy()
    
    # Check if recommendations exist for this branch
    if not branch_data.get("recommendations"):
        print(f"No recommendations found for Branch {branch_suffix} - skipping evaluation")
        return state
    
    try:
        # Create evaluator LLM (same model as recommender)
        evaluator_llm = create_evaluator_llm(provider)
        print(f"Initialized {provider} evaluator for Branch {branch_suffix}")
        
        # Load evaluation prompt from config
        try:
            with open("./config/prompts.toml", "rb") as f:
                prompts_config = tomllib.load(f)
            
            if "evaluate" not in prompts_config or "evaluation_prompt" not in prompts_config["evaluate"]:
                print("Error: evaluation_prompt not found in config/prompts.toml")
                return state
            
            evaluation_prompt = prompts_config["evaluate"]["evaluation_prompt"]
                
        except Exception as e:
            print(f"Error loading evaluation prompt config: {e}")
            return state
        
        # Prepare evaluation context
        gaps_context = json.dumps(state.get("gaps", {}), ensure_ascii=False, indent=2)
        
        # Load supplementary context if available
        supplementary_context = ""
        try:
            with open("./data/process/A_1.json", "r", encoding="utf-8") as f:
                supplementary_data = json.load(f)
                supplementary_context = json.dumps(supplementary_data, ensure_ascii=False, indent=2)
        except FileNotFoundError:
            supplementary_context = "Brak dodatkowych danych z kwestionariusza."
        except Exception as e:
            print(f"Warning: Error loading supplementary context: {e}")
            supplementary_context = "Brak dodatkowych danych z kwestionariusza."
        
        # Format the evaluation prompt
        formatted_prompt = evaluation_prompt.format(
            recommendations_report=branch_data["recommendations"],
            original_gaps_data=gaps_context,
            original_supplementary_context=supplementary_context
        )
        
        current_iterations = branch_data.get("evaluation_iterations", 0)
        iteration_num = current_iterations + 1
        print(f"Conducting Branch {branch_suffix} evaluation (iteration {iteration_num})...")
        
        # Create message for evaluation
        message = HumanMessage(content=formatted_prompt)
        
        # Generate evaluation
        response = evaluator_llm.invoke([message])
        
        if not response.content:
            print(f"Error: No response from {provider} evaluator for Branch {branch_suffix}")
            return state
        
        evaluation_feedback = response.content.strip()
        
        # Increment iteration counter
        branch_data["evaluation_iterations"] = current_iterations + 1
        
        # Store evaluation feedback
        branch_data["evaluation_feedback"] = evaluation_feedback
        
        # Parse evaluation result using config format
        evaluation_lower = evaluation_feedback.lower()
        
        # Look for score patterns as defined in the evaluation prompt format
        score_patterns = [
            r'łączny wynik.*?(\d+)/100',
            r'wynik.*?(\d+)/100', 
            r'punktów.*?(\d+)/100',
            r'(\d+)/100\s*punktów'
        ]
        
        score = None
        for pattern in score_patterns:
            match = re.search(pattern, evaluation_lower)
            if match:
                score = int(match.group(1))
                break
        
        # Determine approval based on score and quality level from config format
        approved = False
        if score is not None:
            approved = score >= MIN_APPROVAL_SCORE
            print(f"Branch {branch_suffix} evaluation score: {score}/100 (threshold: {MIN_APPROVAL_SCORE})")
            
            # Also check for quality level indicators from the config format
            quality_levels = ["doskonały", "bardzo dobry"]  # Levels that indicate approval
            if any(level in evaluation_lower for level in quality_levels):
                approved = True
        else:
            # Fallback to quality level detection from config format
            approval_indicators = ["doskonały", "bardzo dobry", "akceptuję"]
            rejection_indicators = ["wymagający poprawy", "niewystarczający"]
            
            if any(indicator in evaluation_lower for indicator in approval_indicators):
                approved = True
            elif any(indicator in evaluation_lower for indicator in rejection_indicators):
                approved = False
            else:
                # For iteration 3, approve regardless (final report)
                approved = branch_data["evaluation_iterations"] >= MAX_EVALUATION_ITERATIONS
        
        # Special handling for final iteration (iteration 3)
        if branch_data["evaluation_iterations"] >= MAX_EVALUATION_ITERATIONS:
            approved = True  # Force approval on final iteration
            print(f"📋 Branch {branch_suffix} final iteration ({MAX_EVALUATION_ITERATIONS}) reached - approving for consensus")
        
        branch_data["recommendation_approved"] = approved
        
        if approved:
            if branch_data["evaluation_iterations"] >= MAX_EVALUATION_ITERATIONS:
                print(f"✅ Branch {branch_suffix} final recommendation ready for consensus")
            else:
                print(f"✅ Branch {branch_suffix} recommendations APPROVED by evaluator")
            
            # Save FINAL version of branch recommendation when approved/completed
            save_final_branch_recommendation(state, branch_suffix, provider)
        else:
            print(f"❌ Branch {branch_suffix} recommendations need revision (iteration {branch_data['evaluation_iterations']}/{MAX_EVALUATION_ITERATIONS})")
        
        # Save detailed evaluation to file
        evaluation_filename = f"A_evaluation_branch_{branch_suffix}_{provider}_iter_{branch_data['evaluation_iterations']}.md"
        reports_dir = "./data/reports/interim_reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        evaluation_path = f"{reports_dir}/{evaluation_filename}"
        try:
            with open(evaluation_path, "w", encoding="utf-8") as f:
                f.write(f"# Branch {branch_suffix} Evaluation Report - Iteration {branch_data['evaluation_iterations']}\\n\\n")
                
                # Status based on iteration and approval
                if branch_data['evaluation_iterations'] >= MAX_EVALUATION_ITERATIONS:
                    status = "FINAL_BRANCH_READY"
                elif approved:
                    status = "APPROVED"
                else:
                    status = "REVISION_NEEDED"
                
                f.write(f"**Status**: {status}\\n")
                f.write(f"**Provider**: {provider.upper()}\\n")
                if score is not None:
                    f.write(f"**Score**: {score}/100\\n")
                f.write(f"**Iteration**: {branch_data['evaluation_iterations']}/{MAX_EVALUATION_ITERATIONS}\\n")
                f.write(f"**Timestamp**: {Path().absolute()}\\n\\n")
                f.write("## Detailed Evaluation (from config/prompts.toml criteria)\\n\\n")
                f.write(evaluation_feedback)
            print(f"Branch {branch_suffix} evaluation saved to {evaluation_path}")
        except Exception as e:
            print(f"Warning: Could not save Branch {branch_suffix} evaluation to file: {e}")
        
        print(f"Branch {branch_suffix} evaluation completed successfully")
        
        # Return state update using reducer-compatible format
        branch_update = {
            branch_key: branch_data
        }
        
        return {
            "branch_data": branch_update
        }
        
    except Exception as e:
        print(f"Error during Branch {branch_suffix} evaluation: {e}")
        # On error, approve after max iterations to deliver final report
        if branch_data.get("evaluation_iterations", 0) >= MAX_EVALUATION_ITERATIONS:
            branch_data["recommendation_approved"] = True
            branch_data["evaluation_feedback"] = f"Evaluation error after {MAX_EVALUATION_ITERATIONS} iterations. Branch ready for consensus."
            print(f"📋 Delivering Branch {branch_suffix} for consensus due to evaluation error")
            
            return {
                "branch_data": {
                    branch_key: branch_data
                }
            }
        return state

# Branch-specific evaluation functions
def evaluation_A(state: DocumentState) -> DocumentState:
    """Branch A: OpenAI evaluation"""
    print("🔍 evaluation_A node called!")
    print(f"DEBUG: evaluation_A - Node execution started at: {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}")
    import time
    node_start = time.time()
    
    result = evaluate_branch_recommendation(state, "A", "openai")
    
    node_end = time.time()
    print(f"DEBUG: evaluation_A - Node completed in {node_end - node_start:.2f} seconds")
    return result

def evaluation_B(state: DocumentState) -> DocumentState:
    """Branch B: Claude evaluation"""
    print("🔍 evaluation_B node called!")
    print(f"DEBUG: evaluation_B - Node execution started at: {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}")
    import time
    node_start = time.time()
    
    result = evaluate_branch_recommendation(state, "B", "anthropic")
    
    node_end = time.time()
    print(f"DEBUG: evaluation_B - Node completed in {node_end - node_start:.2f} seconds")
    return result

def evaluation_C(state: DocumentState) -> DocumentState:
    """Branch C: Gemini evaluation"""
    print("🔍 evaluation_C node called!")
    print(f"DEBUG: evaluation_C - Node execution started at: {__import__('time').strftime('%Y-%m-%d %H:%M:%S')}")
    import time
    node_start = time.time()
    
    result = evaluate_branch_recommendation(state, "C", "gemini")
    
    node_end = time.time()
    print(f"DEBUG: evaluation_C - Node completed in {node_end - node_start:.2f} seconds")
    return result