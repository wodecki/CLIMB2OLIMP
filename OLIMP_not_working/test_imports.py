#!/usr/bin/env python3

print("Testing imports...")

print("1. Testing basic imports...")
import os
import sys
import traceback
print("✓ Basic imports OK")

print("2. Testing dotenv...")
from dotenv import load_dotenv
print("✓ dotenv OK")

print("3. Testing langgraph...")
from langgraph.graph import START, END, StateGraph
print("✓ langgraph OK")

print("4. Testing state module...")
try:
    from state import DocumentState
    print("✓ state module OK")
except Exception as e:
    print(f"❌ state module error: {e}")

print("5. Testing node imports...")
try:
    from nodes.extract_answers import extract_answers
    print("✓ extract_answers OK")
except Exception as e:
    print(f"❌ extract_answers error: {e}")

try:
    from nodes.identify_gaps import identify_gaps
    print("✓ identify_gaps OK")
except Exception as e:
    print(f"❌ identify_gaps error: {e}")

print("6. Testing graph import...")
try:
    from graph import app
    print("✓ graph import OK")
except Exception as e:
    print(f"❌ graph import error: {e}")

print("All import tests completed!")