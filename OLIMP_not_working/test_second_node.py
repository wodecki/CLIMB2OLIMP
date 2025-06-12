#!/usr/bin/env python3

print("Testing second node (identify_gaps)...")

from nodes.extract_answers import extract_answers
from nodes.identify_gaps import identify_gaps

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

try:
    # First run extract_answers
    print("Running extract_answers...")
    state1 = extract_answers(initial_state)
    print("✓ extract_answers completed")
    
    # Then run identify_gaps
    print("Running identify_gaps...")
    state2 = identify_gaps(state1)
    print("✓ identify_gaps completed")
    
    print("Final state keys:", list(state2.keys()))
    if "gaps" in state2:
        print("Gaps keys:", list(state2["gaps"].keys()) if state2["gaps"] else "None")
    
except Exception as e:
    print(f"❌ Node execution failed: {e}")
    import traceback
    traceback.print_exc()