import json
import sys

def process_answers(file_prefix):
    """
    Process answers from a text file and match them with questions from all_questions.json
    
    Args:
        file_prefix (str): The prefix of the answer file (e.g., "answer_1" or "answer_2")
    """
    # Load JSON data with all questions and possible answers
    with open('data/all_questions.json', 'r', encoding='utf-8') as json_file:
        questions_data = json.load(json_file)

    # Load answers from the answer file
    answer_file_path = f'data/{file_prefix}.txt'
    with open(answer_file_path, 'r', encoding='utf-8') as answer_file:
        answer_lines = answer_file.readlines()

    # Prepare a dictionary to store the client's answers
    client_answers = {}
    line_index = 0

    # Iterate through the questions data to match it with answers
    for main_category, subcategories in questions_data.items():
        client_answers[main_category] = {}
        # Skip the main category header in answer file
        line_index += 1
        
        # Get the answers line and split by commas
        answers_line = answer_lines[line_index].strip().split(",")
        question_index = 0
        
        for question, options in subcategories.items():
            if question_index < len(answers_line):
                selected_option = answers_line[question_index]
                # Assign the selected answer to the dictionary
                if selected_option in options:
                    client_answers[main_category][question] = options[selected_option]
                else:
                    print(f"Warning: Option '{selected_option}' not found for question '{question}'")
                    client_answers[main_category][question] = f"Unknown option: {selected_option}"
                question_index += 1
            else:
                print(f"Warning: Not enough answers for category '{main_category}'")
                client_answers[main_category][question] = "No answer provided"
        
        # Move to the next line in the answers file
        line_index += 1

    # Save the client's answers into a new JSON file
    output_file = f'data/{file_prefix}.json'
    with open(output_file, 'w', encoding='utf-8') as out_file:
        json.dump(client_answers, out_file, ensure_ascii=False, indent=4)

    print(f'Client answers saved to {output_file}')

# If this script is run directly, process the specified answer file
if __name__ == "__main__":
    # Default to answer_1 if no argument is provided
    file_prefix = "answer_1"
    
    # Check if a command-line argument was provided
    if len(sys.argv) > 1:
        file_prefix = sys.argv[1]
    
    print(f"Processing {file_prefix}.txt...")
    process_answers(file_prefix)
