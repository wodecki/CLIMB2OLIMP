import os
import json
import tomllib
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from state import DocumentState

# Load environment variables
load_dotenv()


def create_llm(provider: str, model_name: str, config: dict, provider_config: dict):
    """Factory function to create LLM based on provider"""
    # Get provider-specific temperature setting
    temperature = provider_config.get("temperature", 0.1)
    
    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            max_tokens=65536,
            timeout=config.get("timeout", None),
            max_retries=config.get("max_retries", 2),
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )
    elif provider == "openai":
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            max_tokens=config.get("max_tokens", None),
            timeout=config.get("timeout", None),
            max_retries=config.get("max_retries", 2),
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
    elif provider == "anthropic":
        # Anthropic requires max_tokens to be an integer, not None
        anthropic_kwargs = {
            "model": model_name,
            "temperature": temperature,
            "max_retries": config.get("max_retries", 2),
            "anthropic_api_key": os.getenv("ANTHROPIC_API_KEY")
        }
        if config.get("max_tokens") is not None:
            anthropic_kwargs["max_tokens"] = config.get("max_tokens")
        if config.get("timeout") is not None:
            anthropic_kwargs["timeout"] = config.get("timeout")
        return ChatAnthropic(**anthropic_kwargs)
    else:
        raise ValueError(f"Unsupported provider: {provider}")


def recommend(state: DocumentState) -> DocumentState:
    """
    Node to generate recommendations based on gaps analysis using configurable LLM
    
    Args:
        state: The current state containing gaps analysis
        
    Returns:
        Updated state with recommendation report
    """
    print("Generating recommendations based on gaps analysis...")
    
    # Check if gaps exist
    if not state.get("gaps"):
        print("No gaps found in state - skipping recommendations")
        return state
    
    try:
        # Load model configuration
        try:
            with open("./config/recommendations.toml", "rb") as f:
                rec_config = tomllib.load(f)
        except Exception as e:
            print(f"Error loading recommendations config: {e}")
            return state
        
        # Get provider and model settings
        provider = rec_config["model"]["provider"]
        model_config = rec_config["model"]
        
        # Get model name from environment
        provider_config = rec_config["providers"][provider]
        model_env_key = provider_config["model_env_key"]
        model_name = os.getenv(model_env_key)
        
        if not model_name:
            print(f"Error: Model name not found in environment variable {model_env_key}")
            return state
        
        # Get provider-specific configuration
        provider_config = rec_config["providers"][provider]
        
        # Initialize LLM based on provider
        llm = create_llm(provider, model_name, model_config, provider_config)
        
        print(f"Initialized LangChain {provider} model: {model_name}")
        
        # Load recommendation prompt from config
        try:
            with open("./config/prompts.toml", "rb") as f:
                prompts_config = tomllib.load(f)
            
            if "recommend" not in prompts_config or "recommendation_prompt" not in prompts_config["recommend"]:
                print("Error: recommendation_prompt not found in config/prompts.toml")
                return state
            
            recommendation_prompt = prompts_config["recommend"]["recommendation_prompt"]
                
        except Exception as e:
            print(f"Error loading prompt config: {e}")
            return state
        
        # Load supplementary questionnaire answers for context
        supplementary_answers = None
        try:
            with open("./data/process/A_1.json", "r", encoding="utf-8") as f:
                supplementary_answers = json.load(f)
            print("Loaded supplementary questionnaire data (A_1.json) for context")
        except FileNotFoundError:
            print("A_1.json not found - proceeding without supplementary context")
        except Exception as e:
            print(f"Error loading A_1.json: {e} - proceeding without supplementary context")
        
        # Format gaps data and supplementary context as JSON strings for the prompt
        gaps_json = json.dumps(state["gaps"], ensure_ascii=False, indent=2)
        
        if supplementary_answers:
            supplementary_json = json.dumps(supplementary_answers, ensure_ascii=False, indent=2)
            formatted_prompt = recommendation_prompt.format(
                gaps_data=gaps_json,
                supplementary_context=supplementary_json
            )
        else:
            # If no supplementary data, format prompt without it
            formatted_prompt = recommendation_prompt.format(
                gaps_data=gaps_json,
                supplementary_context="Brak dodatkowych danych z kwestionariusza."
            )
        
        print(f"Generating recommendations with LangChain {provider}...")
        
        # Create message for LangChain
        message = HumanMessage(content=formatted_prompt)
        
        # Generate recommendations using LangChain
        response = llm.invoke([message])
        
        if not response.content:
            print(f"Error: No response from LangChain {provider}")
            return state
            
        # Clean the response - remove markdown code block markers if present
        recommendation_report = response.content.strip()
        if recommendation_report.startswith('```markdown'):
            recommendation_report = recommendation_report[11:]
        if recommendation_report.startswith('```'):
            recommendation_report = recommendation_report[3:]
        if recommendation_report.endswith('```'):
            recommendation_report = recommendation_report[:-3]
        recommendation_report = recommendation_report.strip()
        
        # Save recommendations to state for evaluation workflow
        state["recommendations"] = recommendation_report
        
        # Initialize evaluation fields if not present
        if "evaluation_iterations" not in state:
            state["evaluation_iterations"] = 0
        if "recommendation_approved" not in state:
            state["recommendation_approved"] = False
        
        # Determine output filename based on main file
        output_filename = "A_recommendations.md"  # Default
        if os.path.exists("./data/process/A.json"):
            output_filename = "A_recommendations.md"
        
        # Ensure reports directory exists
        reports_dir = "./data/reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        # Save report to markdown file
        output_path = f"{reports_dir}/{output_filename}"
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(recommendation_report)
            print(f"Recommendations saved to {output_path}")
        except Exception as e:
            print(f"Error saving recommendations: {e}")
            return state
        
        print("Recommendations generated successfully")
        
        return state
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return state