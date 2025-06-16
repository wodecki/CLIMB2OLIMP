import os
import json
from typing import Dict, List, Optional, Any

class StatusManager:
    """
    Manages the status of the analysis process, writing it to a file that can be read by the frontend.
    """
    
    def __init__(self, status_file_path: str = None):
        """
        Initialize the status manager.
        
        Args:
            status_file_path: Path to the status file. If None, defaults to 'status.json' in the current directory.
        """
        if status_file_path is None:
            # Get the directory of this file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up one level to the backend directory
            backend_dir = os.path.dirname(current_dir)
            # Set the status file path
            self.status_file_path = os.path.join(backend_dir, 'status.json')
        else:
            self.status_file_path = status_file_path
        
        # Categories for strategic goals
        self.categories = [
            "Role i Współpraca",
            "Szkolenie",
            "Działania i Przepływ",
            "Podejmowanie Decyzji",
            "Procesy ZW",
            "Techniki ZW",
            "Metody",
            "Komputeryzacja i Oprogramowanie"
        ]
        
        # Initialize with default status
        self.status = {
            "currentNode": "initializing",
            "requiresInput": False,
            "questions": None,
            "strategicGoals": {},
            "currentCategory": None
        }
        
        # Write the initial status
        self._write_status()
    
    def update_node(self, node_name: str, report_path: str = None) -> None:
        """
        Update the current node name.
        
        Args:
            node_name: The name of the current node.
            report_path: Optional path to the generated report.
        """
        self.status["currentNode"] = node_name
        self.status["requiresInput"] = False
        self.status["questions"] = None
        
        # If this is the human_feedback node, set requiresInput to true
        # and determine which category we're asking about
        if node_name == "human_feedback":
            self.status["requiresInput"] = True
            strategic_goals = self.status.get("strategicGoals", {})
            if len(strategic_goals) < len(self.categories):
                self.status["currentCategory"] = self.categories[len(strategic_goals)]
            else:
                self.status["currentCategory"] = None
        
        # If a report path is provided, add it to the status
        if report_path:
            self.status["reportPath"] = report_path
            
        self._write_status()
    
    def request_input(self, questions: List[Dict[str, str]]) -> None:
        """
        Set the status to request input from the user.
        
        Args:
            questions: A list of questions to ask the user, each with category and current level.
        """
        self.status["requiresInput"] = True
        self.status["questions"] = questions
        self._write_status()
    
    def update_strategic_goals(self, category: str, goal: str) -> None:
        """
        Update the strategic goals with a new category and goal.
        
        Args:
            category: The category to update.
            goal: The goal level (A-E).
        """
        strategic_goals = self.status.get("strategicGoals", {})
        strategic_goals[category] = goal
        self.status["strategicGoals"] = strategic_goals
        
        # Update the current category
        if len(strategic_goals) < len(self.categories):
            self.status["currentCategory"] = self.categories[len(strategic_goals)]
        else:
            self.status["currentCategory"] = None
            
        self._write_status()
    
    def request_all_strategic_goals(self, categories: List[str]) -> None:
        """
        Set the status to request all strategic goals at once.
        
        Args:
            categories: A list of all categories that need strategic goals.
        """
        self.status["requiresInput"] = True
        self.status["requestAllGoals"] = True
        self.status["allCategories"] = categories
        self._write_status()
    
    def clear_input_request(self) -> None:
        """
        Clear the input request status.
        """
        self.status["requiresInput"] = False
        self.status["questions"] = None
        self.status["requestAllGoals"] = False
        self.status["allCategories"] = None
        self._write_status()
    
    def _write_status(self) -> None:
        """
        Write the current status to the status file.
        """
        try:
            with open(self.status_file_path, 'w') as f:
                json.dump(self.status, f, indent=2)
        except Exception as e:
            print(f"Error writing status file: {e}")
    
    def cleanup(self) -> None:
        """
        Clean up the status file when the analysis is complete.
        """
        try:
            if os.path.exists(self.status_file_path):
                os.remove(self.status_file_path)
        except Exception as e:
            print(f"Error cleaning up status file: {e}")

# Create a singleton instance
status_manager = StatusManager()
