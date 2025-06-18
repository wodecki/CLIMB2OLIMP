import os
import json
import re
import tomllib
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from state import DocumentState

# Load environment variables
load_dotenv()

def extract_score_from_feedback(feedback: str) -> int:
    """Extract score from evaluation feedback"""
    if not feedback:
        return 0
    
    score_patterns = [
        r'łączny wynik.*?(\d+)/100',
        r'wynik.*?(\d+)/100', 
        r'punktów.*?(\d+)/100',
        r'(\d+)/100\s*punktów'
    ]
    
    for pattern in score_patterns:
        match = re.search(pattern, feedback.lower())
        if match:
            return int(match.group(1))
    
    return 0  # Default score if not found

def consensus(state: DocumentState) -> DocumentState:
    """
    Generate consensus recommendation from all branches using OpenAI
    
    Args:
        state: Current document state with completed branch recommendations
        
    Returns:
        Updated state with consensus recommendation
    """
    print("Generating consensus recommendation from all branches...")
    
    # Check which branches have completed recommendations
    available_branches = []
    branch_data = {}
    
    for branch_suffix, provider in [("A", "openai"), ("B", "anthropic"), ("C", "gemini")]:
        branch_key = f"branch_{branch_suffix}"
        branch_info = state.get("branch_data", {}).get(branch_key, {})
        
        if branch_info.get("recommendations") and (branch_info.get("recommendation_approved") or branch_info.get("evaluation_iterations", 0) >= 3):
            available_branches.append(branch_suffix)
            
            # Extract score from evaluation feedback
            score = extract_score_from_feedback(branch_info.get("evaluation_feedback", ""))
            
            branch_data[branch_suffix] = {
                "provider": provider,
                "recommendation": branch_info["recommendations"],
                "score": score,
                "iterations": branch_info.get("evaluation_iterations", 0),
                "approved": branch_info.get("recommendation_approved", False),
                "evaluation_feedback": branch_info.get("evaluation_feedback", "")
            }
    
    print(f"Available branches for consensus: {available_branches}")
    
    if len(available_branches) < 2:
        print(f"Warning: Only {len(available_branches)} branch(es) available. Proceeding with available data.")
        if len(available_branches) == 0:
            print("Error: No completed branches found for consensus")
            return state
    
    try:
        # Load consensus prompt from config
        try:
            with open("./config/prompts.toml", "rb") as f:
                prompts_config = tomllib.load(f)
            
            if "consensus" not in prompts_config or "consensus_prompt" not in prompts_config["consensus"]:
                print("Error: consensus_prompt not found in config/prompts.toml")
                return state
            
            consensus_prompt_template = prompts_config["consensus"]["consensus_prompt"]
                
        except Exception as e:
            print(f"Error loading consensus prompt config: {e}")
            return state
        
        google_api_key = os.getenv("GOOGLE_API_KEY")
        print(f"Google API key available: {bool(google_api_key)}")
        if google_api_key:
            print(f"API key length: {len(google_api_key)}")
        
        # Use Gemini model from environment configuration
        gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
        consensus_llm = ChatGoogleGenerativeAI(
            model=gemini_model,      # Read from GEMINI_MODEL env var
            temperature=0.1,         # Low temperature for consistent synthesis
            max_tokens=20000,        # Higher limit for 7000-word reports
            timeout=600,             # Extended timeout for longer reports
            max_retries=3,           # Moderate retries to avoid excessive delays
            google_api_key=google_api_key,
            request_timeout=600      # Request-level timeout
        )
        
        print(f"Initialized consensus model: {gemini_model} (extended output)")
        
        # Prepare consensus prompt data
        gaps_json = json.dumps(state.get('gaps', {}), ensure_ascii=False, indent=2)
        
        # Build branch data for prompt
        branch_data_text = ""
        for branch_suffix in available_branches:
            data = branch_data[branch_suffix]
            status_text = 'APPROVED' if data['approved'] else 'FINAL (3 iterations)'
            
            branch_data_text += f"""

**BRANCH {branch_suffix}: {data['provider'].upper()}**
- Assessment Score: {data['score']}/100
- Iterations: {data['iterations']}/3
- Status: {status_text}

RECOMMENDATIONS:
{data['recommendation']}

---
"""
        
        # Format the consensus prompt with data
        consensus_prompt = consensus_prompt_template.format(
            gaps_data=gaps_json,
            branch_data=branch_data_text
        )

        print("Generating consensus recommendation...")
        print(f"Prompt length: {len(consensus_prompt)} characters")
        
        # Create message for consensus
        message = HumanMessage(content=consensus_prompt)
        
        # Generate consensus recommendation with retry logic
        max_attempts = 3
        response = None
        for attempt in range(max_attempts):
            try:
                print(f"Consensus attempt {attempt + 1}/{max_attempts}...")
                response = consensus_llm.invoke([message])
                if response and response.content:
                    print(f"✅ Consensus generation successful on attempt {attempt + 1}")
                    break
                else:
                    print(f"⚠️ Empty response on attempt {attempt + 1}")
            except Exception as e:
                print(f"❌ Consensus attempt {attempt + 1} failed: {e}")
                if attempt == max_attempts - 1:
                    print("🔄 All consensus attempts failed, using fallback strategy")
                    # Use the highest-scoring individual recommendation as fallback
                    if available_branches:
                        best_branch = max(available_branches, key=lambda x: branch_data[x]["score"])
                        print(f"📋 Fallback: Using best branch {best_branch} ({branch_data[best_branch]['provider']}) with score {branch_data[best_branch]['score']}/100")
                        
                        state["consensus_recommendation"] = branch_data[best_branch]["recommendation"]
                        state["recommendations"] = branch_data[best_branch]["recommendation"]
                        
                        # Save fallback report
                        fallback_filename = "A_recommendations_CONSENSUS_FALLBACK.md"
                        reports_dir = "./data/reports"
                        os.makedirs(reports_dir, exist_ok=True)
                        
                        fallback_path = f"{reports_dir}/{fallback_filename}"
                        try:
                            with open(fallback_path, "w", encoding="utf-8") as f:
                                f.write(f"# FALLBACK RECOMMENDATION REPORT\\n\\n")
                                f.write(f"**Note**: Consensus generation failed. Using best individual branch.\\n")
                                f.write(f"**Selected Branch**: {best_branch} ({branch_data[best_branch]['provider'].upper()})\\n")
                                f.write(f"**Score**: {branch_data[best_branch]['score']}/100\\n")
                                f.write(f"**Iterations**: {branch_data[best_branch]['iterations']}/3\\n\\n")
                                f.write("---\\n\\n")
                                f.write(branch_data[best_branch]["recommendation"])
                            print(f"📁 Fallback report saved to {fallback_path}")
                        except Exception as fe:
                            print(f"Error saving fallback report: {fe}")
                        
                        return state
                    else:
                        print("❌ No branches available for fallback")
                        return state
                else:
                    print(f"⏳ Waiting 30 seconds before retry...")
                    import time
                    time.sleep(30)
        
        print(f"Response received: {bool(response.content)}")
        if response.content:
            print(f"Response length: {len(response.content)} characters")
            print(f"Response preview: {response.content[:200]}...")
        
        if not response.content:
            print("Error: No response from consensus model")
            return state
            
        # Clean the response
        consensus_recommendation = response.content.strip()
        if consensus_recommendation.startswith('```markdown'):
            consensus_recommendation = consensus_recommendation[11:]
        if consensus_recommendation.startswith('```'):
            consensus_recommendation = consensus_recommendation[3:]
        if consensus_recommendation.endswith('```'):
            consensus_recommendation = consensus_recommendation[:-3]
        consensus_recommendation = consensus_recommendation.strip()
        
        # Store consensus recommendation in state
        state["consensus_recommendation"] = consensus_recommendation
        
        # Also store in legacy field for backward compatibility
        state["recommendations"] = consensus_recommendation
        
        # Save consensus report to file (primary location)
        consensus_filename = "A_recommendations_CONSENSUS_FINAL.md"
        reports_dir = "./data/reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        consensus_path = f"{reports_dir}/{consensus_filename}"
        try:
            with open(consensus_path, "w", encoding="utf-8") as f:
                f.write(f"# FINAL CONSENSUS RECOMMENDATION REPORT\\n\\n")
                f.write(f"**Generated from**: {len(available_branches)} AI analysis branches\\n")
                branch_info = ', '.join(f'{b} ({branch_data[b]["provider"].upper()}: {branch_data[b]["score"]}/100)' for b in available_branches)
                f.write(f"**Branches**: {branch_info}\\n")
                f.write(f"**Consensus Model**: {gemini_model}\\n")
                f.write(f"**Timestamp**: {Path().absolute()}\\n\\n")
                f.write("---\\n\\n")
                f.write(consensus_recommendation)
            print(f"✅ FINAL consensus recommendation saved to {consensus_path}")
        except Exception as e:
            print(f"Error saving consensus recommendation: {e}")
        
        # Also save to main recommendation file for backward compatibility
        main_filename = "A_recommendations.md"
        main_path = f"{reports_dir}/{main_filename}"
        try:
            with open(main_path, "w", encoding="utf-8") as f:
                f.write(consensus_recommendation)
            print(f"✅ Final recommendation also saved to {main_path}")
        except Exception as e:
            print(f"Warning: Could not save to main recommendation file: {e}")
        
        # Create summary file with branch comparison
        summary_filename = "A_consensus_summary.md"
        interim_reports_dir = "./data/reports/interim_reports"
        os.makedirs(interim_reports_dir, exist_ok=True)
        summary_path = f"{interim_reports_dir}/{summary_filename}"
        try:
            with open(summary_path, "w", encoding="utf-8") as f:
                f.write(f"# Consensus Generation Summary\\n\\n")
                f.write(f"## Branch Performance Overview\\n\\n")
                
                for branch_suffix in available_branches:
                    data = branch_data[branch_suffix]
                    f.write(f"### Branch {branch_suffix}: {data['provider'].upper()}\\n")
                    f.write(f"- **Score**: {data['score']}/100\\n")
                    f.write(f"- **Iterations**: {data['iterations']}/3\\n")
                    f.write(f"- **Status**: {'✅ Approved' if data['approved'] else '📋 Final (3 iterations)'}\\n")
                    f.write(f"- **File**: A_recommendations_branch_{branch_suffix}_{data['provider']}.md\\n\\n")
                
                f.write(f"## Consensus Details\\n\\n")
                f.write(f"- **Total branches processed**: {len(available_branches)}\\n")
                f.write(f"- **Consensus model**: {gemini_model}\\n")
                f.write(f"- **Final report**: {consensus_filename}\\n")
                
            print(f"Consensus summary saved to {summary_path}")
        except Exception as e:
            print(f"Warning: Could not save consensus summary: {e}")
        
        print("🎉 Consensus recommendation generated successfully!")
        print(f"📊 Synthesized from {len(available_branches)} branch recommendations")
        print(f"📁 Final report: {consensus_path}")
        
        return state
        
    except Exception as e:
        print(f"Error generating consensus recommendation: {e}")
        # Fallback: use the highest-scoring recommendation if consensus fails
        if available_branches:
            best_branch = max(available_branches, key=lambda x: branch_data[x]["score"])
            print(f"Fallback: Using best branch {best_branch} recommendation")
            state["consensus_recommendation"] = branch_data[best_branch]["recommendation"]
            state["recommendations"] = branch_data[best_branch]["recommendation"]
        return state