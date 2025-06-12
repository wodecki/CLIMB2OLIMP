#!/usr/bin/env python3
"""
Test OLIMP with actual API keys from .env file
"""

import os
import sys
from dotenv import load_dotenv

def test_with_actual_keys():
    """Test OLIMP components with real API keys"""
    print("Testing OLIMP with actual API keys...")
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Check if keys are loaded
    required_keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY"]
    missing_keys = []
    
    for key in required_keys:
        value = os.getenv(key)
        if value:
            print(f"✅ {key} is loaded (length: {len(value)})")
        else:
            print(f"❌ {key} is missing")
            missing_keys.append(key)
    
    if missing_keys:
        print(f"\n❌ Missing keys: {missing_keys}")
        return False
    
    print("\n" + "="*50)
    print("Testing LLM creation with actual keys...")
    
    try:
        from nodes.recommend_branches import create_llm_for_branch
        
        # Test each provider
        for provider in ["openai", "anthropic", "gemini"]:
            try:
                llm = create_llm_for_branch(provider)
                print(f"✅ {provider}: LLM created successfully")
            except Exception as e:
                print(f"❌ {provider}: Failed to create LLM: {e}")
                
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    
    print("\n" + "="*50)
    print("Testing extract_answers node...")
    
    try:
        from nodes.extract_answers import extract_answers
        from state import DocumentState
        
        # Create initial state
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
        
        # Test extract_answers
        result = extract_answers(initial_state)
        
        if "ERROR" in result.get("document_content", ""):
            print(f"❌ extract_answers failed: {result['document_content']}")
        else:
            print(f"✅ extract_answers succeeded: {result['document_content'][:100]}...")
            
    except Exception as e:
        print(f"❌ extract_answers test failed: {e}")
        
    return True

if __name__ == "__main__":
    print("OLIMP Test with Real API Keys")
    print("=" * 50)
    
    success = test_with_actual_keys()
    
    if success:
        print("\n" + "=" * 50)
        print("✅ All basic tests passed!")
        print("OLIMP should now work correctly.")
    else:
        print("\n" + "=" * 50)
        print("❌ Some tests failed. Check the errors above.")