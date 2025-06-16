import os
import sys
import time
from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import Send
from langgraph.graph import START, END, StateGraph

# load dotenv
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
dotenv_path = os.path.join(workspace_root, '.env')
load_dotenv(dotenv_path, override=True)
openai_api_key = os.getenv('OPENAI_API_KEY')
model = os.getenv('MODEL')
#print(f"MODEL: {model}")

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model=model, temperature=0)

# Import status manager
from graph.status_manager import status_manager

# Wrap the original node functions to update status
def wrap_node_with_status(node_func, node_name):
    def wrapped_node_func(*args, **kwargs):
        # Update status before executing the node
        status_manager.update_node(node_name)
        # Print debug info
        print(f"DEBUG: Executing node: {node_name}")
        # Call the original node function
        result = node_func(*args, **kwargs)
        print(f"DEBUG: Completed node: {node_name}")
        return result
    return wrapped_node_func

from graph.nodes.maturity_level import calculate_maturity_level
from graph.nodes.strategic_goal import set_strategic_goal, identify_areas_for_improvement, identify_questions_for_improvement
from graph.nodes.create_analysts import create_analysts
from graph.nodes.diagnose import diagnose
from graph.nodes.recommend import recommend
from graph.nodes.write_report import write_report
from graph.state import OverallState, ConsultingState, GenerateAnalystsState

# define mapping functions
def initiate_consulting_threads(state: OverallState):
    """ Initiate parallel agent workflow using isolated substates for each analyst """
    print("... Initiate analysis ...")
    
    analysts = state["analysts"]
    questionnaire = state.get("questionnaire", "Questionnaire results")
    questions_for_improvement = state.get("questions_for_improvement", "Questions for improvement")
    
    print("... Analysis initiated...")
    return [
        Send(
            "consulting", 
            {
                "analyst": analyst,  # Pass individual analyst here, without attempting to store in OverallState
                "questionnaire_for_analyst": questionnaire,
                "questions_for_improvement_for_analyst": questions_for_improvement,
            }
        ) for analyst in analysts
    ]

# Add human-in-the-loop
from langgraph.types import Command, interrupt
from langgraph.checkpoint.memory import MemorySaver

def human_feedback(state: OverallState):
    print("---human_feedback---")
    
    # Check if running in non-interactive mode
    is_non_interactive = os.environ.get('NON_INTERACTIVE', 'false').lower() == 'true'
    
    # Categories for strategic goals
    categories = [
        "Roles and Collaboration",
        "Training",
        "Activities and Flow",
        "Decision-Making",
        "KM Processes",
        "KM Techniques",
        "Methods",
        "Computerization and Software"
    ]
    
    # Get existing strategic goals or initialize empty dict
    strategic_goals = state.get("strategic_goals", {})
    
    # Get maturity levels for reference
    maturity_levels = state.get("maturity_levels", {})
    
    # Print the current state of strategic goals
    if strategic_goals:
        print("\nStrategic Goals collected so far:")
        for category, level in strategic_goals.items():
            print(f"{category}: {level}")
    
    # In non-interactive mode, provide default feedback for all categories at once
    if is_non_interactive:
        # Provide default goals for all remaining categories
        for category in categories:
            if category not in strategic_goals:
                # Default to one level higher than current maturity level, or B if not available
                current_level = maturity_levels.get(category, "C")
                # Convert letter to index (A=0, B=1, C=2, D=3, E=4)
                current_index = ord(current_level) - ord('A')
                # Target one level higher, but not beyond A
                target_index = max(0, current_index - 1)
                target_level = chr(ord('A') + target_index)
                strategic_goals[category] = target_level
                print(f"Non-interactive mode: Using default goal '{target_level}' for '{category}'")
        
        return {"strategic_goals": strategic_goals}
    
    # Interactive mode - ask for all inputs at once
    # Update the status manager to indicate we need input for all categories
    status_manager.request_all_strategic_goals(categories)
    
    # Check if running from the frontend (with stdio redirected)
    is_frontend = os.environ.get('NON_INTERACTIVE', 'false').lower() == 'false' and not sys.stdin.isatty()
    
    if is_frontend:
        # When running from the frontend, wait for input from a JSON file
        input_file_path = os.path.join(workspace_root, 'user_input_all.json')
        
        # Wait for the file to appear (with timeout)
        max_wait_time = 300  # Maximum wait time in seconds
        wait_interval = 1    # Check every second
        waited_time = 0
        
        while waited_time < max_wait_time:
            # Sleep for a short time
            time.sleep(wait_interval)
            waited_time += wait_interval
            
            # Check if there's input from the frontend
            if os.path.exists(input_file_path):
                try:
                    # Read the JSON input from the file
                    with open(input_file_path, 'r') as f:
                        import json
                        frontend_input = json.load(f)
                    
                    # Delete the file after reading
                    os.remove(input_file_path)
                    
                    # Validate and process all inputs
                    for category, level in frontend_input.items():
                        if level in ["A", "B", "C", "D", "E"]:
                            strategic_goals[category] = level
                            print(f"Received input from frontend: {level} for {category}")
                    
                    # Update the status manager with all goals
                    for category, level in strategic_goals.items():
                        status_manager.update_strategic_goals(category, level)
                    
                    return {"strategic_goals": strategic_goals}
                except Exception as e:
                    print(f"Error reading frontend input: {e}")
            
            # Check if the process has been stopped
            if os.path.exists(os.path.join(workspace_root, 'stop_analysis.txt')):
                print("Analysis stopped by user")
                return {"strategic_goals": strategic_goals}
        
        # If we've waited too long, use default values
        print("Timeout waiting for frontend input. Using default goals.")
        for category in categories:
            if category not in strategic_goals:
                strategic_goals[category] = "C"  # Default goal
                print(f"Using default goal 'C' for {category}")
        
        # Update the status manager with all goals
        for category, level in strategic_goals.items():
            status_manager.update_strategic_goals(category, level)
        
        return {"strategic_goals": strategic_goals}
    else:
        # Terminal mode - collect all inputs at once
        # Display current maturity levels for reference
        print("\nCurrent maturity levels:")
        for category in categories:
            print(f"{category}: {maturity_levels.get(category, 'N/A')}")
        
        print("\nPlease enter strategic goals (A-E) for all categories at once:")
        
        # Create a temporary dictionary to store all inputs
        all_goals = {}
        
        # Ask for all goals in a single prompt
        goals_input = interrupt("Enter goals for all categories as comma-separated values (e.g., A,B,C,D,E,A,B,C): ")
        
        # Parse the input
        goals_list = goals_input.strip().upper().split(',')
        
        # If we got the right number of inputs, use them
        if len(goals_list) == len(categories):
            for i, category in enumerate(categories):
                goal = goals_list[i].strip()
                if goal in ["A", "B", "C", "D", "E"]:
                    strategic_goals[category] = goal
                else:
                    # Default to C for invalid inputs
                    print(f"Invalid input '{goal}' for {category}. Using default 'C'.")
                    strategic_goals[category] = "C"
        else:
            # If we didn't get the right number, ask for each individually
            print(f"Expected {len(categories)} values, got {len(goals_list)}. Asking for each category individually.")
            for category in categories:
                while True:
                    goal = interrupt(f"{category} goal (A-E): ")
                    if goal.strip().upper() in ["A", "B", "C", "D", "E"]:
                        strategic_goals[category] = goal.strip().upper()
                        break
                    else:
                        print(f"Invalid input. Please enter a letter from A to E.")
        
        # Update the status manager with all goals
        for category, level in strategic_goals.items():
            status_manager.update_strategic_goals(category, level)
        
        return {"strategic_goals": strategic_goals}


# Add nodes and edges to analysts_builder
analysts_builder = StateGraph(GenerateAnalystsState)
analysts_builder.add_node("create_analysts", wrap_node_with_status(create_analysts, "create_analysts"))

analysts_builder.add_edge(START, "create_analysts")
analysts_builder.add_edge("create_analysts", END)

# Add nodes and edges to diagnosis_builder
diagnosis_builder = StateGraph(ConsultingState)
diagnosis_builder.add_node("diagnose", wrap_node_with_status(diagnose, "diagnose"))
diagnosis_builder.add_node("recommend", wrap_node_with_status(recommend, "recommend"))

diagnosis_builder.add_edge(START, "diagnose")
diagnosis_builder.add_edge("diagnose", "recommend")
diagnosis_builder.add_edge("recommend", END)

# Add nodes and edges to strategic_builder
strategic_builder = StateGraph(OverallState)
strategic_builder.add_node("identify_areas_for_improvement", wrap_node_with_status(identify_areas_for_improvement, "identify_areas_for_improvement"))
strategic_builder.add_node("identify_questions_for_improvement", wrap_node_with_status(identify_questions_for_improvement, "identify_questions_for_improvement"))

strategic_builder.add_edge(START, "identify_areas_for_improvement")
strategic_builder.add_edge("identify_areas_for_improvement", "identify_questions_for_improvement")
strategic_builder.add_edge("identify_questions_for_improvement", END)

# Add nodes and edges to app_builder
app_builder = StateGraph(OverallState)
app_builder.add_node("calculate_maturity", wrap_node_with_status(calculate_maturity_level, "calculate_maturity"))
app_builder.add_node("human_feedback", wrap_node_with_status(human_feedback, "human_feedback"))
app_builder.add_node("strategic_planning", strategic_builder.compile())
app_builder.add_node("make_analysts", analysts_builder.compile())
app_builder.add_node("consulting", diagnosis_builder.compile())
app_builder.add_node("write_report", wrap_node_with_status(write_report, "write_report"))

# Process feedback and determine if we need more
def process_feedback(state: OverallState):
    """Process user feedback and update strategic goals"""
    # Get user feedback
    user_feedback = state.get("user_feedback", "")
    
    # Get existing strategic goals or initialize empty dict
    strategic_goals = state.get("strategic_goals", {})
    strategic_goals = dict(strategic_goals)  # Make a copy
    
    # Categories for strategic goals
    categories = [
        "Roles and Collaboration",
        "Training",
        "Activities and Flow",
        "Decision-Making",
        "KM Processes",
        "KM Techniques",
        "Methods",
        "Computerization and Software"
    ]
    
    # Process user feedback if available
    if user_feedback:
        # Determine which category the feedback is for
        current_category_index = len(strategic_goals)
        if current_category_index < len(categories):
            current_category = categories[current_category_index]
            
            # Validate input (should be a letter from A to E)
            if user_feedback.strip().upper() in ["A", "B", "C", "D", "E"]:
                # Add the validated input to our strategic goals
                strategic_goals[current_category] = user_feedback.strip().upper()
                print(f"Added strategic goal for {current_category}: {user_feedback.strip().upper()}")
            else:
                print(f"Invalid input: {user_feedback}. Expected a letter from A to E.")
    
    # Print the current state of strategic goals
    print("\nStrategic Goals collected so far:")
    for category, level in strategic_goals.items():
        print(f"{category}: {level}")
    
    # Return the updated strategic goals
    return {"strategic_goals": strategic_goals}

# Define a conditional edge function to determine if we need more feedback
def need_more_feedback(state: OverallState):
    # Check if running in non-interactive mode
    is_non_interactive = os.environ.get('NON_INTERACTIVE', 'false').lower() == 'true'
    
    # In non-interactive mode, we don't need to loop back for more feedback
    # because the human_feedback function will automatically provide default values
    # So we can just proceed to strategic_planning
    if is_non_interactive:
        return "strategic_planning"
    
    # Categories for strategic goals
    categories = [
        "Roles and Collaboration",
        "Training",
        "Activities and Flow",
        "Decision-Making",
        "KM Processes",
        "KM Techniques",
        "Methods",
        "Computerization and Software"
    ]
    
    # Get existing strategic goals or initialize empty dict
    strategic_goals = state.get("strategic_goals", {})
    
    # If we've collected all categories, move to strategic_planning
    # Otherwise, loop back to human_feedback
    if len(strategic_goals) >= len(categories):
        return "strategic_planning"
    else:
        return "human_feedback"

# We don't need the process_feedback node anymore
# app_builder.add_node("process_feedback", wrap_node_with_status(process_feedback, "process_feedback"))

app_builder.add_edge(START, "calculate_maturity")
app_builder.add_edge("calculate_maturity", "human_feedback")
# Go directly from human_feedback to strategic_planning
app_builder.add_edge("human_feedback", "strategic_planning")
# End the flow after strategic_planning - skip analysts and report generation
app_builder.add_edge("strategic_planning", END)

# Comment out the analyst and consulting workflow
# app_builder.add_edge("strategic_planning", "make_analysts")
# app_builder.add_conditional_edges("make_analysts", initiate_consulting_threads, ["consulting"])
# app_builder.add_edge("consulting", "write_report")
# app_builder.add_edge("write_report", END)

# Set up memory
memory = MemorySaver()

# Initialize status
status_manager.update_node("initializing")

app = app_builder.compile(checkpointer=memory)

# Optionally generate the Mermaid diagram
# Comment out to avoid timeout issues with mermaid.ink
try:
    import os
    # Only generate the diagram if the environment variable is set
    if os.getenv('GENERATE_DIAGRAM', 'false').lower() == 'true':
        app.get_graph().draw_mermaid_png(output_file_path="graph.png")
except Exception as e:
    print(f"Warning: Could not generate Mermaid diagram: {e}")
    print("Continuing without diagram generation...")
