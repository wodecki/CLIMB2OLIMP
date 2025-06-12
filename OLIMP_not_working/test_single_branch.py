#!/usr/bin/env python3
"""
Test a single branch to isolate the hanging issue
"""

import os
import sys
import time
import signal
from dotenv import load_dotenv

def test_single_branch():
    """Test just one branch (Anthropic) to see if it hangs"""
    print("Testing single branch execution...")
    
    load_dotenv()
    
    # Test the recommend_branches node directly
    print("\n1. Testing recommend_branches function directly...")
    try:
        from nodes.recommend_branches import recommend_B
        from state import DocumentState
        
        # Create test state with data
        test_state = {
            "document_content": "Test document",
            "answers": {
                "OLIMP": {
                    "sections": [
                        {
                            "section_name": "TEST",
                            "questions": [
                                {
                                    "question_text": "Test question?",
                                    "selected_answer": "A",
                                    "answer_options": {
                                        "A": "Basic level",
                                        "B": "Intermediate level",
                                        "C": "Advanced level"
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            "gaps": {
                "TEST": {
                    "Test question?": {
                        "present": {"level": "A", "description": "Basic level"},
                        "steps": [
                            {"level": "B", "description": "Intermediate level"},
                            {"level": "C", "description": "Advanced level"}
                        ]
                    }
                }
            },
            "branch_data": {},
            "consensus_recommendation": None,
            "recommendations": None,
            "evaluation_feedback": None,
            "evaluation_iterations": 0,
            "recommendation_approved": False
        }
        
        def timeout_handler(signum, frame):
            print("❌ TIMEOUT: recommend_B is hanging!")
            raise TimeoutError("recommend_B timeout")
        
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(30)  # 30 second timeout
        
        start_time = time.time()
        result = recommend_B(test_state)
        signal.alarm(0)  # Cancel timeout
        end_time = time.time()
        
        print(f"✅ recommend_B completed in {end_time - start_time:.2f} seconds")
        print(f"Result keys: {list(result.keys())}")
        
        # Check if recommendation was generated
        branch_data = result.get("branch_data", {})
        if "branch_B" in branch_data:
            branch_B = branch_data["branch_B"]
            recommendations = branch_B.get("recommendations", "")
            print(f"Recommendations length: {len(recommendations) if recommendations else 0}")
        
        return True
        
    except TimeoutError:
        print("❌ recommend_B timed out - HANGING DETECTED")
        signal.alarm(0)
        return False
    except Exception as e:
        print(f"❌ recommend_B failed: {e}")
        signal.alarm(0)
        return False

if __name__ == "__main__":
    print("OLIMP Single Branch Test")
    print("=" * 40)
    
    success = test_single_branch()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Single branch test passed!")
    else:
        print("❌ Single branch test failed - hanging confirmed.")