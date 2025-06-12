"""
Logging utilities for OLIMP nodes to enable post-mortem analysis
"""

import logging
import time
from functools import wraps

def get_node_logger(node_name: str):
    """Get a logger instance for a specific node"""
    return logging.getLogger(f"olimp.nodes.{node_name}")

def log_node_execution(node_name: str):
    """Decorator to log node execution start/end with timing"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = get_node_logger(node_name)
            
            # Log execution start
            logger.info(f"🔍 {node_name} node called!")
            logger.info(f"Node execution started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
            
            start_time = time.time()
            
            try:
                # Execute the node function
                result = func(*args, **kwargs)
                
                # Log successful completion
                end_time = time.time()
                execution_time = end_time - start_time
                logger.info(f"✅ {node_name} node completed in {execution_time:.2f} seconds")
                
                return result
                
            except Exception as e:
                # Log error
                end_time = time.time()
                execution_time = end_time - start_time
                logger.error(f"❌ {node_name} node ERROR after {execution_time:.2f} seconds: {e}")
                logger.error(f"Error details: {str(e)}")
                raise
                
        return wrapper
    return decorator

def log_message(node_name: str, level: str, message: str):
    """Log a message from a specific node"""
    logger = get_node_logger(node_name)
    
    if level.lower() == 'debug':
        logger.debug(message)
    elif level.lower() == 'info':
        logger.info(message)
    elif level.lower() == 'warning':
        logger.warning(message)
    elif level.lower() == 'error':
        logger.error(message)
    elif level.lower() == 'critical':
        logger.critical(message)
    else:
        logger.info(message)

def log_state_info(node_name: str, state, stage: str = ""):
    """Log information about the current state"""
    logger = get_node_logger(node_name)
    
    if stage:
        logger.debug(f"[{stage}] State keys: {list(state.keys()) if state else 'None'}")
    else:
        logger.debug(f"State keys: {list(state.keys()) if state else 'None'}")
    
    # Log specific state information
    if isinstance(state, dict):
        if 'answers' in state:
            answers = state['answers']
            if isinstance(answers, dict):
                logger.debug(f"Answer data keys: {list(answers.keys())}")
            else:
                logger.debug(f"Answers type: {type(answers)}")
        
        if 'gaps' in state:
            gaps = state['gaps']
            if isinstance(gaps, dict):
                total_gaps = sum(len(section) for section in gaps.values())
                logger.debug(f"Gaps: {total_gaps} questions across {len(gaps)} sections")
        
        if 'branch_data' in state:
            branch_data = state['branch_data']
            if isinstance(branch_data, dict):
                branches = list(branch_data.keys())
                logger.debug(f"Branch data available: {branches}")

def save_node_progress(node_name: str, progress_info: dict):
    """Save node progress information for monitoring"""
    logger = get_node_logger(node_name)
    
    # Create progress entry
    progress_msg = f"PROGRESS: {node_name} - "
    progress_items = []
    
    for key, value in progress_info.items():
        progress_items.append(f"{key}={value}")
    
    progress_msg += ", ".join(progress_items)
    logger.info(progress_msg)