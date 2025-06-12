#!/usr/bin/env python3
"""
Test identify_gaps node in isolation
"""
import os
import json
import time
import signal

def timeout_handler(signum, frame):
    print(f"⏰ TIMEOUT in identify_gaps test")
    raise TimeoutError("identify_gaps test timeout")

def test_identify_gaps_isolated():
    """Test identify_gaps with minimal data"""
    print("="*60)
    print("IDENTIFY_GAPS ISOLATION TEST")
    print("="*60)
    
    # Set timeout
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(30)  # 30 second timeout
    
    try:
        # Load real data
        with open("./data/process/A.json", "r", encoding="utf-8") as f:
            real_data = json.load(f)
        
        print(f"Loaded A.json with keys: {list(real_data.keys())}")
        
        if "OLIMP" in real_data:
            olimp_data = real_data["OLIMP"]
            sections = olimp_data.get("sections", [])
            print(f"OLIMP sections: {len(sections)}")
            
            # Print first few section names
            for i, section in enumerate(sections[:3]):
                print(f"  Section {i+1}: {section.get('section_name', 'NO_NAME')}")
        
        # Create minimal state
        test_state = {
            "document_content": "test",
            "answers": real_data,
            "gaps": {},
            "branch_data": {},
            "consensus_recommendation": None,
            "recommendations": None,
            "evaluation_feedback": None,
            "evaluation_iterations": 0,
            "recommendation_approved": False
        }
        
        print("State created, importing identify_gaps...")
        from nodes.identify_gaps import identify_gaps
        
        print("Starting identify_gaps execution...")
        start_time = time.time()
        
        result = identify_gaps(test_state)
        
        end_time = time.time()
        signal.alarm(0)  # Cancel timeout
        
        print(f"✅ identify_gaps completed in {end_time - start_time:.2f} seconds")
        print(f"Gaps found: {len(result.get('gaps', {}))}")
        
        return result
        
    except TimeoutError:
        print("❌ identify_gaps timed out!")
        signal.alarm(0)
        return None
    except Exception as e:
        print(f"❌ Error in identify_gaps: {e}")
        signal.alarm(0)
        return None

def main():
    """Run isolated test"""
    result = test_identify_gaps_isolated()
    
    if result:
        print("\n✅ identify_gaps works in isolation")
    else:
        print("\n❌ identify_gaps failed in isolation")

if __name__ == "__main__":
    main()