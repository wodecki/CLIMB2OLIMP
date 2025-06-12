import os
import sys
sys.path.insert(0, '/home/wodecki/LLM/Aron/CLIMB2OLIMP/OLIMP')
os.chdir('/home/wodecki/LLM/Aron/CLIMB2OLIMP/OLIMP')

from dotenv import load_dotenv
from nodes.recommend_branches import create_llm_for_branch

# Load environment variables
load_dotenv()

print("Environment variables:")
print(f"OPENAI_MODEL: {os.getenv('OPENAI_MODEL')}")
print(f"OPENAI_API_KEY exists: {bool(os.getenv('OPENAI_API_KEY'))}")

print("\nTesting LLM creation:")
try:
    llm = create_llm_for_branch("openai")
    print(f"LLM created successfully")
    print(f"Model name: {llm.model_name}")
    print(f"Model kwargs: {getattr(llm, 'model_kwargs', 'N/A')}")
    print(f"Temperature: {getattr(llm, 'temperature', 'N/A')}")
    
    # Try a simple call
    from langchain_core.messages import HumanMessage
    message = HumanMessage(content="Hello, just say 'Test successful'")
    print("\nTesting API call...")
    response = llm.invoke([message])
    print(f"Response: {response.content}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()