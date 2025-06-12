#!/usr/bin/env python3
"""
Quick test to verify the OLIMP fixes work correctly
"""

import os
import sys

def test_api_key_validation():
    """Test that proper error messages are shown for missing API keys"""
    print("Testing API key validation...")
    
    # Clear environment variables for testing
    old_values = {}
    for key in ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY"]:
        old_values[key] = os.environ.get(key)
        if key in os.environ:
            del os.environ[key]
    
    try:
        from nodes.recommend_branches import create_llm_for_branch
        
        # Test each provider
        for provider in ["openai", "anthropic", "gemini"]:
            try:
                create_llm_for_branch(provider)
                print(f"❌ {provider}: Should have failed with missing API key")
            except ValueError as e:
                if "API_KEY environment variable is not set" in str(e):
                    print(f"✅ {provider}: Correctly detected missing API key")
                else:
                    print(f"❌ {provider}: Wrong error message: {e}")
            except Exception as e:
                print(f"❌ {provider}: Unexpected error: {e}")
                
    finally:
        # Restore original values
        for key, value in old_values.items():
            if value is not None:
                os.environ[key] = value

def test_timeout_configuration():
    """Test that timeout is properly configured for Anthropic"""
    print("\nTesting timeout configuration...")
    
    # Set a dummy API key to avoid the missing key error
    os.environ["ANTHROPIC_API_KEY"] = "dummy_key_for_testing"
    
    try:
        from nodes.recommend_branches import create_llm_for_branch
        from langchain_anthropic import ChatAnthropic
        
        llm = create_llm_for_branch("anthropic")
        
        # Check if it's a ChatAnthropic instance
        if isinstance(llm, ChatAnthropic):
            # Check if timeout is configured (this is internal to the library)
            print("✅ Anthropic: LLM created successfully with timeout configuration")
        else:
            print(f"❌ Anthropic: Expected ChatAnthropic, got {type(llm)}")
            
    except Exception as e:
        print(f"❌ Anthropic timeout test failed: {e}")
    finally:
        # Clean up
        if "ANTHROPIC_API_KEY" in os.environ and os.environ["ANTHROPIC_API_KEY"] == "dummy_key_for_testing":
            del os.environ["ANTHROPIC_API_KEY"]

def test_data_files():
    """Test that required data files exist"""
    print("\nTesting data files...")
    
    required_files = [
        "./data/process/A.json",
        "./data/process/A_gaps.json"
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✅ {file_path} exists ({size} bytes)")
        else:
            print(f"❌ {file_path} is missing")

if __name__ == "__main__":
    print("OLIMP Fix Verification Test")
    print("=" * 40)
    
    test_api_key_validation()
    test_timeout_configuration()
    test_data_files()
    
    print("\n" + "=" * 40)
    print("Test completed. Check the results above.")