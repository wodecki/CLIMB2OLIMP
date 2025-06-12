#!/usr/bin/env python3

print("Testing OLIMP graph execution...")

from graph import app

# Initialize simple state
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

print("✓ State initialized")
print("State keys:", list(initial_state.keys()))

print("Attempting to invoke graph...")

try:
    from langchain_core.runnables import RunnableConfig
    config = RunnableConfig(
        recursion_limit=100,
        max_concurrency=None
    )
    
    print("About to call app.invoke()...")
    response = app.invoke(initial_state, config=config)
    print("✓ Graph execution completed!")
    
except Exception as e:
    print(f"❌ Graph execution failed: {e}")
    import traceback
    traceback.print_exc()