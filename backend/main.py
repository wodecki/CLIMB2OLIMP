import os
import sys
import json
from dotenv import load_dotenv
from pprint import pprint
import datetime
from fpdf import FPDF
import traceback
import re

# Load environment variables
load_dotenv(override=True)

# Retrieve the API key
openai_api_key = os.getenv('OPENAI_API_KEY')

# Import the application
from graph.graph import app
from graph.state import OverallState
from langgraph.types import Command
from graph.status_manager import status_manager

def save_report_as_markdown(report_text, filename):
    """Save the report as a Markdown file with enhanced formatting"""
    try:
        # Add title and date
        current_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Add a table of contents placeholder
        toc = """
## Table of Contents
- [Executive Summary](#executive-summary)
- [Introduction](#introduction)
- [Detailed Gap Analysis](#detailed-gap-analysis)
- [Detailed Questions for Improvement Analysis](#detailed-questions-for-improvement-analysis)
- [Analyst Sections](#analyst-sections)
- [Implementation Roadmap](#implementation-roadmap)
- [Cost-Benefit Analysis](#cost-benefit-analysis)
- [Conclusion and Next Steps](#conclusion-and-next-steps)
"""
        
        # Enhance the markdown formatting
        # 1. Replace plain text headings with markdown headings
        enhanced_text = report_text
        
        # 2. Add horizontal rules before major sections
        enhanced_text = enhanced_text.replace("Executive Summary", "---\n\n## Executive Summary")
        enhanced_text = enhanced_text.replace("Introduction", "---\n\n## Introduction")
        enhanced_text = enhanced_text.replace("Detailed Gap Analysis", "---\n\n## Detailed Gap Analysis")
        enhanced_text = enhanced_text.replace("Detailed Questions for Improvement Analysis", "---\n\n## Detailed Questions for Improvement Analysis")
        enhanced_text = enhanced_text.replace("Analyst Sections", "---\n\n## Analyst Sections")
        enhanced_text = enhanced_text.replace("Implementation Roadmap", "---\n\n## Implementation Roadmap")
        enhanced_text = enhanced_text.replace("Cost-Benefit Analysis", "---\n\n## Cost-Benefit Analysis")
        enhanced_text = enhanced_text.replace("Conclusion and Next Steps", "---\n\n## Conclusion and Next Steps")
        
        # 3. Format analyst names as subheadings
        enhanced_text = re.sub(r'Analyst: ([^\n]+)', r'### Analyst: \1', enhanced_text)
        
        # Combine everything
        markdown_content = f"""# Generative AI Readiness Report

*Generated on: {current_date}*

{toc}

{enhanced_text}
"""
        
        # Save the markdown file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        print(f"Enhanced Markdown report saved as {filename}")
        return True
    except Exception as e:
        print(f"Error saving Markdown report: {e}")
        return False

# Signal handler for SIGUSR1
def handle_sigusr1(signum, frame):
    print("Received SIGUSR1 signal - checking for user input")
    # No need to do anything here, the human_feedback node will check for the file

def main():
    try:
        # Import questionnaire results
        workspace_root = os.path.abspath(os.path.dirname(__file__))
        
        # Save the process ID to a file so the frontend can signal it
        pid_file_path = os.path.join(workspace_root, 'analysis_pid.txt')
        with open(pid_file_path, 'w') as f:
            f.write(str(os.getpid()))
        
        # Register signal handler for SIGUSR1 (only on Unix-like systems)
        if sys.platform != 'win32':
            import signal
            signal.signal(signal.SIGUSR1, handle_sigusr1)
        
        # Check if running in non-interactive mode
        is_non_interactive = os.environ.get('NON_INTERACTIVE', 'false').lower() == 'true'
        
        # Use sample_answer.json in non-interactive mode to ensure we have data
        if is_non_interactive:
            questionnaire_file = os.path.join(workspace_root, 'data/sample_answer.json')
        else:
            questionnaire_file = os.path.join(workspace_root, 'data/answer_1.json')
        
        with open(questionnaire_file, 'r') as f:
            questionnaire = json.load(f)
        
        # Initialize the state with all required fields
        initial_state = {
            "analysts": [],
            "questionnaire": questionnaire,
            "maturity_levels": {},
            "strategic_goals": {},
            "areas_for_improvement": {},
            "questions_for_improvement": {},
            "diagnosis": [],
            "recommendations": [],
            "report": "",
            "user_feedback": ""
        }
        
        # Calculate maturity levels first
        from graph.nodes.maturity_level import calculate_maturity_level
        maturity_result = calculate_maturity_level(initial_state)
        maturity_levels = maturity_result.get("maturity_levels", {})
        
        # Categories for strategic goals
        categories = [
            "Role i Współpraca",
            "Szkolenie",
            "Działania i Przepływ",
            "Podejmowanie Decyzji",
            "Procesy ZW",
            "Techniki ZW",
            "Metody",
            "Komputeryzacja i Oprogramowanie"
        ]
        
        # Initialize empty strategic goals - they will be collected by the human_feedback node
        strategic_goals = {}
        
        # Print the maturity levels for reference
        print("\nCategory Maturity Levels:")
        print("------------------------")
        for category in categories:
            print(f"{category}: {maturity_levels.get(category, 'N/A')}")
        print("\nStrategic goals will be collected by the LangGraph workflow.")
        
        # Print the collected strategic goals
        print("\nStrategic Goals:")
        for category, level in strategic_goals.items():
            print(f"{category}: {level}")
        
        # Update the initial state with the strategic goals and maturity levels
        initial_state["strategic_goals"] = strategic_goals
        initial_state["maturity_levels"] = maturity_levels
        
        # Thread configuration
        thread_config = {"configurable": {"thread_id": "1"}}
        
        # Check if running from the frontend (with stdio redirected)
        is_frontend = os.environ.get('NON_INTERACTIVE', 'false').lower() == 'false' and not sys.stdin.isatty()
        
        if is_frontend:
            # When running from the frontend, use a different approach to handle interrupts
            # The human_feedback node will check for input from a file instead of using input()
            try:
                # Just run the app without handling interrupts directly
                app.invoke(initial_state, thread_config)
            except Exception as e:
                print(f"Error during execution: {e}")
                traceback.print_exc()
        else:
            # Use stream instead of invoke to properly handle interruptions in terminal mode
            for event in app.stream(initial_state, thread_config, stream_mode="updates"):
                # Check if this is an interrupt event
                if "__interrupt__" in event:
                    # Get the interrupt message
                    interrupt_info = event["__interrupt__"][0]
                    print(f"\n{interrupt_info.value}")
                    
                    # Get user input
                    user_feedback = input("> ")
                    
                    # Resume execution with the user's input
                    for resumed_event in app.stream(
                        Command(resume=user_feedback), 
                        thread_config, 
                        stream_mode="updates"
                    ):
                        # Check if this is another interrupt event
                        if "__interrupt__" in resumed_event:
                            # Get the interrupt message
                            interrupt_info = resumed_event["__interrupt__"][0]
                            print(f"\n{interrupt_info.value}")
                            
                            # Get user input
                            user_feedback = input("> ")
                            
                            # Resume execution with the user's input
                            app.stream(
                                Command(resume=user_feedback), 
                                thread_config, 
                                stream_mode="updates"
                            )
        
        # Get the final state after all processing
        final_state = app.get_state(thread_config)

        # Print aggregated analysts
        if "analysts" in final_state:
            print("\nAnalysts:")
            for analyst in final_state["analysts"]:
                print(f"  - Name: {analyst.name}")
            print("\n")
        
        # Print aggregated diagnosis
        if "diagnosis" in final_state:
            print("Diagnosis:")
            for diag in final_state["diagnosis"]:
                print(f"  Analyst: {diag['author']}")
                print(f"  Diagnosis: {diag['diagnosis'][:100]}...") # Print just the beginning
                print("")
        
        # Print aggregated recommendations
        if "recommendations" in final_state:
            print("Recommendations:")
            for rec in final_state["recommendations"]:
                print(f"  Analyst: {rec['author']}")
                print(f"  Recommendation: {rec['recommendation'][:100]}...") # Print just the beginning
                print("")
        
        # Get the report path from the final state
        # StateSnapshot object doesn't have a get method, so we need to access the attribute directly
        report_path = None
        if hasattr(final_state, "filepath"):
            report_path = final_state.filepath
        elif isinstance(final_state, dict) and "filepath" in final_state:
            report_path = final_state["filepath"]
        
        # Update the status with the report path
        status_manager.update_node("completed", report_path)
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        # Update status to error
        status_manager.update_node("error")
        
        # Try to generate a simple error report
        try:
            # Create reports directory if it doesn't exist
            reports_dir = os.path.join(workspace_root, 'reports')
            os.makedirs(reports_dir, exist_ok=True)
            
            # Generate a filename based on current timestamp
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"error_report_{timestamp}.md"
            filepath = os.path.join(reports_dir, filename)
            
            # Create a simple error report
            error_report = f"""# Error Report

## Error Details
An error occurred during the analysis process:

```
{str(e)}
```

## Traceback
```
{traceback.format_exc()}
```

## Analysis State
The analysis was interrupted during execution. Please try running the analysis again.
"""
            
            # Write the error report to the file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(error_report)
            
            # Update the status with the error report path
            status_manager.update_node("error", filepath)
            
            print(f"Error report saved as {filepath}")
        except Exception as err:
            print(f"Error creating error report: {err}")
    finally:
        # Clean up the PID file and stop file
        pid_file_path = os.path.join(workspace_root, 'analysis_pid.txt')
        stop_file_path = os.path.join(workspace_root, 'stop_analysis.txt')
        
        # Remove PID file
        if os.path.exists(pid_file_path):
            try:
                os.remove(pid_file_path)
            except Exception as e:
                print(f"Error removing PID file: {e}")
        
        # Remove stop file
        if os.path.exists(stop_file_path):
            try:
                os.remove(stop_file_path)
            except Exception as e:
                print(f"Error removing stop file: {e}")
        
        # Ensure status file is cleaned up when the script exits
        # status_manager.cleanup()  # Uncomment if you want to delete the status file completely
        pass
    
if __name__ == "__main__":
    main()
