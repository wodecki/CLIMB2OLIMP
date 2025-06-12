#!/usr/bin/env python3
"""
Quick test to verify OLIMP main execution works
"""

import os
import sys
import subprocess
from pathlib import Path

def run_olimp_test():
    """Run OLIMP main.py to test if it fails gracefully or hangs"""
    print("Testing OLIMP main.py execution...")
    
    # Set working directory to OLIMP
    olimp_dir = Path(__file__).parent
    os.chdir(olimp_dir)
    
    print(f"Working directory: {os.getcwd()}")
    print(f"Files in directory: {list(os.listdir('.'))[:10]}")
    
    # Run main.py with timeout to prevent hanging
    try:
        result = subprocess.run(
            [sys.executable, "main.py"],
            timeout=30,  # 30 second timeout
            capture_output=True,
            text=True,
            cwd=olimp_dir
        )
        
        print(f"Return code: {result.returncode}")
        print(f"STDOUT: {result.stdout[:500]}...")
        if result.stderr:
            print(f"STDERR: {result.stderr[:500]}...")
            
        if result.returncode == 0:
            print("✅ OLIMP completed successfully!")
        else:
            print("❌ OLIMP failed with error, but it didn't hang (this is progress!)")
            
    except subprocess.TimeoutExpired:
        print("❌ OLIMP process timed out - still hanging!")
        return False
    except Exception as e:
        print(f"❌ Error running OLIMP: {e}")
        return False
        
    return True

if __name__ == "__main__":
    print("OLIMP Main Execution Test")
    print("=" * 40)
    
    success = run_olimp_test()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Test completed - OLIMP no longer hangs!")
    else:
        print("❌ Test failed - OLIMP may still be hanging.")