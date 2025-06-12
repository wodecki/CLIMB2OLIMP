import os
import sys
import traceback
import logging
from datetime import datetime

# Setup comprehensive logging
def setup_logging():
    """Setup comprehensive logging for post-mortem analysis"""
    # Create logs directory
    os.makedirs("./logs", exist_ok=True)
    
    # Generate timestamp for log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"./logs/olimp_analysis_{timestamp}.log"
    
    # Setup logging configuration
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)  # Also output to console
        ]
    )
    
    # Log system information
    logger = logging.getLogger(__name__)
    logger.info("="*60)
    logger.info("OLIMP ANALYSIS SESSION STARTED")
    logger.info("="*60)
    logger.info(f"Log file: {log_filename}")
    logger.info(f"Working directory: {os.getcwd()}")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Process PID: {os.getpid()}")
    
    return logger, log_filename

# Initialize logging
logger, log_file = setup_logging()

logger.debug("Starting main.py...")
logger.debug("About to import graph...")

# Import the application
from graph import app
logger.debug("Graph imported successfully!")

def main():
    """
    Main function to run the document processing process
    """
    logger.info("Starting OLIMP document processing process...")
    logger.debug(f"Python working directory: {os.getcwd()}")
    
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
    
    logger.debug(f"Initial state keys: {list(initial_state.keys())}")
    logger.info("About to invoke graph...")
    
    # Check if required files exist
    required_files = [
        "./data/process/A.json",
        "./data/process/A_gaps.json"
    ]
    
    logger.info("Checking required files...")
    for file_path in required_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            logger.info(f"✅ Required file exists: {file_path} ({size} bytes)")
        else:
            logger.warning(f"❌ Missing required file: {file_path}")
    
    # Check environment variables
    env_vars = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY"]
    logger.info("Checking environment variables...")
    missing_keys = []
    for var in env_vars:
        value = os.getenv(var)
        if value:
            logger.info(f"✅ {var} is set (length: {len(value)})")
        else:
            logger.error(f"❌ {var} is NOT set")
            missing_keys.append(var)
    
    if missing_keys:
        logger.critical(f"CRITICAL: Missing API keys: {', '.join(missing_keys)}")
        logger.critical("OLIMP analysis cannot proceed without API keys")
        logger.critical("Please set the required environment variables and try again")
        return
    
    # Invoke the app with the initial state
    try:
        logger.info("Starting graph execution with recursion limit...")
        logger.debug("Initializing execution timer...")
        import time
        start_time = time.time()
        
        # Configure execution with higher recursion limit and reduced concurrency
        from langchain_core.runnables import RunnableConfig
        config = RunnableConfig(
            recursion_limit=100,  # Increase from default 25 to 100
            max_concurrency=1  # Reduce concurrency to avoid simultaneous API calls hanging
        )
        
        logger.debug("Configuration created successfully")
        logger.info("About to call app.invoke()...")
        logger.info(f"Current time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Add a timeout mechanism
        import signal
        
        def timeout_handler(signum, frame):
            timeout_msg = f"⏰ TIMEOUT DETECTED - execution taking too long! Time elapsed: {time.time() - start_time:.2f} seconds"
            logger.critical(timeout_msg)
            raise TimeoutError("Graph execution timeout after 5 minutes")
        
        # Set 5-minute timeout
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(300)  # 5 minutes
        logger.debug("5-minute timeout set")
        
        try:
            logger.info("🚀 STARTING GRAPH EXECUTION...")
            logger.critical("DEBUG: About to call app.invoke() with LangGraph")
            logger.info(f"Initial state structure: {list(initial_state.keys())}")
            
            # Log graph structure for debugging
            logger.debug("Graph nodes and edges configuration:")
            logger.debug("Expected flow: START -> extract_answers -> identify_gaps -> [recommend_A, recommend_B, recommend_C]")
            
            response = app.invoke(initial_state, config=config)
            signal.alarm(0)  # Cancel timeout
            
            end_time = time.time()
            execution_time = end_time - start_time
            logger.info(f"✅ app.invoke() completed successfully in {execution_time:.2f} seconds!")
            
            # Log the results
            logger.info("=" * 50)
            logger.info("DOCUMENT PROCESSING COMPLETE")
            logger.info("=" * 50)
            
            logger.info("Document Content Summary:")
            content_preview = response["document_content"][:500] + "..." if len(response["document_content"]) > 500 else response["document_content"]
            logger.info(f"Content: {content_preview}")
            
            # Save final summary to log
            logger.info(f"📁 Complete log saved to: {log_file}")
            logger.info("Analysis completed successfully!")
            
        except TimeoutError as te:
            logger.critical(f"⏰ EXECUTION TIMEOUT: {te}")
            logger.critical(f"Log file for analysis: {log_file}")
            signal.alarm(0)  # Cancel timeout
            raise
        
    except Exception as e:
        error_msg = f"Error running the processing: {e}"
        logger.error(error_msg)
        logger.error(f"Traceback: {traceback.format_exc()}")
        logger.error("Checking process status...")
        logger.error(f"Process still running at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.critical(f"📁 Error log saved to: {log_file}")
        
        # Also save a crash report
        crash_report_path = f"./logs/crash_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        try:
            with open(crash_report_path, 'w', encoding='utf-8') as f:
                f.write(f"OLIMP Analysis Crash Report\n")
                f.write(f"Timestamp: {datetime.now()}\n")
                f.write(f"Process PID: {os.getpid()}\n")
                f.write(f"Working Directory: {os.getcwd()}\n")
                f.write(f"Error: {error_msg}\n")
                f.write(f"Traceback:\n{traceback.format_exc()}\n")
                f.write(f"Full log file: {log_file}\n")
            logger.error(f"💥 Crash report saved to: {crash_report_path}")
        except Exception as crash_error:
            logger.error(f"Failed to save crash report: {crash_error}")

if __name__ == "__main__":
    main()
