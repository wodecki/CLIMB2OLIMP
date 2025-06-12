#!/usr/bin/env python3
"""
Test graph execution step by step to identify hanging point
"""
import os
import sys
import time
import signal
import traceback
from langchain_core.runnables import RunnableConfig

def timeout_handler(signum, frame):
    print(f"⏰ TIMEOUT DETECTED - execution taking too long!")
    raise TimeoutError("Test execution timeout")

def test_graph_invoke():
    """Test graph.invoke() with timeout"""
    print("="*60)
    print("GRAPH EXECUTION TEST")
    print("="*60)
    
    # Import after establishing working directory
    from graph import app
    
    # Initialize state
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
    
    print(f"Initial state keys: {list(initial_state.keys())}")
    print("Setting up timeout...")
    
    # Set timeout
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(60)  # 1 minute timeout for test
    
    try:
        print("🚀 Starting graph execution...")
        start_time = time.time()
        
        # Configure execution
        config = RunnableConfig(
            recursion_limit=100,
            max_concurrency=None
        )
        
        print("Calling app.invoke()...")
        response = app.invoke(initial_state, config=config)
        
        signal.alarm(0)  # Cancel timeout
        end_time = time.time()
        
        print(f"✅ Graph execution completed in {end_time - start_time:.2f} seconds!")
        print(f"Response keys: {list(response.keys())}")
        
        return response
        
    except TimeoutError as te:
        print(f"⏰ GRAPH EXECUTION TIMEOUT: {te}")
        signal.alarm(0)
        return None
    except Exception as e:
        print(f"❌ Graph execution error: {e}")
        traceback.print_exc()
        signal.alarm(0)
        return None

def test_individual_nodes():
    """Test each node individually"""
    print("\n" + "="*60)
    print("INDIVIDUAL NODE TESTING")
    print("="*60)
    
    # Import nodes
    from nodes.extract_answers import extract_answers
    from nodes.identify_gaps import identify_gaps
    
    # Test state progression
    state = {
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
    
    # Test extract_answers
    print("\n🔍 Testing extract_answers...")
    start_time = time.time()
    state = extract_answers(state)
    elapsed = time.time() - start_time
    print(f"✅ extract_answers completed in {elapsed:.2f}s")
    print(f"Document content preview: {state['document_content'][:100]}...")
    
    # Test identify_gaps  
    print("\n🔍 Testing identify_gaps...")
    start_time = time.time()
    state = identify_gaps(state)
    elapsed = time.time() - start_time
    print(f"✅ identify_gaps completed in {elapsed:.2f}s")
    print(f"Gaps keys: {list(state.get('gaps', {}).keys())}")
    
    return state

def main():
    """Run graph execution tests"""
    print(f"Working directory: {os.getcwd()}")
    print(f"Python version: {sys.version}")
    print(f"PID: {os.getpid()}")
    
    # Test individual nodes first
    node_result = test_individual_nodes()
    
    # Test full graph execution
    graph_result = test_graph_invoke()
    
    if graph_result:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Graph execution failed or timed out")
    
    print("\n" + "="*60)
    print("GRAPH EXECUTION TEST COMPLETED")
    print("="*60)

if __name__ == "__main__":
    main()