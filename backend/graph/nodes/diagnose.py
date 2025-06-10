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


def diagnose(state: ConsultingState):
    """ Node to perform needs analysis and formulate the diagnosis """
    print("... Diagnose start...")
    # Get state
    analyst = state["analyst"]
    
    # Get the questions for improvement
    questions_for_improvement_data = state["questions_for_improvement_for_analyst"]
    
    # Print the questions for improvement for testing
    #print(f"Questions for improvement: {questions_for_improvement_data}")
    
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
    
    print(f"Analyst: {analyst.role}")
    #print(f"Assigned question categories: {', '.join(analyst.questions)}")
    #print(f"Filtered questions for improvement: {formatted_questions_for_improvement}")
    # Get the prompt from configuration
    system_prompt = config_manager.get_prompt("diagnose")
    
    # Generate diagnosis
    system_message = system_prompt.format(
        goals=analyst.persona, 
        questionnaire=formatted_questions_for_improvement
    )
    diagnosis_result = llm.invoke([SystemMessage(content=system_message)])
    print(f"Diagnosis result: {diagnosis_result.content}")
    print("... Diagnose end...")
    return {
        "diagnosis": [{
            "author": analyst.name,
            "diagnosis": diagnosis_result.content
        }]
    }
