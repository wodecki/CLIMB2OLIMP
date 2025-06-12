from typing import TypedDict, Dict, Any, Optional, Annotated
from operator import add

def merge_branch_data(left: Dict[str, Any], right: Dict[str, Any]) -> Dict[str, Any]:
    """Custom reducer for merging branch-specific data"""
    result = left.copy() if left else {}
    if right:
        result.update(right)
    return result

def last_value_reducer(left: Any, right: Any) -> Any:
    """Custom reducer that takes the last (most recent) value"""
    return right if right is not None else left

class DocumentState(TypedDict):
    """State for document processing with parallel execution support"""
    # Shared state (use last value reducer to handle concurrent updates)
    document_content: Annotated[str, last_value_reducer]
    answers: Annotated[Dict[str, Any], last_value_reducer]
    gaps: Annotated[Dict[str, Any], last_value_reducer]
    
    # Branch-specific data using custom reducer to handle parallel updates
    branch_data: Annotated[Dict[str, Any], merge_branch_data]
    
    # Consensus state
    consensus_recommendation: Annotated[Optional[str], last_value_reducer]  # Final synthesized recommendation
    
    # Legacy fields (for backward compatibility)
    recommendations: Annotated[Optional[str], last_value_reducer]
    evaluation_feedback: Annotated[Optional[str], last_value_reducer]
    evaluation_iterations: Annotated[int, last_value_reducer]
    recommendation_approved: Annotated[bool, last_value_reducer]
