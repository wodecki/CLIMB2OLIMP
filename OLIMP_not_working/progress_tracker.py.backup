import json
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional

class ProgressTracker:
    """Progress tracking system for OLIMP analysis"""
    
    def __init__(self, progress_file: str = "./progress.json"):
        self.progress_file = progress_file
        self.start_time = time.time()
        self.initialize_progress()
    
    def initialize_progress(self):
        """Initialize the progress tracking file"""
        initial_progress = {
            "status": "initializing",
            "current_step": "setup",
            "steps_completed": 0,
            "total_steps": 7,  # extract_answers, identify_gaps, 3 branches, consensus, finalization
            "start_time": datetime.now().isoformat(),
            "current_time": datetime.now().isoformat(),
            "elapsed_time": 0,
            "estimated_remaining": "unknown",
            "branches": {
                "branch_A": {"status": "pending", "iterations": 0, "max_iterations": 3},
                "branch_B": {"status": "pending", "iterations": 0, "max_iterations": 3},
                "branch_C": {"status": "pending", "iterations": 0, "max_iterations": 3}
            },
            "current_branch": None,
            "error": None,
            "completed_nodes": [],
            "current_node": None
        }
        
        self.save_progress(initial_progress)
    
    def update_step(self, step_name: str, status: str = "running", details: Optional[str] = None):
        """Update the current step"""
        progress = self.load_progress()
        
        if status == "completed" and step_name not in progress["completed_nodes"]:
            progress["steps_completed"] += 1
            progress["completed_nodes"].append(step_name)
        
        progress["current_step"] = step_name
        progress["current_node"] = step_name
        progress["status"] = status
        progress["current_time"] = datetime.now().isoformat()
        progress["elapsed_time"] = time.time() - self.start_time
        
        if details:
            progress["details"] = details
        
        # Estimate remaining time based on completed steps
        if progress["steps_completed"] > 0 and progress["total_steps"] > progress["steps_completed"]:
            avg_time_per_step = progress["elapsed_time"] / progress["steps_completed"]
            remaining_steps = progress["total_steps"] - progress["steps_completed"]
            estimated_remaining = avg_time_per_step * remaining_steps
            progress["estimated_remaining"] = f"{estimated_remaining/60:.1f} minutes"
        
        self.save_progress(progress)
        
        # Also print to console for immediate feedback
        elapsed_mins = progress["elapsed_time"] / 60
        print(f"[{elapsed_mins:.1f}m] {step_name}: {status}" + (f" - {details}" if details else ""))
    
    def update_branch(self, branch_name: str, status: str, iteration: int = 0, details: Optional[str] = None):
        """Update branch-specific progress"""
        progress = self.load_progress()
        
        if branch_name not in progress["branches"]:
            progress["branches"][branch_name] = {"status": "pending", "iterations": 0, "max_iterations": 3}
        
        progress["branches"][branch_name]["status"] = status
        progress["branches"][branch_name]["iterations"] = iteration
        progress["current_branch"] = branch_name
        progress["current_time"] = datetime.now().isoformat()
        progress["elapsed_time"] = time.time() - self.start_time
        
        if details:
            progress["branches"][branch_name]["details"] = details
        
        self.save_progress(progress)
        
        elapsed_mins = progress["elapsed_time"] / 60
        print(f"[{elapsed_mins:.1f}m] {branch_name}: {status} (iteration {iteration})" + (f" - {details}" if details else ""))
    
    def mark_error(self, error_message: str, step_name: Optional[str] = None):
        """Mark an error in the progress"""
        progress = self.load_progress()
        progress["status"] = "error"
        progress["error"] = error_message
        progress["current_time"] = datetime.now().isoformat()
        progress["elapsed_time"] = time.time() - self.start_time
        
        if step_name:
            progress["current_step"] = step_name
            progress["current_node"] = step_name
        
        self.save_progress(progress)
        
        elapsed_mins = progress["elapsed_time"] / 60
        print(f"[{elapsed_mins:.1f}m] ERROR: {error_message}")
    
    def mark_completed(self):
        """Mark the entire process as completed"""
        progress = self.load_progress()
        progress["status"] = "completed"
        progress["current_step"] = "finished"
        progress["current_time"] = datetime.now().isoformat()
        progress["elapsed_time"] = time.time() - self.start_time
        progress["estimated_remaining"] = "0 minutes"
        
        self.save_progress(progress)
        
        elapsed_mins = progress["elapsed_time"] / 60
        print(f"[{elapsed_mins:.1f}m] OLIMP analysis completed successfully!")
    
    def load_progress(self) -> Dict[str, Any]:
        """Load current progress from file"""
        try:
            if os.path.exists(self.progress_file):
                with open(self.progress_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading progress: {e}")
        
        # Return default progress if file doesn't exist or has issues
        return {
            "status": "unknown",
            "current_step": "unknown",
            "steps_completed": 0,
            "total_steps": 7,
            "elapsed_time": 0,
            "branches": {}
        }
    
    def save_progress(self, progress: Dict[str, Any]):
        """Save progress to file"""
        try:
            with open(self.progress_file, 'w') as f:
                json.dump(progress, f, indent=2)
        except Exception as e:
            print(f"Error saving progress: {e}")
    
    def get_progress_summary(self) -> str:
        """Get a human-readable progress summary"""
        progress = self.load_progress()
        elapsed_mins = progress.get("elapsed_time", 0) / 60
        
        summary = f"Status: {progress.get('status', 'unknown')}\n"
        summary += f"Current Step: {progress.get('current_step', 'unknown')}\n"
        summary += f"Progress: {progress.get('steps_completed', 0)}/{progress.get('total_steps', 7)} steps completed\n"
        summary += f"Elapsed Time: {elapsed_mins:.1f} minutes\n"
        summary += f"Estimated Remaining: {progress.get('estimated_remaining', 'unknown')}\n"
        
        if progress.get("branches"):
            summary += "\nBranch Status:\n"
            for branch, info in progress["branches"].items():
                summary += f"  {branch}: {info.get('status', 'unknown')} ({info.get('iterations', 0)}/{info.get('max_iterations', 3)} iterations)\n"
        
        return summary

# Global progress tracker instance
progress_tracker = ProgressTracker()