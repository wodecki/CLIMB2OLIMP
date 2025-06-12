# OLIMP Analysis Logging & Monitoring System

This enhanced logging system provides comprehensive post-mortem analysis capabilities for debugging OLIMP analysis hangs and performance issues.

## 📋 What's New

### Enhanced Logging Features
- **Timestamped log files** saved to `./logs/` directory
- **Node-level execution tracking** with timing
- **Progress monitoring** within each node
- **5-minute timeout protection** with automatic logging
- **Crash report generation** for unexpected errors
- **Environment and file validation** logging

### Log File Structure
```
./logs/
├── olimp_analysis_20250106_153045.log    # Main execution log
├── crash_report_20250106_153610.txt      # Crash details (if any)
└── analysis_report_20250106_153720.txt   # Post-mortem analysis
```

## 🚀 How to Use

### 1. Running OLIMP Analysis (Same as Before)
```bash
cd /home/wodecki/LLM/Aron/CLIMB2OLIMP/OLIMP
python main.py
```

The system now automatically logs everything to timestamped files.

### 2. Real-Time Monitoring (NEW)
While OLIMP is running, open a second terminal:

```bash
cd /home/wodecki/LLM/Aron/CLIMB2OLIMP/OLIMP
python monitor_olimp.py
```

This provides real-time updates:
```
🔍 OLIMP Analysis Monitor
==================================================
✅ Found running OLIMP process: PID 1906294
📋 Monitoring log: ./logs/olimp_analysis_20250106_153045.log
--------------------------------------------------
🔍 2025-01-06 15:30:45: extract_answers started
✅ 2025-01-06 15:30:47: extract_answers completed (2.1s)
🔍 2025-01-06 15:30:47: identify_gaps started
📍 2025-01-06 15:30:49: PROGRESS: identify_gaps - status=processing, step=gap_analysis
✅ 2025-01-06 15:30:52: identify_gaps completed (4.8s)
🚀 2025-01-06 15:30:52: Graph execution started
🔍 2025-01-06 15:30:52: recommend_A started
🔍 2025-01-06 15:30:52: recommend_B started
🔍 2025-01-06 15:30:52: recommend_C started
```

### 3. Post-Mortem Analysis (NEW)
After OLIMP completes or hangs, analyze the logs:

```bash
# Analyze the latest log file
python analyze_logs.py --latest

# Or analyze a specific log file
python analyze_logs.py --log-file ./logs/olimp_analysis_20250106_153045.log
```

## 📊 Analysis Report Example

```
📊 OLIMP ANALYSIS LOG REPORT
============================================================

🔍 SESSION INFORMATION
------------------------------
Start Time: 2025-01-06 15:30:45
Process PID: 1906294
Working Directory: /home/wodecki/LLM/Aron/CLIMB2OLIMP/OLIMP

📁 FILE CHECKS
  ✅ ./data/process/A.json: 75,432 bytes
  ✅ ./data/process/A_gaps.json: 12,847 bytes

🔑 ENVIRONMENT VARIABLES
  ✅ OPENAI_API_KEY: 89 characters
  ✅ ANTHROPIC_API_KEY: 108 characters
  ✅ GOOGLE_API_KEY: 67 characters

🔧 NODE EXECUTION ANALYSIS
------------------------------
  ✅ extract_answers: 2.15s
  ✅ identify_gaps: 4.83s
  ⏳ recommend_A: INCOMPLETE/HANGING
  ⏳ recommend_B: INCOMPLETE/HANGING  
  ⏳ recommend_C: INCOMPLETE/HANGING

⏱️ TIMING ANALYSIS
------------------------------
Total Duration: INCOMPLETE
Graph Execution Started: 2025-01-06 15:30:52
Last Activity: 2025-01-06 15:30:52
🚨 TIMEOUT DETECTED - Process exceeded 5-minute limit

🔍 HANG ANALYSIS
------------------------------
🚨 POTENTIAL HANG DETECTED
Hanging Node(s): recommend_A, recommend_B, recommend_C
Last Progress Steps for recommend_A:
  📍 2025-01-06 15:30:52: status=starting, step=initialization
  📍 2025-01-06 15:30:53: status=loading_model, step=openai_connection

💡 RECOMMENDATIONS
------------------------------
1. Check API key validity and network connectivity
2. Verify model availability (especially o3 models)  
3. Check for rate limiting issues
4. Review the last progress step for clues
5. Consider increasing timeout or optimizing model calls
```

## 🔍 What Each Tool Shows

### Main Execution Log
- **System information** (PID, working directory, Python version)
- **File validation** (A.json, A_gaps.json sizes)
- **Environment checks** (API keys present/length)
- **Node execution flow** (start/end times, durations)
- **Progress tracking** within nodes
- **Error details** with full stack traces
- **Timeout detection** and graceful handling

### Real-Time Monitor
- **Live process status** (PID tracking)
- **Node transitions** (when each starts/completes)
- **Progress updates** from within nodes
- **Error alerts** as they happen
- **Timeout warnings** before they occur

### Post-Mortem Analysis
- **Complete execution timeline**
- **Hang point identification**
- **Performance bottlenecks**
- **Error categorization**
- **Actionable recommendations**

## 🛠️ Troubleshooting Guide

### If OLIMP Hangs on "Initializing"
1. **Check the latest log**: `python analyze_logs.py --latest`
2. **Look for the last activity**: Usually shows which node hung
3. **Check API connectivity**: Verify keys and model availability
4. **Review model settings**: o3 models have specific requirements

### Common Hang Points
- **extract_answers**: File loading or PDF processing issues
- **identify_gaps**: Gap analysis computation problems
- **recommend_A/B/C**: API calls to OpenAI/Anthropic/Gemini hanging
- **evaluation_A/B/C**: Model evaluation loops hanging
- **consensus**: Final report generation hanging

### Log File Locations
- **Main logs**: `./logs/olimp_analysis_*.log`
- **Crash reports**: `./logs/crash_report_*.txt`
- **Analysis reports**: `./logs/analysis_report_*.txt`

## 📈 Performance Insights

The logging system tracks:
- **Node execution times** (which nodes are slowest)
- **API call durations** (which models respond fastest)
- **Memory usage patterns** (through progress tracking)
- **Network connectivity issues** (timeout patterns)
- **Model-specific problems** (o3 temperature issues, etc.)

This comprehensive logging will help identify exactly where OLIMP hangs and provide actionable insights for fixing the issues.