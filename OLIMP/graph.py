import os
from typing import Literal
from dotenv import load_dotenv
from langgraph.graph import START, END, StateGraph
from state import DocumentState
from nodes.extract_answers import extract_answers
from nodes.identify_gaps import identify_gaps
from nodes.recommend_branches import recommend_A, recommend_B, recommend_C
from nodes.evaluation_branches import evaluation_A, evaluation_B, evaluation_C
from nodes.consensus import consensus

# Load environment variables if needed
try:
    load_dotenv(override=True)
except ImportError:
    print("dotenv not installed, skipping environment variable loading")

# Branch evaluation conditional functions using simple fan-in pattern
def should_continue_evaluation_A(state: DocumentState) -> Literal["recommend_A", "consensus"]:
    """Conditional edge for Branch A evaluation loop"""
    max_iterations = 3
    branch_data = state.get("branch_data", {}).get("branch_A", {})
    current_iterations = branch_data.get("evaluation_iterations", 0)
    approved = branch_data.get("recommendation_approved", False)
    
    # End after iteration 3 or if approved
    if current_iterations >= max_iterations or approved:
        print(f"✅ Branch A completed (iterations: {current_iterations}, approved: {approved})")
        return "consensus"
    
    # Continue for revision
    print(f"🔄 Branch A revision needed - iteration {current_iterations + 1}")
    return "recommend_A"

def should_continue_evaluation_B(state: DocumentState) -> Literal["recommend_B", "consensus"]:
    """Conditional edge for Branch B evaluation loop"""
    max_iterations = 3
    branch_data = state.get("branch_data", {}).get("branch_B", {})
    current_iterations = branch_data.get("evaluation_iterations", 0)
    approved = branch_data.get("recommendation_approved", False)
    
    # End after iteration 3 or if approved
    if current_iterations >= max_iterations or approved:
        print(f"✅ Branch B completed (iterations: {current_iterations}, approved: {approved})")
        return "consensus"
    
    # Continue for revision
    print(f"🔄 Branch B revision needed - iteration {current_iterations + 1}")
    return "recommend_B"

def should_continue_evaluation_C(state: DocumentState) -> Literal["recommend_C", "consensus"]:
    """Conditional edge for Branch C evaluation loop"""
    max_iterations = 3
    branch_data = state.get("branch_data", {}).get("branch_C", {})
    current_iterations = branch_data.get("evaluation_iterations", 0)
    approved = branch_data.get("recommendation_approved", False)
    
    # End after iteration 3 or if approved
    if current_iterations >= max_iterations or approved:
        print(f"✅ Branch C completed (iterations: {current_iterations}, approved: {approved})")
        return "consensus"
    
    # Continue for revision
    print(f"🔄 Branch C revision needed - iteration {current_iterations + 1}")
    return "recommend_C"

def create_graph():
    """
    Create a document processing graph with parallel execution using LangGraph fan-in pattern:
    
    1. extract_answers - Read PDF files and extract questionnaire data 
    2. identify_gaps - Analyze gaps between current OLIMP answers and maximum level E
    3. PARALLEL BRANCHES (fan-out):
       - Branch A: recommend_A (OpenAI) ⟷ evaluation_A (OpenAI) 
       - Branch B: recommend_B (Claude) ⟷ evaluation_B (Claude)
       - Branch C: recommend_C (Gemini) ⟷ evaluation_C (Gemini)
    4. consensus - Generate final recommendation from all branches using OpenAI (fan-in)
    
    Pattern: gaps → {branch_loops} → consensus
    
    Each branch runs independently with its own evaluation loop (max 3 iterations).
    LangGraph automatically waits for ALL branches to complete before running consensus.
    Uses state reducers to handle concurrent branch updates safely.
    
    Returns:
        Compiled graph
    """
    # Create the graph
    graph_builder = StateGraph(DocumentState)
    
    # Add sequential nodes
    graph_builder.add_node("extract_answers", extract_answers)
    graph_builder.add_node("identify_gaps", identify_gaps)
    
    # Add parallel branch nodes
    graph_builder.add_node("recommend_A", recommend_A)  # OpenAI
    graph_builder.add_node("recommend_B", recommend_B)  # Claude
    graph_builder.add_node("recommend_C", recommend_C)  # Gemini
    
    graph_builder.add_node("evaluation_A", evaluation_A)  # OpenAI evaluator
    graph_builder.add_node("evaluation_B", evaluation_B)  # Claude evaluator
    graph_builder.add_node("evaluation_C", evaluation_C)  # Gemini evaluator
    
    # Add consensus node (LangGraph handles fan-in automatically)
    graph_builder.add_node("consensus", consensus)
    
    # Sequential edges
    graph_builder.add_edge(START, "extract_answers")
    graph_builder.add_edge("extract_answers", "identify_gaps")
    
    # Parallel fan-out: identify_gaps → all 3 recommendation branches
    graph_builder.add_edge("identify_gaps", "recommend_A")
    graph_builder.add_edge("identify_gaps", "recommend_B")
    graph_builder.add_edge("identify_gaps", "recommend_C")
    
    # Branch A evaluation loop
    graph_builder.add_edge("recommend_A", "evaluation_A")
    graph_builder.add_conditional_edges(
        "evaluation_A",
        should_continue_evaluation_A,
        {
            "recommend_A": "recommend_A",  # Continue loop
            "consensus": "consensus"       # Branch completed - fan-in to consensus
        }
    )
    
    # Branch B evaluation loop
    graph_builder.add_edge("recommend_B", "evaluation_B")
    graph_builder.add_conditional_edges(
        "evaluation_B",
        should_continue_evaluation_B,
        {
            "recommend_B": "recommend_B",  # Continue loop
            "consensus": "consensus"       # Branch completed - fan-in to consensus
        }
    )
    
    # Branch C evaluation loop
    graph_builder.add_edge("recommend_C", "evaluation_C")
    graph_builder.add_conditional_edges(
        "evaluation_C",
        should_continue_evaluation_C,
        {
            "recommend_C": "recommend_C",  # Continue loop
            "consensus": "consensus"       # Branch completed - fan-in to consensus
        }
    )
    
    # Consensus to END (LangGraph automatically waits for all branches to complete)
    graph_builder.add_edge("consensus", END)
    
    # Compile the graph 
    return graph_builder.compile()

# Create the graph with evaluation loop
app = create_graph()
