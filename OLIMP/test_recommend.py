import os
import sys
import json
from nodes.recommend_branches import recommend_A
from state import DocumentState

# Load existing gaps
with open('./data/process/A_gaps.json', 'r') as f:
    gaps = json.load(f)

# Create test state
state = DocumentState(
    document_content='test',
    answers={},
    gaps=gaps,
    branch_data={},
    consensus_recommendation=None,
    recommendations=None,
    evaluation_feedback=None,
    evaluation_iterations=0,
    recommendation_approved=False
)

print('Testing recommend_A...')
try:
    result = recommend_A(state)
    print('SUCCESS: recommend_A completed')
    print(f'Result type: {type(result)}')
    if isinstance(result, dict):
        print(f'Result keys: {list(result.keys())}')
        if 'branch_data' in result:
            print(f'Branch data keys: {list(result["branch_data"].keys())}')
    else:
        print(f'Result: {result}')
except Exception as e:
    print(f'ERROR in recommend_A: {e}')
    import traceback
    traceback.print_exc()