#!/usr/bin/env python3
"""
Post-mortem log analysis tool for OLIMP analysis sessions
Helps identify where the process hangs and provides detailed analysis
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path
import argparse

def find_latest_log():
    """Find the most recent log file"""
    logs_dir = Path("./logs")
    if not logs_dir.exists():
        print("No logs directory found")
        return None
    
    log_files = list(logs_dir.glob("olimp_analysis_*.log"))
    if not log_files:
        print("No OLIMP analysis log files found")
        return None
    
    # Sort by modification time
    latest_log = max(log_files, key=lambda f: f.stat().st_mtime)
    return latest_log

def analyze_log_file(log_path):
    """Analyze a single log file for execution flow and issues"""
    print(f"Analyzing log file: {log_path}")
    print("=" * 60)
    
    with open(log_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Extract key information
    session_info = extract_session_info(lines)
    node_execution = extract_node_execution(lines)
    errors = extract_errors(lines)
    timing_analysis = analyze_timing(lines)
    
    # Generate report
    generate_report(session_info, node_execution, errors, timing_analysis, log_path)

def extract_session_info(lines):
    """Extract basic session information"""
    info = {
        'start_time': None,
        'process_pid': None,
        'working_dir': None,
        'python_version': None,
        'file_checks': {},
        'env_vars': {}
    }
    
    for line in lines:
        if 'OLIMP ANALYSIS SESSION STARTED' in line:
            info['start_time'] = extract_timestamp(line)
        elif 'Process PID:' in line:
            info['process_pid'] = line.split('Process PID:')[-1].strip()
        elif 'Working directory:' in line:
            info['working_dir'] = line.split('Working directory:')[-1].strip()
        elif 'Python version:' in line:
            info['python_version'] = line.split('Python version:')[-1].strip()
        elif 'Required file exists:' in line:
            file_match = re.search(r'Required file exists: (.+?) \((\d+) bytes\)', line)
            if file_match:
                info['file_checks'][file_match.group(1)] = int(file_match.group(2))
        elif 'is set (length:' in line:
            env_match = re.search(r'(\w+_API_KEY) is set \(length: (\d+)\)', line)
            if env_match:
                info['env_vars'][env_match.group(1)] = int(env_match.group(2))
    
    return info

def extract_node_execution(lines):
    """Extract node execution information"""
    nodes = {}
    current_node = None
    
    for line in lines:
        # Node start
        node_start_match = re.search(r'(\w+) node called!', line)
        if node_start_match:
            node_name = node_start_match.group(1)
            current_node = node_name
            if node_name not in nodes:
                nodes[node_name] = {
                    'start_time': extract_timestamp(line),
                    'end_time': None,
                    'duration': None,
                    'status': 'started',
                    'progress_steps': [],
                    'errors': []
                }
        
        # Node completion
        if current_node and f'{current_node} node completed' in line:
            duration_match = re.search(r'completed in ([\d.]+) seconds', line)
            if duration_match:
                nodes[current_node]['duration'] = float(duration_match.group(1))
                nodes[current_node]['end_time'] = extract_timestamp(line)
                nodes[current_node]['status'] = 'completed'
        
        # Progress steps
        if current_node and 'PROGRESS:' in line and current_node in line:
            progress_match = re.search(r'PROGRESS: \w+ - (.+)', line)
            if progress_match:
                nodes[current_node]['progress_steps'].append({
                    'time': extract_timestamp(line),
                    'step': progress_match.group(1)
                })
        
        # Node errors
        if current_node and 'ERROR' in line and current_node in line:
            nodes[current_node]['errors'].append({
                'time': extract_timestamp(line),
                'error': line.strip()
            })
            nodes[current_node]['status'] = 'error'
    
    return nodes

def extract_errors(lines):
    """Extract all errors and warnings"""
    errors = []
    warnings = []
    
    for line in lines:
        if ' - ERROR - ' in line:
            errors.append({
                'time': extract_timestamp(line),
                'message': line.strip()
            })
        elif ' - WARNING - ' in line:
            warnings.append({
                'time': extract_timestamp(line),
                'message': line.strip()
            })
        elif ' - CRITICAL - ' in line:
            errors.append({
                'time': extract_timestamp(line),
                'message': line.strip(),
                'critical': True
            })
    
    return {'errors': errors, 'warnings': warnings}

def analyze_timing(lines):
    """Analyze timing and identify potential hangs"""
    timing = {
        'total_duration': None,
        'last_activity': None,
        'potential_hang': False,
        'hang_point': None,
        'graph_execution_start': None,
        'timeout_detected': False
    }
    
    for line in lines:
        if 'STARTING GRAPH EXECUTION' in line:
            timing['graph_execution_start'] = extract_timestamp(line)
        elif 'app.invoke() completed successfully' in line:
            duration_match = re.search(r'in ([\d.]+) seconds', line)
            if duration_match:
                timing['total_duration'] = float(duration_match.group(1))
        elif 'TIMEOUT DETECTED' in line:
            timing['timeout_detected'] = True
            timing['potential_hang'] = True
        
        # Track last activity
        if any(keyword in line for keyword in ['node called', 'PROGRESS:', 'completed']):
            timing['last_activity'] = extract_timestamp(line)
    
    return timing

def extract_timestamp(line):
    """Extract timestamp from log line"""
    timestamp_match = re.search(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
    if timestamp_match:
        return timestamp_match.group(1)
    return None

def generate_report(session_info, node_execution, errors, timing_analysis, log_path):
    """Generate comprehensive analysis report"""
    
    print("📊 OLIMP ANALYSIS LOG REPORT")
    print("=" * 60)
    
    # Session Information
    print("\n🔍 SESSION INFORMATION")
    print("-" * 30)
    print(f"Start Time: {session_info['start_time']}")
    print(f"Process PID: {session_info['process_pid']}")
    print(f"Working Directory: {session_info['working_dir']}")
    
    # File Checks
    print(f"\n📁 FILE CHECKS")
    for file_path, size in session_info['file_checks'].items():
        print(f"  ✅ {file_path}: {size:,} bytes")
    
    # Environment Variables
    print(f"\n🔑 ENVIRONMENT VARIABLES")
    for var, length in session_info['env_vars'].items():
        print(f"  ✅ {var}: {length} characters")
    
    # Node Execution Analysis
    print(f"\n🔧 NODE EXECUTION ANALYSIS")
    print("-" * 30)
    
    completed_nodes = []
    failed_nodes = []
    incomplete_nodes = []
    
    for node_name, node_data in node_execution.items():
        status = node_data['status']
        duration = node_data.get('duration', 'N/A')
        
        if status == 'completed':
            completed_nodes.append((node_name, duration))
            print(f"  ✅ {node_name}: {duration}s")
        elif status == 'error':
            failed_nodes.append(node_name)
            print(f"  ❌ {node_name}: FAILED")
        else:
            incomplete_nodes.append(node_name)
            print(f"  ⏳ {node_name}: INCOMPLETE/HANGING")
    
    # Timing Analysis
    print(f"\n⏱️  TIMING ANALYSIS")
    print("-" * 30)
    
    if timing_analysis['total_duration']:
        print(f"Total Duration: {timing_analysis['total_duration']:.2f} seconds")
    else:
        print("Total Duration: INCOMPLETE")
    
    if timing_analysis['graph_execution_start']:
        print(f"Graph Execution Started: {timing_analysis['graph_execution_start']}")
    
    if timing_analysis['last_activity']:
        print(f"Last Activity: {timing_analysis['last_activity']}")
    
    if timing_analysis['timeout_detected']:
        print("🚨 TIMEOUT DETECTED - Process exceeded 5-minute limit")
    
    # Error Analysis
    print(f"\n🚨 ERROR ANALYSIS")
    print("-" * 30)
    
    if errors['errors']:
        print(f"Errors Found: {len(errors['errors'])}")
        for error in errors['errors'][-3:]:  # Show last 3 errors
            print(f"  ❌ {error['time']}: {error['message'][:100]}...")
    else:
        print("No errors found")
    
    if errors['warnings']:
        print(f"Warnings Found: {len(errors['warnings'])}")
    
    # Hang Analysis
    print(f"\n🔍 HANG ANALYSIS")
    print("-" * 30)
    
    if incomplete_nodes:
        print(f"🚨 POTENTIAL HANG DETECTED")
        print(f"Hanging Node(s): {', '.join(incomplete_nodes)}")
        
        # Find the last node that started but didn't complete
        last_incomplete = incomplete_nodes[-1] if incomplete_nodes else None
        if last_incomplete:
            node_data = node_execution[last_incomplete]
            print(f"Last Progress Steps for {last_incomplete}:")
            for step in node_data['progress_steps'][-3:]:  # Last 3 steps
                print(f"  📍 {step['time']}: {step['step']}")
    else:
        print("✅ No hanging nodes detected")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS")
    print("-" * 30)
    
    if incomplete_nodes:
        print("1. Check API key validity and network connectivity")
        print("2. Verify model availability (especially o3 models)")
        print("3. Check for rate limiting issues")
        print("4. Review the last progress step for clues")
    
    if timing_analysis['timeout_detected']:
        print("5. Consider increasing timeout or optimizing model calls")
    
    # Save detailed report
    report_path = log_path.parent / f"analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("OLIMP Analysis Detailed Report\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Log File: {log_path}\n")
        f.write(f"Analysis Time: {datetime.now()}\n\n")
        
        f.write("Node Execution Details:\n")
        for node_name, node_data in node_execution.items():
            f.write(f"\n{node_name}:\n")
            f.write(f"  Status: {node_data['status']}\n")
            f.write(f"  Duration: {node_data.get('duration', 'N/A')}\n")
            f.write(f"  Progress Steps: {len(node_data['progress_steps'])}\n")
            for step in node_data['progress_steps']:
                f.write(f"    - {step['time']}: {step['step']}\n")
    
    print(f"\n📋 Detailed report saved to: {report_path}")

def main():
    parser = argparse.ArgumentParser(description='Analyze OLIMP analysis logs')
    parser.add_argument('--log-file', help='Specific log file to analyze')
    parser.add_argument('--latest', action='store_true', help='Analyze the latest log file')
    
    args = parser.parse_args()
    
    if args.log_file:
        log_path = Path(args.log_file)
        if not log_path.exists():
            print(f"Log file not found: {log_path}")
            return
    else:
        log_path = find_latest_log()
        if not log_path:
            return
    
    analyze_log_file(log_path)

if __name__ == "__main__":
    main()