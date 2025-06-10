import os
import json
from dotenv import load_dotenv

# Get the absolute path to the root of the workspace
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
# Construct the path to the .env file
dotenv_path = os.path.join(workspace_root, '.env')
# Load the .env file explicitly
load_dotenv(dotenv_path, override=True)
# Retrieve the API key
openai_api_key = os.getenv('OPENAI_API_KEY')
model = os.getenv('MODEL')
#print(f"MODEL: {model}")

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model=model, temperature=0)

# Create a diagnosis node
from graph.state import OverallState, ConsultingState
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from config import config_manager

def recommend(state: ConsultingState):
    print("... Recommend start ...")
    analyst = state["analyst"]
    print(f"Analyst: {analyst.role}")
    
    # Get the questions for improvement
    questions_for_improvement_data = state["questions_for_improvement_for_analyst"]
    
    # Check if the questions for improvement is a string (JSON) or a dictionary
    if isinstance(questions_for_improvement_data, str):
        try:
            questions_for_improvement_data = json.loads(questions_for_improvement_data)
        except json.JSONDecodeError:
            # If it's not valid JSON, use it as is
            pass
    
    # Filter the questions for improvement based on the analyst's assigned questions
    filtered_questions_for_improvement = {}
    if isinstance(questions_for_improvement_data, dict):
        for question_category in analyst.questions:
            if question_category in questions_for_improvement_data:
                filtered_questions_for_improvement[question_category] = questions_for_improvement_data[question_category]
        
        # Convert the filtered questions for improvement back to a formatted string
        formatted_questions_for_improvement = json.dumps(filtered_questions_for_improvement, indent=2)
    else:
        # If questions_for_improvement_data is not a dictionary, use it as is
        formatted_questions_for_improvement = questions_for_improvement_data
    
    # Aggregate all diagnosis texts from the list
    diagnoses = state["diagnosis"]
    diagnosis_texts = []
    for diag in diagnoses:
        # Adjust extraction depending on your intended structure
        if isinstance(diag, dict) and "diagnosis" in diag:
            diagnosis_texts.append(diag["diagnosis"])
    # Join if needed
    diagnosis_str = "\n".join(diagnosis_texts)
    
    # Combine diagnosis with questions for improvement
    combined_input = f"""
DIAGNOSIS:
{diagnosis_str}

QUESTIONS FOR IMPROVEMENT:
{formatted_questions_for_improvement}
"""
    
    # Get the prompt from configuration
    system_prompt = config_manager.get_prompt("recommend")
    
    system_message = system_prompt.format(
        goals=analyst.persona,
        diagnosis=combined_input
    )
    recommendation = llm.invoke([SystemMessage(content=system_message)])
    
    return {
        "recommendations": [{
            "author": analyst.name,
            "recommendation": recommendation.content
        }]
    }
