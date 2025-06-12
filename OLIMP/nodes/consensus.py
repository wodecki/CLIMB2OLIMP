import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from state import DocumentState

# Load environment variables
load_dotenv()

def extract_score_from_feedback(feedback: str) -> int:
    """Extract score from evaluation feedback"""
    if not feedback:
        return 0
    
    score_patterns = [
        r'łączny wynik.*?(\d+)/100',
        r'wynik.*?(\d+)/100', 
        r'punktów.*?(\d+)/100',
        r'(\d+)/100\s*punktów'
    ]
    
    for pattern in score_patterns:
        match = re.search(pattern, feedback.lower())
        if match:
            return int(match.group(1))
    
    return 0  # Default score if not found

def consensus(state: DocumentState) -> DocumentState:
    """
    Generate consensus recommendation from all branches using OpenAI
    
    Args:
        state: Current document state with completed branch recommendations
        
    Returns:
        Updated state with consensus recommendation
    """
    print("Generating consensus recommendation from all branches...")
    
    # Check which branches have completed recommendations
    available_branches = []
    branch_data = {}
    
    for branch_suffix, provider in [("A", "openai"), ("B", "anthropic"), ("C", "gemini")]:
        branch_key = f"branch_{branch_suffix}"
        branch_info = state.get("branch_data", {}).get(branch_key, {})
        
        if branch_info.get("recommendations") and (branch_info.get("recommendation_approved") or branch_info.get("evaluation_iterations", 0) >= 3):
            available_branches.append(branch_suffix)
            
            # Extract score from evaluation feedback
            score = extract_score_from_feedback(branch_info.get("evaluation_feedback", ""))
            
            branch_data[branch_suffix] = {
                "provider": provider,
                "recommendation": branch_info["recommendations"],
                "score": score,
                "iterations": branch_info.get("evaluation_iterations", 0),
                "approved": branch_info.get("recommendation_approved", False),
                "evaluation_feedback": branch_info.get("evaluation_feedback", "")
            }
    
    print(f"Available branches for consensus: {available_branches}")
    
    if len(available_branches) < 2:
        print(f"Warning: Only {len(available_branches)} branch(es) available. Proceeding with available data.")
        if len(available_branches) == 0:
            print("Error: No completed branches found for consensus")
            return state
    
    try:
        # Initialize Gemini Pro 2.5 for consensus
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        google_api_key = os.getenv("GOOGLE_API_KEY")
        print(f"Google API key available: {bool(google_api_key)}")
        if google_api_key:
            print(f"API key length: {len(google_api_key)}")
        
        consensus_llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro-preview-05-06",
            temperature=0.1,  # Low temperature for consistent synthesis
            max_tokens=None,  # Let Gemini use its full capacity
            google_api_key=google_api_key
        )
        
        print("Initialized consensus model: Gemini Pro 2.5 (extended output)")
        
        # Prepare consensus prompt
        gaps_json = json.dumps(state.get('gaps', {}), ensure_ascii=False, indent=2)
        
        consensus_prompt = f"""Create a comprehensive AI transformation report, synthesizing the best elements from three analyses (OpenAI, Anthropic, Gemini). 

TASK: Build a detailed, narrative strategic report (minimum 10,000 words) that:
1. Synthesizes the best insights from all analyses
2. Eliminates weaknesses of individual reports  
3. Contains practical, actionable recommendations
4. Has the character of a professional strategic document

IMPORTANT: Generate a FULL, LONG report - do not shorten, do not interrupt, continue to the end of all sections.

## INPUT DATA

### GAP ANALYSIS (COMMON SOURCE OF TRUTH):
{gaps_json}

### INDEPENDENT AI ANALYSES (FOR SYNTHESIS):
"""

        # Add each branch's data to the prompt
        for branch_suffix in available_branches:
            data = branch_data[branch_suffix]
            status_text = 'APPROVED' if data['approved'] else 'FINAL (3 iterations)'
            
            consensus_prompt += f"""

**BRANCH {branch_suffix}: {data['provider'].upper()}**
- Assessment Score: {data['score']}/100
- Iterations: {data['iterations']}/3
- Status: {status_text}

RECOMMENDATIONS:
{data['recommendation']}

---
"""

        consensus_prompt += """

## SYNTHESIS METHODOLOGY AND QUALITY REQUIREMENTS

### 1. COMPARATIVE SOURCE ANALYSIS
- **Identify the strongest elements of each analysis**: Which report has the best structure? Most detailed budgets? Most realistic timelines?
- **Find common threads and confirmations**: Elements repeated across all analyses have high credibility
- **Identify unique valuable insights**: Each model can bring unique perspectives that will enrich the final report
- **Assess recommendation quality**: Prioritize concrete, actionable actions over general concepts

### 2. REPORT CONSTRUCTION REQUIREMENTS

**LENGTH AND DEPTH:**
- Target 3500-4000 words
- Each section should be developed narratively, not just in bullet points
- Add business context, justifications and practical examples
- Include detailed implementation scenarios

**NARRATIVE STRUCTURE:**
1. **Executive Summary**
   - Full strategic context of the organization
   - Detailed diagnosis of current state with justifications
   - Key challenges with practical examples
   - Target vision with concrete business benefits
   - Transformation roadmap with key milestones

2. **Analysis by OLIMP Areas**
   - **Technology and Infrastructure**: 
     * Detailed assessment of each technological component
     * Concrete technical recommendations with vendors and costs
     * Step-by-step migration scenarios
     * Technical risk analysis and mitigation methods
   - **People and Competencies**:
     * Deep analysis of current competencies and gaps
     * Detailed training programs with curriculum and schedule
     * AI talent recruitment and retention strategies
     * Plan for building AI-supportive organizational culture
   - **Organization and Processes**:
     * Detailed map of processes for transformation
     * AI project management methodologies with practical frameworks
     * Governance and compliance (GDPR, AI Act) with concrete procedures
     * Change management and internal communication

3. **Implementation Plan**
   - Detailed 3-phase schedule with milestones
   - Concrete dates, budgets and responsibilities
   - Analysis of dependencies between projects
   - Risk management strategies and contingency planning
   - Quick wins and long-term strategic investments

4. **Resources, Budget and Governance** 
   - Detailed cost breakdown with justifications
   - Financing strategies and ROI analysis
   - Transformation team organization
   - KPIs and progress monitoring system
   - Reporting and review procedures

5. **Business Benefits and Cultural Transformation** 
   - Concrete use cases with ROI estimates
   - Competitive advantage and market positioning
   - Impact on employee satisfaction and employer branding
   - Long-term vision of AI-driven organization

### 3. STYLISTIC GUIDELINES

**LANGUAGE AND TONE:**
- Professional but accessible business language
- Narrative style with logical flow of arguments
- Concrete examples and case studies where possible
- Balance between vision and practicality

**VISUAL ELEMENTS (in markdown):**
- Comparison tables for key metrics
- Checklists for practical actions
- Highlights and callouts for key insights
- Logical hierarchy of headings and subsections

**CONCRETENESS AND ACTIONABILITY:**
- Provide specific names of technologies, vendors, tools
- Set realistic budgets with ranges (from-to)
- Set measurable goals and deadlines
- Indicate people/roles responsible for specific areas

## FINAL TASK

Create a **COMPREHENSIVE AI TRANSFORMATION REPORT** that:
- Constitutes a synthesis of the best elements from all three analyses
- Is significantly more detailed and narrative than previous reports
- Contains practical, actionable recommendations with concrete details
- Serves as a complete strategic guide for the organization
- Has the structure of a professional consulting document

The report should be detailed and practical enough that the organization can use it as the main document guiding the entire AI transformation.

IMPORTANT: 
- Report must be written in ENGLISH language
- Generate a comprehensive report with minimum 10,000 words
- Do not shorten or interrupt - continue to the end of all sections
- Do not add placeholders regarding company name or refer to specific company names
- Focus on substantive content without metadata, timestamps, or model details in the report header
"""

        print("Generating consensus recommendation...")
        
        # Create message for consensus
        message = HumanMessage(content=consensus_prompt)
        
        # Generate consensus recommendation
        response = consensus_llm.invoke([message])
        
        print(f"Response received: {bool(response.content)}")
        if response.content:
            print(f"Response length: {len(response.content)} characters")
            print(f"Response preview: {response.content[:200]}...")
        
        if not response.content:
            print("Error: No response from consensus model")
            return state
            
        # Clean the response
        consensus_recommendation = response.content.strip()
        if consensus_recommendation.startswith('```markdown'):
            consensus_recommendation = consensus_recommendation[11:]
        if consensus_recommendation.startswith('```'):
            consensus_recommendation = consensus_recommendation[3:]
        if consensus_recommendation.endswith('```'):
            consensus_recommendation = consensus_recommendation[:-3]
        consensus_recommendation = consensus_recommendation.strip()
        
        # Store consensus recommendation in state
        state["consensus_recommendation"] = consensus_recommendation
        
        # Also store in legacy field for backward compatibility
        state["recommendations"] = consensus_recommendation
        
        # Save consensus report to file (primary location)
        consensus_filename = "A_recommendations_CONSENSUS_FINAL.md"
        reports_dir = "./data/reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        consensus_path = f"{reports_dir}/{consensus_filename}"
        try:
            with open(consensus_path, "w", encoding="utf-8") as f:
                f.write(f"# FINAL CONSENSUS RECOMMENDATION REPORT\\n\\n")
                f.write(f"**Generated from**: {len(available_branches)} AI analysis branches\\n")
                branch_info = ', '.join(f'{b} ({branch_data[b]["provider"].upper()}: {branch_data[b]["score"]}/100)' for b in available_branches)
                f.write(f"**Branches**: {branch_info}\\n")
                f.write(f"**Consensus Model**: gemini-2.5-pro-preview-05-06\\n")
                f.write(f"**Timestamp**: {Path().absolute()}\\n\\n")
                f.write("---\\n\\n")
                f.write(consensus_recommendation)
            print(f"✅ FINAL consensus recommendation saved to {consensus_path}")
        except Exception as e:
            print(f"Error saving consensus recommendation: {e}")
        
        # Also save to main recommendation file for backward compatibility
        main_filename = "A_recommendations.md"
        main_path = f"{reports_dir}/{main_filename}"
        try:
            with open(main_path, "w", encoding="utf-8") as f:
                f.write(consensus_recommendation)
            print(f"✅ Final recommendation also saved to {main_path}")
        except Exception as e:
            print(f"Warning: Could not save to main recommendation file: {e}")
        
        # Create summary file with branch comparison
        summary_filename = "A_consensus_summary.md"
        interim_reports_dir = "./data/reports/interim_reports"
        os.makedirs(interim_reports_dir, exist_ok=True)
        summary_path = f"{interim_reports_dir}/{summary_filename}"
        try:
            with open(summary_path, "w", encoding="utf-8") as f:
                f.write(f"# Consensus Generation Summary\\n\\n")
                f.write(f"## Branch Performance Overview\\n\\n")
                
                for branch_suffix in available_branches:
                    data = branch_data[branch_suffix]
                    f.write(f"### Branch {branch_suffix}: {data['provider'].upper()}\\n")
                    f.write(f"- **Score**: {data['score']}/100\\n")
                    f.write(f"- **Iterations**: {data['iterations']}/3\\n")
                    f.write(f"- **Status**: {'✅ Approved' if data['approved'] else '📋 Final (3 iterations)'}\\n")
                    f.write(f"- **File**: A_recommendations_branch_{branch_suffix}_{data['provider']}.md\\n\\n")
                
                f.write(f"## Consensus Details\\n\\n")
                f.write(f"- **Total branches processed**: {len(available_branches)}\\n")
                f.write(f"- **Consensus model**: gemini-2.5-pro-preview-05-06\\n")
                f.write(f"- **Final report**: {consensus_filename}\\n")
                
            print(f"Consensus summary saved to {summary_path}")
        except Exception as e:
            print(f"Warning: Could not save consensus summary: {e}")
        
        print("🎉 Consensus recommendation generated successfully!")
        print(f"📊 Synthesized from {len(available_branches)} branch recommendations")
        print(f"📁 Final report: {consensus_path}")
        
        return state
        
    except Exception as e:
        print(f"Error generating consensus recommendation: {e}")
        # Fallback: use the highest-scoring recommendation if consensus fails
        if available_branches:
            best_branch = max(available_branches, key=lambda x: branch_data[x]["score"])
            print(f"Fallback: Using best branch {best_branch} recommendation")
            state["consensus_recommendation"] = branch_data[best_branch]["recommendation"]
            state["recommendations"] = branch_data[best_branch]["recommendation"]
        return state