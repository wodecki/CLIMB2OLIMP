
# Managerial Problem Solver with Multi-Agent Systems

This Python mini-library leverages a **multi-agent system** built using [LangGraph](https://github.com/langgraph/langgraph) to diagnose and recommend solutions for managerial challenges. The system processes a user-provided query (or a default question) and generates a detailed report based on its analysis.

---

## Features

- Utilizes **LangGraph** for multi-agent architecture.
- Provides diagnosis and recommendations for managerial problems.
- Flexible CLI interface:
  - Run with a default question.
  - Specify a custom question as a parameter.

---

## Getting Started

Follow the steps below to set up the project and run the application.

### Prerequisites

- Python 3.9 or higher
- [Git](https://git-scm.com/)
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver

---

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/wodecki/multi-agent-management.git
cd multi-agent-management
```

#### 2. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### 3. Create a Virtual Environment and Install Dependencies

uv handles both virtual environment creation and dependency installation:

```bash
# Create a virtual environment in .venv directory
uv venv

# Activate the virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt
```

#### 4. For Reproducible Installations (Optional)

For exact version matching using the lockfile:

```bash
uv pip install -r pyproject.toml
```

---

### Usage

Run the application from the command line.

#### Example 1: Use the Default Question
```bash
python main.py
```

#### Example 2: Provide a Custom Question
```bash
python main.py "I work for the automotive industry. Diagnose my product management maturity."
```

---

## Configuration

### Environment Variables

The application uses environment variables to store the **OpenAI API key**. Create a `.env` file in the root directory with the following content:

```env
OPENAI_API_KEY=your_openai_api_key
MODEL=gpt-4-turbo
```

Replace `your_openai_api_key` with your actual OpenAI API key.

### Configuration Driven Development

This project follows the Configuration Driven Development (CDD) pattern, which separates configuration from code:

- **Centralized Configuration**: All prompts are stored in `config/prompts.json`
- **Configuration Manager**: The `ConfigManager` class in `config/config_manager.py` provides a clean API for accessing configuration
- **Separation of Concerns**: Business logic is separated from configuration data

Benefits of this approach:
- Easier maintenance and updates to prompts without changing code
- Consistent prompt management across the application
- Ability to version and track changes to prompts separately from code
- Simplified testing with mock configurations

To modify prompts, edit the `config/prompts.json` file. The configuration manager will automatically load the updated prompts.

---

### Development
## Development Workflow

1. **Install Virtual Environment**: Follow the [Installation](#installation) steps.
2. **Modify Code**: Update the `main.py` or any other module as needed.
3. **Run Tests**: (Add testing instructions here if applicable.)

## Backlog
1. Save reports in a nice markdown format
2. Add web interface
3. Add agent monitoring
...
---

## Important Libraries

This project uses the following key libraries:
- **[LangGraph](https://github.com/langgraph/langgraph)**: The core library for building the multi-agent system.
- **[Python-dotenv](https://github.com/theskumar/python-dotenv)**: For managing environment variables.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m "Add a new feature"`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Special thanks to the developers of **LangGraph** for their incredible multi-agent framework.
