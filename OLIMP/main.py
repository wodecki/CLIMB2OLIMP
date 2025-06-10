import os
import sys
import traceback

# Import the application
from graph import app
from progress_tracker import progress_tracker

def main():
    """
    Main function to run the document processing process
    """
    print("Starting OLIMP document processing process...")
    progress_tracker.update_step("initialize", "running", "Setting up initial state")
    
    # Initialize empty state with new structure
    initial_state = {
        "document_content": "",
        "answers": {},
        "gaps": {},
        "branch_data": {},
        "consensus_recommendation": None,
        "recommendations": None,
        "evaluation_feedback": None,
        "evaluation_iterations": 0,
        "recommendation_approved": False
    }
    
    # Invoke the app with the initial state
    try:
        progress_tracker.update_step("processing", "running", "Starting OLIMP graph execution")
        response = app.invoke(initial_state)
        
        # Print the results
        progress_tracker.update_step("finalization", "completed", "Analysis completed successfully")
        progress_tracker.mark_completed()
        
        print("=" * 50)
        print("DOCUMENT PROCESSING COMPLETE")
        print("=" * 50)
        
        print("\nDocument Content:")
        print("-" * 20)
        print(response["document_content"][:500] + "..." if len(response["document_content"]) > 500 else response["document_content"])
        
    except Exception as e:
        error_msg = f"Error running the processing: {e}"
        progress_tracker.mark_error(error_msg, "processing")
        print(error_msg)
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    main()
