#!/usr/bin/env python3

print("Testing recommendation node...")

import os
import json

# Test importing the recommend_branches
try:
    from nodes.recommend_branches import recommend_A
    print("✓ recommend_A imported successfully")
except Exception as e:
    print(f"❌ recommend_A import failed: {e}")
    exit(1)

# Load state from files
state = {
    "document_content": "Test content",
    "answers": {},
    "gaps": {},
    "branch_data": {},
    "consensus_recommendation": None,
    "recommendations": None,
    "evaluation_feedback": None,
    "evaluation_iterations": 0,
    "recommendation_approved": False
}

try:
    # Load answers
    if os.path.exists("./data/process/A.json"):
        with open("./data/process/A.json", "r", encoding="utf-8") as f:
            state["answers"] = json.load(f)
        print("✓ Loaded A.json")
    
    # Load gaps
    if os.path.exists("./data/process/A_gaps.json"):
        with open("./data/process/A_gaps.json", "r", encoding="utf-8") as f:
            state["gaps"] = json.load(f)
        print("✓ Loaded A_gaps.json")
    
    print("State prepared. Testing recommend_A...")
    result = recommend_A(state)
    print("✓ recommend_A completed successfully!")
    
    # Check result
    if "branch_data" in result and "branch_A" in result["branch_data"]:
        print("✓ Branch A data created")
        branch_data = result["branch_data"]["branch_A"]
        print(f"Branch A keys: {list(branch_data.keys())}")
        if "recommendations" in branch_data:
            print(f"Recommendations length: {len(branch_data['recommendations'])}")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()