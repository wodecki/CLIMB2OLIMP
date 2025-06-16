import json
from graph.state import OverallState

def calculate_maturity_level(state: OverallState):
    """
    Uses the questionnaire state to assign a maturity level to each category
    based on the lowest answer value for that category.
    
    Example: EEBCAD > A (where A is the lowest value)
    
    Returns:
        dict: A dictionary with categories as keys and maturity levels as values
    """
    # Get the questionnaire data from the state
    questionnaire = state.get("questionnaire", {})
    
    # Load the mapping between answers and maturity levels (Polish version)
    with open('data/CLIMB2.json', 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
    
    # Calculate maturity level for each category
    maturity_levels = {}
    
    for category, questions in questionnaire.items():
        category_letters = []
        
        for question, answer in questions.items():
            # Find the corresponding letter for this answer
            if category in questions_data and question in questions_data[category]:
                for letter, letter_answer in questions_data[category][question].items():
                    if letter_answer == answer:
                        category_letters.append(letter)
                        break
        
        if category_letters:
            # Find the lowest letter (A < B < C < D < E)
            lowest_letter = min(category_letters)
            maturity_levels[category] = lowest_letter
    
    # Print the results
    print("Category Maturity Levels:")
    print("------------------------")
    for category, level in maturity_levels.items():
        print(f"{category}: {level}")
    
    # Save maturity levels to a file
    try:
        with open('maturity_levels.json', 'w') as f:
            json.dump({"maturityLevels": maturity_levels}, f, indent=2)
        print("Maturity levels saved to maturity_levels.json")
    except Exception as e:
        print(f"Error saving maturity levels: {e}")
    
    return {"maturity_levels": maturity_levels}
