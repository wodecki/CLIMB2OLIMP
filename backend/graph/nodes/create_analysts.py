import os
from dotenv import load_dotenv

# Get the absolute path to the root of the workspace
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
# Construct the path to the .env file
dotenv_path = os.path.join(workspace_root, '.env')
# Load the .env file explicitly
load_dotenv(dotenv_path, override=True)

# Import necessary modules
from graph.state import GenerateAnalystsState, Analyst
from config import config_manager

def create_analysts(state: GenerateAnalystsState):
    """ Create analysts by loading them from agents.json """
    
    # Load analysts from agents.json
    agents_data = config_manager.load_config("agents")
    
    # Convert agents data to Analyst objects
    analysts = []
    for agent in agents_data:
        # Format the description from the structured data
        description = f"""Focus: {agent['Description']['Focus']}
Competencies: {agent['Description']['Competencies']}
Tasks: {agent['Description']['Tasks']}
Motives: {agent['Description']['Motives']}"""
        
        # Create Analyst object with all fields
        analyst = Analyst(
            name=agent['Name'],
            role=agent['Role'],
            area=agent['Area'],
            focus=agent['Description']['Focus'],
            competencies=agent['Description']['Competencies'],
            tasks=agent['Description']['Tasks'],
            motives=agent['Description']['Motives'],
            questions=agent['Questions'],
            description=description
        )
        
        analysts.append(analyst)
    
    # Return the list of analysts
    return {"analysts": analysts}
