import os
import json
import time
import sys
import subprocess
import signal

def monitor_status():
    # Get the directory of this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to the status file
    status_file_path = os.path.join(current_dir, 'status.json')
    
    print(f"Monitoring status file at: {status_file_path}")
    print("Press Ctrl+C to stop monitoring")
    
    last_status = None
    
    try:
        while True:
            # Check if the status file exists
            if not os.path.exists(status_file_path):
                if last_status is not None:
                    print("Status file no longer exists.")
                    last_status = None
                time.sleep(1)
                continue
            
            # Read the status file
            try:
                with open(status_file_path, 'r') as f:
                    status_data = json.load(f)
                    
                    # Only print if the status has changed
                    if last_status != status_data:
                        print(f"Status updated at {time.strftime('%H:%M:%S')}:")
                        print(f"  currentNode: {status_data.get('currentNode', 'unknown')}")
                        print(f"  requiresInput: {status_data.get('requiresInput', False)}")
                        if status_data.get('questions'):
                            print(f"  questions: {status_data.get('questions')}")
                        print()
                        
                        last_status = status_data.copy()
            except Exception as e:
                print(f"Error reading status file: {e}")
            
            # Wait before checking again
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopped monitoring.")

def run_analysis():
    # Get the directory of this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to the status file
    status_file_path = os.path.join(current_dir, 'status.json')
    
    # Set initial status
    initial_status = {
        "currentNode": "strategic_planning",
        "requiresInput": False,
        "questions": None
    }
    
    # Write the initial status
    with open(status_file_path, 'w') as f:
        json.dump(initial_status, f, indent=2)
    
    # Path to the virtual environment's Python interpreter
    python_path = os.path.join(current_dir, '.venv', 'bin', 'python')
    
    # Run the analysis
    print("Starting analysis...")
    
    # Set environment variables
    env = os.environ.copy()
    env['NON_INTERACTIVE'] = 'true'
    
    # Run the process
    process = subprocess.Popen(
        [python_path, 'main.py'],
        cwd=current_dir,
        env=env
    )
    
    # Wait for the process to complete
    try:
        process.wait()
    except KeyboardInterrupt:
        print("\nStopping analysis...")
        process.send_signal(signal.SIGTERM)
        process.wait()

def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'run':
        run_analysis()
    else:
        monitor_status()

if __name__ == "__main__":
    main()
