#!/usr/bin/env python3
"""
Test simplified graph without parallel execution
"""
import os
import time
import signal
from langchain_core.runnables import RunnableConfig
from langgraph.graph import START, END, StateGraph
from state import DocumentState

def timeout_handler(signum, frame):
    print(f"⏰ TIMEOUT in simplified graph test")
    raise TimeoutError("Simplified graph test timeout")

def dummy_recommend_a(state: DocumentState) -> DocumentState:
    """Dummy recommendation node A"""
    print("🔄 dummy_recommend_a executing...")
    time.sleep(0.1)  # Simulate work
    return {**state, "branch_data": {**state.get("branch_data", {}), "branch_A": {"status": "completed"}}}

def dummy_recommend_b(state: DocumentState) -> DocumentState:
    """Dummy recommendation node B"""
    print("🔄 dummy_recommend_b executing...")
    time.sleep(0.1)  # Simulate work
    return {**state, "branch_data": {**state.get("branch_data", {}), "branch_B": {"status": "completed"}}}

def dummy_recommend_c(state: DocumentState) -> DocumentState:
    """Dummy recommendation node C"""
    print("🔄 dummy_recommend_c executing...")
    time.sleep(0.1)  # Simulate work
    return {**state, "branch_data": {**state.get("branch_data", {}), "branch_C": {"status": "completed"}}}

def dummy_consensus(state: DocumentState) -> DocumentState:
    """Dummy consensus node"""
    print("🔄 dummy_consensus executing...")
    time.sleep(0.1)  # Simulate work
    return {**state, "consensus_recommendation": "Dummy consensus completed"}

def test_sequential_graph():
    """Test with sequential execution (no parallel branches)"""
    print("="*60)
    print("SEQUENTIAL GRAPH TEST")
    print("="*60)
    
    # Set timeout
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(30)
    
    try:
        from nodes.extract_answers import extract_answers
        from nodes.identify_gaps import identify_gaps
        
        # Create sequential graph
        graph_builder = StateGraph(DocumentState)
        
        # Add nodes
        graph_builder.add_node("extract_answers", extract_answers)
        graph_builder.add_node("identify_gaps", identify_gaps)
        graph_builder.add_node("dummy_consensus", dummy_consensus)
        
        # Sequential edges
        graph_builder.add_edge(START, "extract_answers")
        graph_builder.add_edge("extract_answers", "identify_gaps")
        graph_builder.add_edge("identify_gaps", "dummy_consensus")
        graph_builder.add_edge("dummy_consensus", END)
        
        # Compile graph
        print("Compiling sequential graph...")
        app = graph_builder.compile()
        
        # Test execution
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
        
        print("Starting sequential execution...")
        start_time = time.time()
        
        config = RunnableConfig(recursion_limit=100)
        result = app.invoke(initial_state, config=config)
        
        end_time = time.time()
        signal.alarm(0)
        
        print(f"✅ Sequential graph completed in {end_time - start_time:.2f} seconds")
        return True
        
    except TimeoutError:
        print("❌ Sequential graph timed out!")
        signal.alarm(0)
        return False
    except Exception as e:
        print(f"❌ Sequential graph error: {e}")
        signal.alarm(0)
        return False

def test_parallel_graph():
    """Test with parallel execution (original structure)"""
    print("\n" + "="*60)
    print("PARALLEL GRAPH TEST")
    print("="*60)
    
    # Set timeout
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(30)
    
    try:
        from nodes.extract_answers import extract_answers
        from nodes.identify_gaps import identify_gaps
        
        # Create parallel graph
        graph_builder = StateGraph(DocumentState)
        
        # Add nodes
        graph_builder.add_node("extract_answers", extract_answers)
        graph_builder.add_node("identify_gaps", identify_gaps)
        graph_builder.add_node("dummy_recommend_a", dummy_recommend_a)
        graph_builder.add_node("dummy_recommend_b", dummy_recommend_b)
        graph_builder.add_node("dummy_recommend_c", dummy_recommend_c)
        graph_builder.add_node("dummy_consensus", dummy_consensus)
        
        # Sequential start
        graph_builder.add_edge(START, "extract_answers")
        graph_builder.add_edge("extract_answers", "identify_gaps")
        
        # Parallel fan-out
        graph_builder.add_edge("identify_gaps", "dummy_recommend_a")
        graph_builder.add_edge("identify_gaps", "dummy_recommend_b")
        graph_builder.add_edge("identify_gaps", "dummy_recommend_c")
        
        # Fan-in to consensus
        graph_builder.add_edge("dummy_recommend_a", "dummy_consensus")
        graph_builder.add_edge("dummy_recommend_b", "dummy_consensus")
        graph_builder.add_edge("dummy_recommend_c", "dummy_consensus")
        
        graph_builder.add_edge("dummy_consensus", END)
        
        # Compile graph
        print("Compiling parallel graph...")
        app = graph_builder.compile()
        
        # Test execution
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
        
        print("Starting parallel execution...")
        start_time = time.time()
        
        config = RunnableConfig(recursion_limit=100)
        result = app.invoke(initial_state, config=config)
        
        end_time = time.time()
        signal.alarm(0)
        
        print(f"✅ Parallel graph completed in {end_time - start_time:.2f} seconds")
        return True
        
    except TimeoutError:
        print("❌ Parallel graph timed out!")
        signal.alarm(0)
        return False
    except Exception as e:
        print(f"❌ Parallel graph error: {e}")
        signal.alarm(0)
        return False

def main():
    """Run graph tests"""
    print(f"Working directory: {os.getcwd()}")
    print(f"PID: {os.getpid()}")
    
    # Test sequential first
    seq_result = test_sequential_graph()
    
    # Test parallel
    par_result = test_parallel_graph()
    
    print("\n" + "="*60)
    print("GRAPH TEST RESULTS")
    print("="*60)
    print(f"Sequential: {'✅ PASS' if seq_result else '❌ FAIL'}")
    print(f"Parallel: {'✅ PASS' if par_result else '❌ FAIL'}")

if __name__ == "__main__":
    main()