import os
import json
import datetime
from dotenv import load_dotenv

# Get the absolute path to the root of the workspace
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
# Construct the path to the .env file
dotenv_path = os.path.join(workspace_root, '.env')
# Load the .env file explicitly
load_dotenv(dotenv_path, override=True)
# Retrieve the API key and model
openai_api_key = os.getenv('OPENAI_API_KEY')
model = os.getenv('MODEL')

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model=model, temperature=0)

from graph.state import OverallState
from langchain_core.messages import SystemMessage
from config import config_manager

def write_report(state: OverallState):
    """ Node to summarize diagnosis and recommendations in a single report """
    # Access aggregated data from the state.
    diagnosis = state.get('diagnosis', [])
    recommendations = state.get('recommendations', [])
    maturity_levels = state.get('maturity_levels', {})
    strategic_goals = state.get('strategic_goals', {})
    areas_for_improvement = state.get('areas_for_improvement', {})
    questions_for_improvement = state.get('questions_for_improvement', {})
    
    # Get the analysts from the state
    analysts = state.get('analysts', [])
    
    # Create a dictionary to map analyst names to their personas
    analyst_personas = {analyst.name: analyst.persona for analyst in analysts}
    
    # Format the diagnosis, recommendations, and analyst personas for readability.
    formatted_analyst_sections = []
    
    # Group diagnoses and recommendations by analyst
    analyst_data = {}
    
    # Ensure diagnosis is a list of dictionaries
    if isinstance(diagnosis, list):
        # Collect diagnoses by analyst
        for d in diagnosis:
            if isinstance(d, dict) and 'author' in d and 'diagnosis' in d:
                author = d['author']
                if author not in analyst_data:
                    analyst_data[author] = {'diagnosis': [], 'recommendations': []}
                analyst_data[author]['diagnosis'].append(d['diagnosis'])
    else:
        pass
    
    # Ensure recommendations is a list of dictionaries
    if isinstance(recommendations, list):
        # Collect recommendations by analyst
        for r in recommendations:
            if isinstance(r, dict) and 'author' in r and 'recommendation' in r:
                author = r['author']
                if author not in analyst_data:
                    analyst_data[author] = {'diagnosis': [], 'recommendations': []}
                analyst_data[author]['recommendations'].append(r['recommendation'])
    else:
        pass
    
    # Format each analyst's section
    for author, data in analyst_data.items():
        persona = analyst_personas.get(author, "Persona information not available")
        diagnoses = "\n\n".join(data['diagnosis'])
        recommendations = "\n\n".join(data['recommendations'])
        
        # Get the questions for improvement for this analyst
        analyst_questions = {}
        for analyst in analysts:
            if analyst.name == author:
                # Find the questions assigned to this analyst
                for question_category in analyst.questions:
                    if question_category in questions_for_improvement:
                        if author not in analyst_questions:
                            analyst_questions[author] = {}
                        analyst_questions[author][question_category] = questions_for_improvement[question_category]
        
        # Format the questions for improvement with detailed from/via/target analysis
        questions_section = ""
        if author in analyst_questions:
            questions_section = "## Questions for Improvement:\n\n"
            for category, questions in analyst_questions[author].items():
                questions_section += f"### {category}:\n\n"
                
                # Try to parse the questions to extract from/via/target information
                try:
                    if isinstance(questions, str):
                        # If it's a JSON string, try to parse it
                        try:
                            questions_data = json.loads(questions)
                            if isinstance(questions_data, dict):
                                questions_section += "| Question | FROM (Current State) | VIA (Intermediate Steps) | TARGET (Desired State) |\n"
                                questions_section += "|----------|---------------------|--------------------------|------------------------|\n"
                                for question, value in questions_data.items():
                                    current_state = "Not specified"
                                    via_state = "Not specified"
                                    target_state = "Not specified"
                                    
                                    # Try to extract structured information if available
                                    if isinstance(value, dict):
                                        if "from" in value:
                                            current_state = value["from"]
                                        if "via" in value:
                                            via_state = value["via"]
                                        if "target" in value:
                                            target_state = value["target"]
                                    
                                    questions_section += f"| {question} | {current_state} | {via_state} | {target_state} |\n"
                            else:
                                # If it's not a dictionary, just include the raw data
                                questions_section += f"{questions}\n\n"
                        except json.JSONDecodeError:
                            # If it's not valid JSON, use it as is
                            questions_section += f"{questions}\n\n"
                    else:
                        # If it's not a string, just include the raw data
                        questions_section += f"{questions}\n\n"
                except Exception as e:
                    questions_section += f"{questions}\n\n"
        
        formatted_section = f"""
Analyst: {author}
Persona:
{persona}

{questions_section}
Diagnosis:
{diagnoses}

Recommendations:
{recommendations}
"""
        formatted_analyst_sections.append(formatted_section)
    
    # Join all analyst sections
    formatted_analyst_content = "\n\n" + "\n\n".join(formatted_analyst_sections)
    
    # For backward compatibility, also create the old format with error handling
    try:
        if isinstance(diagnosis, list):
            formatted_diagnosis_items = []
            for d in diagnosis:
                if isinstance(d, dict) and 'author' in d and 'diagnosis' in d:
                    formatted_diagnosis_items.append(f"Analyst: {d['author']}\nDiagnosis: {d['diagnosis']}")
            formatted_diagnosis = "\n\n".join(formatted_diagnosis_items)
        else:
            formatted_diagnosis = "No diagnosis data available"
            
        if isinstance(recommendations, list):
            formatted_recommendations_items = []
            for r in recommendations:
                if isinstance(r, dict) and 'author' in r and 'recommendation' in r:
                    formatted_recommendations_items.append(f"Analyst: {r['author']}\nRecommendation: {r['recommendation']}")
            formatted_recommendations = "\n\n".join(formatted_recommendations_items)
        else:
            formatted_recommendations = "No recommendations data available"
    except Exception as e:
        formatted_diagnosis = "Error formatting diagnosis data"
        formatted_recommendations = "Error formatting recommendations data"
    
    # Get the prompt from configuration
    system_prompt = config_manager.get_prompt("write_report")
    
    # Prepare the system message using the formatted strings.
    system_message_text = system_prompt.format(
        diagnosis=formatted_analyst_content,  # Use the new formatted analyst content that includes personas
        recommendations=formatted_recommendations,  # Keep this for backward compatibility
        maturity_levels=maturity_levels,
        strategic_goals=strategic_goals,
        areas_for_improvement=areas_for_improvement,
        questions_for_improvement=questions_for_improvement
    )
    system_message = SystemMessage(content=system_message_text)
    
    # Invoke the LLM.
    report_result = llm.invoke([system_message])
    
    # If the LLM returns an object with a 'content' attribute, extract it.
    report_content = report_result.content if hasattr(report_result, "content") else report_result
    
    # Create reports directory if it doesn't exist
    reports_dir = os.path.join(workspace_root, 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    
    # Generate a filename based on current timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"report_{timestamp}.md"
    filepath = os.path.join(reports_dir, filename)
    
    # Write the report content to the file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    # Return the final report and the filepath
    # Make sure to return the filepath as a relative path from the backend directory
    # This will make it easier for the frontend to find the file
    reports_dir = os.path.join(workspace_root, 'reports')
    relative_filepath = os.path.relpath(filepath, workspace_root)
    
    return {"report": report_content, "filepath": relative_filepath}
