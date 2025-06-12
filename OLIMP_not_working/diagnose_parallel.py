#!/usr/bin/env python3
"""
Diagnose parallel execution status
"""

import os
import glob

def diagnose_parallel_status():
    """Check the status of parallel execution"""
    print("🔍 PARALLEL EXECUTION DIAGNOSIS")
    print("=" * 50)
    
    reports_dir = "./data/reports"
    
    # Check for branch recommendations
    branch_files = glob.glob(f"{reports_dir}/A_recommendations_branch_*.md")
    print(f"\n📊 BRANCH RECOMMENDATIONS: {len(branch_files)}/3")
    for file in sorted(branch_files):
        filename = os.path.basename(file)
        size = os.path.getsize(file)
        print(f"  ✅ {filename} ({size:,} bytes)")
    
    # Check for evaluations
    eval_files = glob.glob(f"{reports_dir}/A_evaluation_branch_*.md")
    print(f"\n📋 EVALUATIONS: {len(eval_files)} files")
    for file in sorted(eval_files):
        filename = os.path.basename(file)
        size = os.path.getsize(file)
        print(f"  📝 {filename} ({size:,} bytes)")
    
    # Check for final versions
    final_files = glob.glob(f"{reports_dir}/A_recommendations_FINAL_branch_*.md")
    print(f"\n✅ FINAL BRANCH VERSIONS: {len(final_files)}/3")
    for file in sorted(final_files):
        filename = os.path.basename(file)
        size = os.path.getsize(file)
        print(f"  🎯 {filename} ({size:,} bytes)")
    
    # Check for consensus
    consensus_files = glob.glob(f"{reports_dir}/A_recommendations_CONSENSUS_*.md")
    main_file = f"{reports_dir}/A_recommendations.md"
    
    print(f"\n🎯 CONSENSUS & FINAL:")
    for file in consensus_files:
        filename = os.path.basename(file)
        size = os.path.getsize(file)
        print(f"  🏆 {filename} ({size:,} bytes)")
    
    if os.path.exists(main_file):
        size = os.path.getsize(main_file)
        print(f"  📄 A_recommendations.md ({size:,} bytes)")
    
    # Summary
    print(f"\n📈 PROGRESS SUMMARY:")
    print(f"  • Branch recommendations: {len(branch_files)}/3")
    print(f"  • Evaluations: {len(eval_files)}")
    print(f"  • Final branches: {len(final_files)}/3")
    print(f"  • Consensus reports: {len(consensus_files)}")
    
    if len(branch_files) == 3:
        print(f"  ✅ All branches generated recommendations")
    if len(final_files) == 3:
        print(f"  ✅ All branches completed evaluation")
    if len(consensus_files) > 0:
        print(f"  ✅ Consensus generated")
    
    print(f"\n🎯 PARALLEL EXECUTION STATUS: {'COMPLETE' if len(consensus_files) > 0 else 'IN PROGRESS'}")

if __name__ == "__main__":
    diagnose_parallel_status()