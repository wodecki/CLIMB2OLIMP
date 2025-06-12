#!/usr/bin/env python3

print("Testing first node in isolation...")

from nodes.extract_answers import extract_answers

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
print("About to call extract_answers...")

try:
    result = extract_answers(initial_state)
    print("✓ extract_answers completed!")
    print("Result keys:", list(result.keys()))
    if "answers" in result:
        print("Answer keys:", list(result["answers"].keys()) if result["answers"] else "None")
    
except Exception as e:
    print(f"❌ extract_answers failed: {e}")
    import traceback
    traceback.print_exc()