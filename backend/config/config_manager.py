import os
import json
from typing import Dict, Any, Optional

class ConfigManager:
    """
    Configuration manager for loading and accessing configuration data.
    Follows the Configuration Driven Development pattern by centralizing configuration.
    """
    
    _instance = None
    _config_cache = {}
    
    def __new__(cls):
        """Singleton pattern to ensure only one instance of ConfigManager exists."""
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize the configuration manager by setting up paths."""
        # Get the absolute path to the root of the workspace
        self.workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
        self.config_dir = os.path.join(self.workspace_root, 'config')
    
    def load_config(self, config_name: str) -> Dict[str, Any]:
        """
        Load a configuration file by name.
        
        Args:
            config_name: Name of the configuration file without extension
            
        Returns:
            Dict containing the configuration data
        """
        # Check if config is already cached
        if config_name in self._config_cache:
            return self._config_cache[config_name]
        
        # Load the configuration file
        config_path = os.path.join(self.config_dir, f"{config_name}.json")
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
                self._config_cache[config_name] = config_data
                return config_data
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file {config_name}.json not found in {self.config_dir}")
        except json.JSONDecodeError:
            raise ValueError(f"Configuration file {config_name}.json contains invalid JSON")
    
    def get_prompt(self, prompt_type: str, prompt_key: str = "system") -> str:
        """
        Get a prompt from the prompts configuration.
        
        Args:
            prompt_type: Type of prompt (e.g., 'create_analysts', 'diagnose')
            prompt_key: Key within the prompt type (default: 'system')
            
        Returns:
            String containing the prompt
        """
        prompts = self.load_config("prompts")
        if prompt_type not in prompts:
            raise KeyError(f"Prompt type '{prompt_type}' not found in prompts configuration")
        
        prompt_data = prompts[prompt_type]
        if prompt_key not in prompt_data:
            raise KeyError(f"Prompt key '{prompt_key}' not found in prompt type '{prompt_type}'")
        
        return prompt_data[prompt_key]

# Create a singleton instance for easy import
config_manager = ConfigManager()
