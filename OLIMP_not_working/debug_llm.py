#!/usr/bin/env python3

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("Current environment variables:")
print(f"OPENAI_MODEL: {os.getenv('OPENAI_MODEL')}")
print(f"OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY')[:10]}..." if os.getenv('OPENAI_API_KEY') else "None")

# Test the model detection logic
model_name = os.getenv("OPENAI_MODEL", "o3-2025-04-16")
print(f"Model name: {model_name}")
print(f"'o3' in model_name: {'o3' in model_name}")

# Test creating the LLM
try:
    from nodes.recommend_branches import create_llm_for_branch
    llm = create_llm_for_branch("openai")
    print("✓ LLM created successfully")
    print(f"LLM type: {type(llm)}")
    print(f"LLM attributes: {[attr for attr in dir(llm) if not attr.startswith('_')]}")
    
    # Check if temperature is set
    if hasattr(llm, 'temperature'):
        print(f"LLM temperature: {llm.temperature}")
    if hasattr(llm, 'model_kwargs'):
        print(f"LLM model_kwargs: {llm.model_kwargs}")
    if hasattr(llm, '_default_params'):
        print(f"LLM _default_params: {llm._default_params}")
        
except Exception as e:
    print(f"❌ Error creating LLM: {e}")
    import traceback
    traceback.print_exc()