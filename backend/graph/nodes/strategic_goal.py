import json
from graph.state import OverallState
from utils.category_translations import get_display_name

def set_strategic_goal(state: OverallState):
    """
    Process user feedback to set strategic goals.
    
    Returns:
        dict: A dictionary with strategic_goals containing the user's input
    """
    # Get user feedback
    user_feedback = state.get("user_feedback", "")
    print(f"Processing user feedback: {user_feedback}")
    
    # Get existing strategic goals or initialize empty dict
    strategic_goals = state.get("strategic_goals", {})
    
    # Make a copy of strategic_goals to avoid modifying the original
    strategic_goals = dict(strategic_goals)
    
    # Categories for strategic goals
    categories = [
        "Role i Współpraca",
        "Szkolenie",
        "Działania i Przepływ",
        "Podejmowanie Decyzji",
        "Procesy ZW",
        "Techniki ZW",
        "Metody",
        "Komputeryzacja i Oprogramowanie"
    ]
    
    # If we've collected all categories, return the final result
    if len(strategic_goals) >= len(categories):
        print("Strategic Goals:")
        for category, level in strategic_goals.items():
            display_name = get_display_name(category)
            print(f"{display_name}: {level}")
        return {"strategic_goals": strategic_goals}
    
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
                display_name = get_display_name(current_category)
                print(f"Added strategic goal for {display_name}: {user_feedback.strip().upper()}")
            else:
                print(f"Invalid input: {user_feedback}. Expected a letter from A to E.")
                # Don't add this input to strategic_goals, so we'll ask for the same category again
                return {"strategic_goals": strategic_goals}
    
    # Print the current state of strategic goals
    print("\nStrategic Goals collected so far:")
    for category, level in strategic_goals.items():
        display_name = get_display_name(category)
        print(f"{display_name}: {level}")
    
    # Return the updated strategic goals
    return {"strategic_goals": strategic_goals}

def identify_areas_for_improvement(state: OverallState):
    """
    Compares strategic goals with maturity levels to identify areas for improvement.
    
    Areas for improvement are those where strategic goals have a higher rank than maturity levels.
    Ranking: A < B < C < D < E
    
    Args:
        state: The overall state containing maturity_levels and strategic_goals
        
    Returns:
        dict: A dictionary with areas_for_improvement containing identified areas
              with their current (from) and target (to) levels
    """
    # Get maturity levels and strategic goals from state
    maturity_levels = state.get("maturity_levels", {})
    strategic_goals = state.get("strategic_goals", {})
    
    # Define the ranking order (A is lowest, E is highest)
    rank_order = {"A": 1, "B": 2, "C": 3, "D": 4, "E": 5}
    
    # Identify areas for improvement
    areas_for_improvement = {}
    
    for category in strategic_goals:
        # Skip if category is not in maturity_levels
        if category not in maturity_levels:
            continue
            
        maturity_rank = rank_order.get(maturity_levels[category], 0)
        goal_rank = rank_order.get(strategic_goals[category], 0)
        
        # If strategic goal rank is higher than maturity rank, this is an area for improvement
        if goal_rank > maturity_rank:
            areas_for_improvement[category] = {
                "from": maturity_levels[category],
                "to": strategic_goals[category]
            }
    
    # Print the results
    print("\nAreas for Improvement:")
    print("---------------------")
    if areas_for_improvement:
        for category, levels in areas_for_improvement.items():
            display_name = get_display_name(category)
            print(f"{display_name}: Current level: {levels['from']} → Target level: {levels['to']}")
    else:
        print("No areas identified for improvement.")
    
    return {"areas_for_improvement": areas_for_improvement}

def identify_questions_for_improvement(state: OverallState):
    """
    Identifies specific questions that need improvement based on the strategic goals.
    
    For each question in categories where the strategic goal is higher than the current level,
    determines if the question's answer needs to be improved to meet the strategic goal.
    
    Args:
        state: The overall state containing strategic_goals and questionnaire
        
    Returns:
        dict: A dictionary with question groups, questions, and their current and target levels,
              including intermediate levels (via) and level descriptions
    """
    # Get strategic goals and questionnaire from state
    strategic_goals = state.get("strategic_goals", {})
    questionnaire = state.get("questionnaire", {})
    
    # Define the ranking order (A is lowest, E is highest)
    rank_order = {"A": 1, "B": 2, "C": 3, "D": 4, "E": 5}
    rank_letters = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E"}
    
    try:
        # Load the mapping between answers and maturity levels
        with open('data/all_questions.json', 'r') as f:
            all_questions_data = json.load(f)
    except Exception as e:
        print(f"Error reading questions data: {e}")
        return {"questions_for_improvement": {}}
    
    # Determine the letter values (A, B, C, D, E) for each answer in the questionnaire
    category_answers = {}
    
    for category, questions in questionnaire.items():
        category_answers[category] = []
        
        for question, answer in questions.items():
            # Find the corresponding letter for this answer
            letter_found = False
            if category in all_questions_data and question in all_questions_data[category]:
                for letter, letter_answer in all_questions_data[category][question].items():
                    if letter_answer == answer:
                        category_answers[category].append((question, letter))
                        letter_found = True
                        break
            
            # If no letter was found, use a default (this shouldn't happen if data is consistent)
            if not letter_found:
                category_answers[category].append((question, "A"))
    
    # Identify questions that need improvement
    questions_for_improvement = {}
    
    for category, goal_level in strategic_goals.items():
        # Skip if category is not in the questionnaire data
        if category not in category_answers or category not in questionnaire:
            continue
        
        goal_rank = rank_order.get(goal_level, 0)
        category_improvements = {}
        
        # Check each question's answer
        for question, answer_letter in category_answers[category]:
            answer_rank = rank_order.get(answer_letter, 0)
            
            # If the answer rank is lower than the goal rank, this question needs improvement
            if answer_rank < goal_rank:
                # Generate the list of intermediate levels (via)
                via = []
                via_descriptions = []
                for rank in range(answer_rank + 1, goal_rank):
                    level = rank_letters[rank]
                    via.append(level)
                    # Get the description for this intermediate level if available
                    if category in all_questions_data and question in all_questions_data[category] and level in all_questions_data[category][question]:
                        via_descriptions.append({
                            "level": level,
                            "description": all_questions_data[category][question][level]
                        })
                
                # Get the text descriptions for from and to levels
                from_description = questionnaire[category][question]
                to_description = ""
                
                # Get the target level description from all_questions_data
                if category in all_questions_data and question in all_questions_data[category] and goal_level in all_questions_data[category][question]:
                    to_description = all_questions_data[category][question][goal_level]
                else:
                    to_description = f"[Target level {goal_level} description not available]"
                
                category_improvements[question] = {
                    "from": {
                        "level": answer_letter,
                        "description": from_description
                    },
                    "via": via_descriptions if via_descriptions else via,
                    "to": {
                        "level": goal_level,
                        "description": to_description
                    }
                }
        
        # Add the category to the improvement dictionary if there are questions to improve
        if category_improvements:
            questions_for_improvement[category] = category_improvements
    
    # Print the results
    print("\nQuestions for Improvement:")
    print("-------------------------")
    if questions_for_improvement:
        for category, questions in questions_for_improvement.items():
            display_name = get_display_name(category)
            print(f"\n{display_name}:")
            for question, improvement in questions.items():
                print(f"  - {question}")
                print(f"    From: {improvement['from']['level']} → {improvement['from']['description']}")
                
                # Print via levels with descriptions if available
                if improvement['via']:
                    if isinstance(improvement['via'][0], dict):
                        # If via contains dictionaries with level and description
                        via_str = ", ".join([f"{v['level']}: {v['description']}" for v in improvement['via']])
                        print(f"    Via: {via_str}")
                    else:
                        # If via contains just level letters
                        print(f"    Via: {', '.join(improvement['via'])}")
                
                print(f"    To: {improvement['to']['level']} → {improvement['to']['description']}")
    else:
        print("No questions identified for improvement.")
    
    return {"questions_for_improvement": questions_for_improvement}
