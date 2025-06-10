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
        
        consensus_prompt = f"""Stwórz kompleksowy raport transformacji AI, syntezując najlepsze elementy z trzech analiz (OpenAI, Anthropic, Gemini). 

ZADANIE: Zbuduj szczegółowy, narracyjny raport strategiczny (minimum 10000 słów) który:
1. Syntetyzuje najlepsze insights ze wszystkich analiz
2. Eliminuje słabości pojedynczych raportów  
3. Zawiera praktyczne, wykonalne rekomendacje
4. Ma charakter profesjonalnego dokumentu strategicznego

WAŻNE: Generuj PEŁNY, DŁUGI raport - nie skracaj, nie przerywaj, kontynuuj do końca wszystkich sekcji.

## DANE WEJŚCIOWE

### ANALIZA LUK (WSPÓLNE ŹRÓDŁO PRAWDY):
{gaps_json}

### NIEZALEŻNE ANALIZY AI (DO SYNTEZY):
"""

        # Add each branch's data to the prompt
        for branch_suffix in available_branches:
            data = branch_data[branch_suffix]
            status_text = 'ZATWIERDZONY' if data['approved'] else 'FINAL (3 iteracje)'
            
            consensus_prompt += f"""

**BRANCH {branch_suffix}: {data['provider'].upper()}**
- Wynik oceny: {data['score']}/100
- Iteracje: {data['iterations']}/3
- Status: {status_text}

REKOMENDACJE:
{data['recommendation']}

---
"""

        consensus_prompt += """

## METODOLOGIA SYNTEZY I WYMAGANIA JAKOŚCIOWE

### 1. ANALIZA PORÓWNAWCZA ŹRÓDEŁ
- **Identyfikuj najmocniejsze elementy każdej analizy**: Który raport ma najlepszą strukturę? Najbardziej szczegółowe budżety? Najrealistyczniejsze timeline'y?
- **Znajdź wspólne wątki i potwierdzenia**: Elementy powtarzające się we wszystkich analizach mają wysoką wiarygodność
- **Zidentyfikuj unikalne wartościowe insights**: Każdy model może wnieść unikalne perspektywy, które wzbogacą final raport
- **Oceń jakość rekomendacji**: Priorytetyzuj konkretne, wykonalne działania nad ogólnymi koncepcjami

### 2. WYMAGANIA KONSTRUKCYJNE RAPORTU

**DŁUGOŚĆ I GŁĘBOKOŚĆ:**
- Docelowo 3500-4000 słów
- Każda sekcja powinna być rozwijana narracyjnie, nie tylko punktowo
- Dodaj kontekst biznesowy, uzasadnienia i przykłady praktyczne
- Włącz szczegółowe scenariusze implementacyjne

**STRUKTURA NARRACYJNA:**
1. **Streszczenie wykonawcze**
   - Pełny kontekst strategiczny organizacji
   - Szczegółowa diagnoza obecnego stanu z uzasadnieniami
   - Kluczowe wyzwania z praktycznymi przykładami
   - Wizja docelowa z konkretnymi korzyściami biznesowymi
   - Roadmapa transformacji z kluczowymi milestone'ami

2. **Analiza według obszarów OLIMP**
   - **Technologia i Infrastruktura**: 
     * Szczegółowa ocena każdego komponentu technologicznego
     * Konkretne rekomendacje techniczne z dostawcami i kosztami
     * Scenariusze migracji krok po kroku
     * Analiza ryzyk technicznych i sposoby mitygacji
   - **Ludzie i Kompetencje**:
     * Głęboka analiza obecnych kompetencji i luk
     * Szczegółowe programy szkoleń z curriculum i harmonogramem
     * Strategie rekrutacji i retencji talentów AI
     * Plan budowy kultury organizacyjnej wspierającej AI
   - **Organizacja i Procesy**:
     * Dokładna mapa procesów do transformacji
     * Metodyki zarządzania projektami AI z praktycznymi frameworkami
     * Governance i compliance (GDPR, AI Act) z konkretnymi procedurami
     * Change management i komunikacja wewnętrzna

3. **Plan implementacji**
   - Szczegółowy harmonogram 3-fazowy z milestone'ami
   - Konkretnymi datami, budżetami i odpowiedzialnościami
   - Analiza zależności między projektami
   - Strategie zarządzania ryzykiem i planowanie awaryjne
   - Quick wins i długoterminowe inwestycje strategiczne

4. **Zasoby, budżet i governance** 
   - Szczegółowy breakdown kosztów z uzasadnieniami
   - Strategie finansowania i ROI analysis
   - Organizacja zespołu transformacyjnego
   - KPI i system monitoringu postępów
   - Procedury raportowania i review

5. **Korzyści biznesowe i transformacja kulturowa** 
   - Konkretne przypadki użycia (use cases) z szacunkami ROI
   - Przewaga konkurencyjna i positioning rynkowy
   - Wpływ na satysfakcję pracowników i employer branding
   - Długoterminowa wizja organizacji napędzanej AI

### 3. WYTYCZNE STYLISTYCZNE

**JĘZYK I TON:**
- Profesjonalny, ale przystępny język biznesowy
- Narracyjny styl z logicznym przepływem argumentacji
- Konkretne przykłady i case studies tam, gdzie to możliwe
- Balans między wizjonerskością a praktycznością

**ELEMENTY WIZUALNE (w markdown):**
- Tabele porównawcze dla kluczowych metryk
- Listy kontrolne (checklists) dla działań praktycznych
- Wyróżnienia i callouts dla kluczowych insights
- Logiczna hierarchia nagłówków i podsekcji

**KONKRETNOŚĆ I WYKONALNOŚĆ:**
- Podaj konkretne nazwy technologii, dostawców, narzędzi
- Określ realistyczne budżety z zakresami (od-do)
- Ustaw mierzalne cele i terminy
- Wskaż osoby/role odpowiedzialne za poszczególne obszary

## ZADANIE FINALNE

Stwórz **KOMPLEKSOWY RAPORT TRANSFORMACJI AI**, który:
- Stanowi syntezę najlepszych elementów z wszystkich trzech analiz
- Jest znacznie bardziej szczegółowy i narracyjny niż dotychczasowe raporty
- Zawiera praktyczne, wykonalne rekomendacje z konkretnymi szczegółami
- Służy jako kompletny przewodnik strategiczny dla organizacji
- Ma strukturę profesjonalnego dokumentu konsultingowego

Raport powinien być na tyle szczegółowy i praktyczny, że organizacja może go użyć jako głównego dokumentu sterującego całą transformacją AI.

 Wazne: raport powinien mieć minimum 10000 słów. Generuj PEŁNY, DŁUGI raport - nie skracaj, nie przerywaj, kontynuuj do końca wszystkich sekcji.
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