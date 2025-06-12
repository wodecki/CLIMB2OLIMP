#!/usr/bin/env python3
"""
Minimal test to identify where OLIMP hangs during initialization
"""
import os
import sys
import time
import traceback

def test_step(step_name, func):
    """Test a step and report timing"""
    print(f"\n🧪 Testing: {step_name}")
    start_time = time.time()
    try:
        result = func()
        elapsed = time.time() - start_time
        print(f"✅ {step_name} completed in {elapsed:.2f}s")
        return result
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"❌ {step_name} failed after {elapsed:.2f}s: {e}")
        traceback.print_exc()
        return None

def test_imports():
    """Test individual imports"""
    print("Testing basic imports...")
    
    # Test individual imports
    test_step("os import", lambda: __import__('os'))
    test_step("sys import", lambda: __import__('sys'))
    test_step("json import", lambda: __import__('json'))
    test_step("time import", lambda: __import__('time'))
    test_step("traceback import", lambda: __import__('traceback'))
    test_step("logging import", lambda: __import__('logging'))
    test_step("datetime import", lambda: __import__('datetime'))
    
    # Test LangGraph imports
    print("\nTesting LangGraph imports...")
    test_step("langgraph.graph import", lambda: __import__('langgraph.graph'))
    
    # Test state import
    print("\nTesting local imports...")
    test_step("state import", lambda: __import__('state'))
    test_step("logging_utils import", lambda: __import__('logging_utils'))
    
    # Test individual node imports
    print("\nTesting node imports...")
    test_step("extract_answers import", lambda: __import__('nodes.extract_answers'))
    test_step("identify_gaps import", lambda: __import__('nodes.identify_gaps'))
    test_step("recommend_branches import", lambda: __import__('nodes.recommend_branches'))
    
    return True

def test_file_access():
    """Test file access"""
    print("\nTesting file access...")
    
    files_to_check = [
        "./data/process/A.json",
        "./data/process/A_1.json", 
        "./data/process/A_2.json",
        "./data/process/A_gaps.json"
    ]
    
    for file_path in files_to_check:
        def check_file():
            if os.path.exists(file_path):
                size = os.path.getsize(file_path)
                print(f"  File exists: {file_path} ({size} bytes)")
                return True
            else:
                print(f"  File missing: {file_path}")
                return False
        
        test_step(f"File check: {file_path}", check_file)
    
    return True

def test_extract_answers_direct():
    """Test extract_answers node directly"""
    print("\nTesting extract_answers node directly...")
    
    def run_extract():
        from nodes.extract_answers import extract_answers
        
        # Simple state
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
        
        print("Calling extract_answers directly...")
        result = extract_answers(initial_state)
        print(f"Result keys: {list(result.keys())}")
        return result
    
    return test_step("extract_answers direct call", run_extract)

def test_graph_creation():
    """Test graph creation without execution"""
    print("\nTesting graph creation...")
    
    def create_graph_only():
        from graph import create_graph
        print("Creating graph...")
        graph = create_graph()
        print("Graph created successfully")
        return graph
    
    return test_step("Graph creation", create_graph_only)

def main():
    """Run all tests to identify hang point"""
    print("="*60)
    print("OLIMP HANG DIAGNOSIS - MINIMAL TEST")
    print("="*60)
    print(f"Working directory: {os.getcwd()}")
    print(f"Python version: {sys.version}")
    print(f"PID: {os.getpid()}")
    
    # Test sequence
    test_imports()
    test_file_access()
    test_extract_answers_direct()
    test_graph_creation()
    
    print("\n" + "="*60)
    print("MINIMAL TEST COMPLETED")
    print("="*60)

if __name__ == "__main__":
    main()