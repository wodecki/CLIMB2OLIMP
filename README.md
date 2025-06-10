# CLIMB2 - AI-Enhanced Organizational Maturity Assessment Framework

**A Research Implementation of Multi-Agent AI Analysis for Organizational Capability Assessment**

CLIMB2 demonstrates a novel approach to organizational maturity assessment using AI-powered multi-agent analysis. This repository implements the research framework described in our paper, showcasing how specialized AI analyst personas can evaluate organizational capabilities and generate strategic improvement recommendations across eight critical dimensions of AI readiness.

## Core Research Framework

### 1. Multi-Stage Assessment Methodology

The framework follows a structured six-stage workflow that combines quantitative measurement with qualitative AI-driven analysis:

1. **Maturity Level Calculation** - Quantitative assessment using "weakest link" approach
2. **Strategic Goal Setting** - Human-in-the-loop strategic planning
3. **Gap Analysis** - Identification of improvement areas and pathways
4. **Multi-Agent Analyst Creation** - Deployment of specialized AI expert personas
5. **Parallel Expert Analysis** - Independent diagnosis and recommendation generation
6. **Comprehensive Report Synthesis** - Integration of multi-perspective insights

### 2. Maturity Assessment Logic

**Conservative "Weakest Link" Approach**: Each of the 8 organizational categories is scored based on its lowest-performing question, ensuring that organizations cannot achieve higher maturity ratings by excelling in some areas while neglecting fundamental weaknesses.

**5-Tier Maturity Scale**: 
- **A** (Lowest) - Minimal or no implementation
- **B** - Basic implementation with significant gaps
- **C** - Intermediate implementation with some gaps
- **D** - Advanced implementation with minor gaps  
- **E** (Highest) - Comprehensive, optimized implementation

### 3. Multi-Agent Expert Analysis System

The system deploys **5 specialized AI analyst personas**, each with distinct expertise areas, competencies, and analytical perspectives:

**Analyst Specializations:**
- **Sarah Brown** (Data Governance) - KM Processes, Techniques, Software Systems
- **David Miller** (Change Management) - Roles, Training, Workflow Integration
- **Patricia Alvarez** (Process Optimization) - Activities, Decision-Making, Methods
- **Kevin Johnson** (Decision Science) - Strategic Decision-Making, Methods, KM Processes
- **Emily Garcia** (Technical Implementation) - Software Systems, KM Techniques, Activities

**Key Methodological Features:**
- **Domain-Specific Filtering**: Each analyst only analyzes questions within their expertise
- **Parallel Independent Analysis**: Prevents groupthink through isolated analysis
- **Overlapping Coverage**: Strategic overlap ensures comprehensive evaluation
- **Persona-Constrained Reasoning**: AI responses filtered through realistic expert perspectives

### 4. Strategic Gap Analysis and Pathway Generation

**FROM-VIA-TO Methodology**: For each identified gap, the system generates detailed improvement pathways:
- **FROM State**: Current organizational capability level with specific descriptions
- **VIA States**: Intermediate progression steps with actionable milestones
- **TO State**: Target capability level aligned with strategic goals

**Question-Level Granularity**: Rather than broad category recommendations, the system provides specific, question-level improvement guidance that maps directly to organizational practices.

### 5. Two-Phase Expert Analysis Process

**Phase 1 - Diagnosis**: 
- Analysts perform needs analysis without solution bias
- Focus on gap identification and current state assessment
- Extract information relevant only to their domain expertise

**Phase 2 - Recommendations**:
- Generate constructive, specific, and manageable recommendations
- Include cost-benefit analysis for proposed improvements
- Maintain clear current→target state progression
- Provide realistic implementation pathways

### 6. Human-AI Collaborative Decision Making

**Strategic Control**: Human stakeholders maintain control over strategic goal setting while AI provides analytical depth and implementation guidance.

**Adaptive Input Methods**: System accommodates different interaction modes (interactive terminal, web interface, automated) while preserving decision authority with humans.

**Validation and Oversight**: Human strategic goals are validated and integrated with AI analysis to ensure recommendations align with organizational objectives.

## Project Structure

```
CLIMB2/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/            # API routes (9 endpoints)
│   │   │   ├── page.tsx        # Main questionnaire interface
│   │   │   ├── report/         # Report viewing page
│   │   │   └── status/         # Analysis status monitoring
│   │   ├── components/         # React components
│   │   └── types/              # TypeScript definitions
│   └── package.json            # Dependencies (Next.js 15, React 19, TailwindCSS)
│
├── backend/                     # Python backend
│   ├── config/                 # Configuration files
│   │   ├── agents.json         # AI analyst definitions
│   │   └── prompts.json        # System prompts
│   ├── data/                   # Data storage
│   │   ├── CLIMB2.json         # Complete questionnaire structure
│   │   ├── answer_1.json       # User responses
│   │   └── sample_answer.json  # Demo data
│   ├── graph/                  # LangGraph workflow
│   │   ├── graph.py           # Main workflow orchestration
│   │   ├── state.py           # State management
│   │   ├── status_manager.py  # Status tracking
│   │   └── nodes/             # Individual workflow nodes
│   ├── reports/               # Generated assessment reports
│   ├── main.py               # Application entry point
│   └── requirements.txt      # Python dependencies
```

## Organizational Assessment Dimensions

The framework evaluates organizational AI readiness across eight critical dimensions, each containing multiple detailed questions that map to specific organizational practices:

### Core Assessment Categories:

1. **Roles and Collaboration** - Cross-functional team integration, stakeholder engagement, and organizational structure for AI initiatives
2. **Training** - Skill development programs, knowledge transfer mechanisms, and continuous learning frameworks
3. **Activities and Flow** - Process documentation, workflow optimization, and operational efficiency measures
4. **Decision-Making** - Lifecycle considerations, strategic factors, and systematic decision frameworks
5. **KM Processes** - Knowledge management systems, organizational learning, and information governance
6. **KM Techniques** - Knowledge sharing methodologies, collaboration tools, and information dissemination
7. **Methods** - Design methodologies, analytical frameworks, and systematic approaches to problem-solving
8. **Computerization and Software** - Technology infrastructure, digital tools, and system integration capabilities

### Expert Analyst Mapping:

Each assessment dimension is analyzed by relevant AI specialist personas with overlapping coverage to ensure comprehensive evaluation:

- **Data & Knowledge Management** (Sarah Brown) → KM Processes, KM Techniques, Computerization & Software
- **Organizational Change** (David Miller) → Roles & Collaboration, Training, Activities & Flow  
- **Process Optimization** (Patricia Alvarez) → Activities & Flow, Decision-Making, Methods
- **Strategic Decision Science** (Kevin Johnson) → Decision-Making, Methods, KM Processes
- **Technical Implementation** (Emily Garcia) → Computerization & Software, KM Techniques, Activities & Flow

## Research Contributions

### Novel Methodological Contributions:

1. **Multi-Agent AI Analysis**: First implementation of parallel, domain-specialized AI analysts for organizational assessment
2. **Conservative Maturity Scoring**: "Weakest link" approach prevents inflated capability assessments
3. **Human-AI Collaboration Model**: Maintains human strategic control while leveraging AI analytical depth
4. **FROM-VIA-TO Pathway Generation**: Systematic approach to improvement roadmap development
5. **Question-Level Granularity**: Provides actionable guidance at the specific practice level rather than broad categories

### Validation Mechanisms:

- **Multi-Perspective Analysis**: Overlapping analyst assignments for cross-validation
- **Structured Prompting**: Carefully crafted prompts prevent hallucination and maintain analytical focus
- **Transparent Reasoning**: Full analyst personas and reasoning preserved for audit and verification
- **Conservative Assessment**: Prevents overconfident maturity ratings through systematic underestimation approach

## Usage Workflow

### Research Demonstration Process:

1. **Questionnaire Completion** - 200+ questions across 8 assessment dimensions
2. **Analysis Initiation** - Trigger AI-powered multi-agent evaluation 
3. **Strategic Goal Setting** - Human stakeholder input on target maturity levels
4. **Multi-Agent Analysis** - Parallel expert evaluation and recommendation generation
5. **Report Generation** - Comprehensive assessment with improvement roadmaps

### Generated Reports Include:

- **Executive Summary** with key findings and strategic recommendations
- **Detailed Gap Analysis** comparing current vs. target states across all dimensions
- **Expert Analyst Sections** with specialized insights from each AI persona
- **Implementation Roadmap** with FROM-VIA-TO improvement pathways
- **Cost-Benefit Analysis** for recommended improvements
- **Question-Level Guidance** mapping specific practices to improvement opportunities

## Research Applications

This implementation serves as a proof-of-concept for:

- **Organizational AI Readiness Assessment** - Systematic evaluation of AI adoption capabilities
- **Multi-Agent AI Consulting Systems** - Using specialized AI personas for domain expertise
- **Human-AI Collaborative Planning** - Maintaining human strategic control with AI analytical support
- **Conservative Maturity Assessment** - Preventing overconfident organizational capability ratings
- **Structured Improvement Planning** - FROM-VIA-TO pathway generation for systematic organizational development

---

# Technical Implementation

## System Architecture

### Frontend (Next.js + TypeScript)
- **Interactive Questionnaire**: Multi-category assessment with progress tracking
- **Real-time Status Monitoring**: Live updates on analysis progress
- **Report Visualization**: Markdown-based report rendering
- **Strategic Goal Setting**: Interactive maturity level targeting

### Backend (Python + LangGraph)
- **AI Agent Orchestration**: LangGraph-based workflow with multiple specialist agents
- **Multi-Agent Analysis**: 5 expert analyst personas analyzing different aspects
- **Human-in-the-Loop**: Strategic goal collection during analysis
- **Report Generation**: Comprehensive markdown reports with implementation roadmaps

## Installation and Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- OpenAI API key

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env file and add your OpenAI API key
```

⚠️ **Security Note**: Never commit `.env` files containing API keys to git. The `.env.example` template is provided for configuration reference.

### Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Development Mode
```bash
# Terminal 1: Start backend (if running standalone)
cd backend
source .venv/bin/activate
python main.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Production Mode
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend runs as spawned process from frontend API
```

## Usage Workflow

1. **Access Application**: Navigate to `http://localhost:3000`
2. **Complete Assessment**: Answer questions across all 8 categories
3. **Start Analysis**: Click "Analyze" to begin AI evaluation
4. **Set Strategic Goals**: Input target maturity levels during analysis
5. **Monitor Progress**: Track analysis status in real-time
6. **Review Results**: Access detailed reports with recommendations

## Key Features

- **Comprehensive Assessment**: 200+ questions across 8 maturity dimensions
- **AI-Powered Analysis**: Multi-agent evaluation with specialized expertise
- **Interactive Strategic Planning**: Real-time goal setting during analysis
- **Detailed Reporting**: Implementation roadmaps with cost-benefit analysis
- **Progress Tracking**: Real-time status monitoring with human-in-the-loop integration
- **Sample Data**: Demonstration mode with pre-filled responses

## Technology Stack

**Frontend:**
- Next.js 15.2.4
- React 19
- TypeScript 5
- TailwindCSS 4
- React Markdown

**Backend:**
- Python 3.9+
- LangGraph (workflow orchestration)
- LangChain (AI integration)
- OpenAI GPT models
- Pydantic (data validation)
- FPDF (report generation)

## File-Based Communication

The system uses file-based inter-process communication:
- **Status Updates**: `status.json` for real-time progress
- **User Input**: `user_input.txt`, `user_input_all.json` for strategic goals
- **Process Control**: Signal files and PID tracking
- **Data Persistence**: JSON format for questionnaire responses and configurations

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API authentication
- `MODEL`: AI model selection (default: gpt-4)
- `NON_INTERACTIVE`: Automated mode flag
- `GENERATE_DIAGRAM`: Workflow visualization toggle

### Customization
- **Analyst Personas**: Modify `backend/config/agents.json`
- **System Prompts**: Edit `backend/config/prompts.json`
- **Questionnaire**: Update `backend/data/CLIMB2.json`
- **Maturity Levels**: Configure assessment scales

## Reports and Output

Generated reports include:
- **Executive Summary**: High-level findings and recommendations
- **Gap Analysis**: Current vs. target maturity assessment
- **Implementation Roadmap**: Prioritized action items with timelines
- **Cost-Benefit Analysis**: Investment recommendations and ROI projections
- **Technical Recommendations**: Specific technology and process improvements

## Troubleshooting

### Common Issues
- **Analysis Stuck**: Check `backend/status.json` and restart if necessary
- **API Errors**: Verify OpenAI API key and model availability
- **Process Issues**: Ensure Python virtual environment is activated
- **Port Conflicts**: Default ports are 3000 (frontend) and backend runs as spawned process

### Logs and Debugging
- Frontend: Browser developer console
- Backend: Process output and error logs
- Status: Real-time monitoring via `/api/check-analysis-status`

## Contributing

The codebase follows these conventions:
- **Frontend**: TypeScript with strict typing, TailwindCSS for styling
- **Backend**: Python with Pydantic models, LangGraph for workflow orchestration
- **Documentation**: Comprehensive docstrings and type annotations
- **Error Handling**: Graceful degradation with user-friendly error messages

## Citation

If you use this framework in your research, please cite:

```
[Paper citation to be added upon publication]
```

## License

This project is part of academic research on AI-enhanced organizational assessment methodologies. The code is provided for research and educational purposes.