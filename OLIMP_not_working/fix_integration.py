#!/usr/bin/env python3

import json
import os

print("Fixing A.json integration...")

try:
    # Load A_1.json (CLIMB_2 data)
    with open("./data/process/A_1.json", "r", encoding="utf-8") as f:
        climb2_data = json.load(f)
    print("✓ Loaded A_1.json (CLIMB_2)")
    
    # Load A_2.json (OLIMP data)
    with open("./data/process/A_2.json", "r", encoding="utf-8") as f:
        olimp_data = json.load(f)
    print("✓ Loaded A_2.json (OLIMP)")
    
    # Create integrated structure
    integrated_data = {
        "CLIMB_2": climb2_data,
        "OLIMP": olimp_data
    }
    
    # Save integrated A.json
    with open("./data/process/A.json", "w", encoding="utf-8") as f:
        json.dump(integrated_data, f, ensure_ascii=False, indent=2)
    
    print("✓ Created integrated A.json")
    print("Integrated structure keys:", list(integrated_data.keys()))
    print("CLIMB_2 questionnaire:", integrated_data["CLIMB_2"].get("questionnaire"))
    print("OLIMP questionnaire:", integrated_data["OLIMP"].get("questionnaire"))
    
    # Verify the structure
    if "OLIMP" in integrated_data and "sections" in integrated_data["OLIMP"]:
        section_count = len(integrated_data["OLIMP"]["sections"])
        print(f"OLIMP has {section_count} sections")
        
        # Count potential gaps
        gap_count = 0
        for section in integrated_data["OLIMP"]["sections"]:
            for question in section.get("questions", []):
                if question.get("selected_answer") in ['A', 'B', 'C', 'D']:
                    gap_count += 1
        print(f"Found {gap_count} potential gaps in OLIMP data")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()