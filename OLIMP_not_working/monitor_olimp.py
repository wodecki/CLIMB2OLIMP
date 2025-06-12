#!/usr/bin/env python3
"""
Real-time monitor for OLIMP analysis process
Watches log files and provides live updates
"""

import os
import time
import subprocess
from pathlib import Path

def find_running_olimp_process():
    """Find running OLIMP analysis process"""
    try:
        # Check if analysis_pid.txt exists
        pid_file = Path("./analysis_pid.txt")
        if pid_file.exists():
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Check if process is still running
            try:
                os.kill(pid, 0)  # Signal 0 checks if process exists
                return pid
            except OSError:
                return None
        
        # Fallback: search for python processes running main.py
        result = subprocess.run(['pgrep', '-f', 'python.*main.py'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            pids = result.stdout.strip().split('\n')
            return int(pids[0]) if pids and pids[0] else None
        
        return None
    except Exception as e:
        print(f"Error finding process: {e}")
        return None

def get_latest_log_file():
    """Get the most recent log file"""
    logs_dir = Path("./logs")
    if not logs_dir.exists():
        return None
    
    log_files = list(logs_dir.glob("olimp_analysis_*.log"))
    if not log_files:
        return None
    
    return max(log_files, key=lambda f: f.stat().st_mtime)

def tail_log_file(log_path, lines=10):
    """Get last N lines from log file"""
    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            lines_list = f.readlines()
            return lines_list[-lines:] if len(lines_list) >= lines else lines_list
    except Exception as e:
        return [f"Error reading log: {e}"]

def monitor_olimp():
    """Monitor OLIMP analysis in real-time"""
    print("🔍 OLIMP Analysis Monitor")
    print("=" * 50)
    
    # Check for running process
    pid = find_running_olimp_process()
    if pid:
        print(f"✅ Found running OLIMP process: PID {pid}")
    else:
        print("❌ No running OLIMP process found")
        return
    
    # Find log file
    log_file = get_latest_log_file()
    if not log_file:
        print("❌ No log file found")
        return
    
    print(f"📋 Monitoring log: {log_file}")
    print("-" * 50)
    
    # Track last position in file
    last_size = 0
    node_start_times = {}
    
    try:
        while True:
            # Check if process is still running
            try:
                os.kill(pid, 0)
            except OSError:
                print(f"\n🛑 Process {pid} has terminated")
                break
            
            # Check for new log content
            current_size = log_file.stat().st_size
            if current_size > last_size:
                # Read new content
                with open(log_file, 'r', encoding='utf-8') as f:
                    f.seek(last_size)
                    new_lines = f.readlines()
                
                # Process new lines
                for line in new_lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Extract timestamp and message
                    if ' - INFO - ' in line or ' - ERROR - ' in line or ' - CRITICAL - ' in line:
                        timestamp = line.split(' - ')[0]
                        level = line.split(' - ')[1]
                        message = ' - '.join(line.split(' - ')[2:])
                        
                        # Track node executions
                        if 'node called!' in message:
                            node_name = message.split()[0]
                            node_start_times[node_name] = time.time()
                            print(f"🔍 {timestamp}: {node_name} started")
                        
                        elif 'node completed' in message:
                            node_name = message.split()[0]
                            if node_name in node_start_times:
                                duration = time.time() - node_start_times[node_name]
                                print(f"✅ {timestamp}: {node_name} completed ({duration:.1f}s)")
                            else:
                                print(f"✅ {timestamp}: {message}")
                        
                        elif 'TIMEOUT DETECTED' in message:
                            print(f"🚨 {timestamp}: TIMEOUT - Process hanging!")
                        
                        elif 'STARTING GRAPH EXECUTION' in message:
                            print(f"🚀 {timestamp}: Graph execution started")
                        
                        elif level == 'ERROR' or level == 'CRITICAL':
                            print(f"❌ {timestamp}: {message}")
                        
                        elif 'PROGRESS:' in message:
                            print(f"📍 {timestamp}: {message}")
                        
                        elif any(keyword in message for keyword in ['File exists', 'API_KEY']):
                            print(f"ℹ️  {timestamp}: {message}")
                
                last_size = current_size
            
            time.sleep(2)  # Check every 2 seconds
    
    except KeyboardInterrupt:
        print(f"\n👋 Monitoring stopped")
    
    # Final status
    print(f"\n📊 Final Status Check:")
    recent_lines = tail_log_file(log_file, 10)
    print("Last 10 log lines:")
    for line in recent_lines:
        print(f"  {line.strip()}")

if __name__ == "__main__":
    monitor_olimp()