from typing import List, Annotated, Dict
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from operator import add

class Analyst(BaseModel):
    name: str = Field(
        description="Name of the analyst."
    )
    role: str = Field(
        description="Role of the analyst in the context of the topic.",
    )
    area: str = Field(
        description="Area of expertise of the analyst.",
    )
    focus: str = Field(
        description="Focus of the analyst's work.",
    )
    competencies: str = Field(
        description="Key competencies of the analyst.",
    )
    tasks: str = Field(
        description="Tasks the analyst performs in the project.",
    )
    motives: str = Field(
        description="Motives and concerns of the analyst.",
    )
    questions: List[str] = Field(
        description="List of questions the analyst is responsible for.",
    )
    description: str = Field(
        description="Full description of the analyst combining focus, competencies, tasks, and motives.",
    )
    @property
    def persona(self) -> str:
        return f"""Name: {self.name}
                Role: {self.role}
                Area: {self.area}
                Focus: {self.focus}
                Competencies: {self.competencies}
                Tasks: {self.tasks}
                Motives: {self.motives}
                Questions: {', '.join(self.questions)}
                Description: {self.description}
                """

class Perspectives(BaseModel):
    analysts: List[Analyst] = Field(
        description="Comprehensive list of analysts with their roles and description.",
    )

class GenerateAnalystsState(TypedDict):
    analysts: List[Analyst] # Analyst asking questions


class OverallState(TypedDict):
    maturity_levels: Dict[str, str]  # Maturity levels for each category
    strategic_goals: Dict[str, str]  # Strategic goals levels for each category
    areas_for_improvement: Dict[str, str]  # Areas for improvement levels for each category
    questions_for_improvement: Dict[str, str]  # Questions for improvement levels for each category
    questionnaire: str        # Questionnaire results
    analysts: List[Analyst]   # All analysts
    diagnosis: Annotated[list, add]          # Aggregated list of diagnosis objects from consulting branches
    recommendations: Annotated[list, add]    # Aggregated list of recommendation objects from consulting branches
    report: str               # Final report
    user_feedback: str       # User feedback
        
class ConsultingState(TypedDict):
    questionnaire_for_analyst: str  # Questionnaire results
    questions_for_improvement_for_analyst: str  # Questions to improve
    analyst: Analyst  # Current analyst (single instance)
    diagnosis: Annotated[list, add]  # Diagnosis
    recommendations: Annotated[list, add]  # Recommendations
