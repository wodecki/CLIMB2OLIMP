#!/usr/bin/env python3
"""
Minimal test to isolate the hanging issue
"""

import os
import sys
import time
import signal
from dotenv import load_dotenv

def test_individual_nodes():
    """Test each node individually to see which one hangs"""
    print("Testing individual nodes...")
    
    load_dotenv()
    
    # Test extract_answers node
    print("\n1. Testing extract_answers node...")
    try:
        from nodes.extract_answers import extract_answers
        from state import DocumentState
        
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
        
        start_time = time.time()
        result = extract_answers(initial_state)
        end_time = time.time()
        
        print(f"✅ extract_answers completed in {end_time - start_time:.2f} seconds")
        print(f"Result: {result['document_content'][:100]}...")
        
    except Exception as e:
        print(f"❌ extract_answers failed: {e}")
        return False
    
    # Test LangGraph creation without execution
    print("\n2. Testing LangGraph creation...")
    try:
        from graph import create_graph
        
        start_time = time.time()
        app = create_graph()
        end_time = time.time()
        
        print(f"✅ Graph created successfully in {end_time - start_time:.2f} seconds")
        
    except Exception as e:
        print(f"❌ Graph creation failed: {e}")
        return False
    
    # Test simple graph execution with timeout
    print("\n3. Testing minimal graph execution with timeout...")
    try:
        def timeout_handler(signum, frame):
            print("❌ TIMEOUT: Graph execution is hanging!")
            raise TimeoutError("Graph execution timeout")
        
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(15)  # 15 second timeout
        
        start_time = time.time()
        result = app.invoke(initial_state)
        signal.alarm(0)  # Cancel timeout
        end_time = time.time()
        
        print(f"✅ Graph execution completed in {end_time - start_time:.2f} seconds")
        
    except TimeoutError:
        print("❌ Graph execution timed out - HANGING DETECTED")
        signal.alarm(0)
        return False
    except Exception as e:
        print(f"❌ Graph execution failed: {e}")
        signal.alarm(0)
        return False
    
    return True

if __name__ == "__main__":
    print("OLIMP Minimal Hang Test")
    print("=" * 40)
    
    success = test_individual_nodes()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ All tests passed - no hanging detected!")
    else:
        print("❌ Hanging issue confirmed - check the output above.")