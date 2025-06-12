#!/usr/bin/env node

/**
 * Debug script to compare environment differences
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function debugEnvironment() {
    console.log('Environment Debugging');
    console.log('=' * 30);
    
    const olimpPath = path.join(__dirname, '..', 'OLIMP');
    
    // Test 1: Check UV availability
    console.log('\n1. Testing UV availability...');
    try {
        const uvCheck = spawn('uv', ['--version'], { stdio: 'pipe' });
        uvCheck.stdout.on('data', (data) => {
            console.log(`✅ UV version: ${data.toString().trim()}`);
        });
        await new Promise((resolve) => uvCheck.on('close', resolve));
    } catch (error) {
        console.log('❌ UV not available:', error.message);
    }
    
    // Test 2: Test environment loading
    console.log('\n2. Testing environment loading...');
    const olimpEnvPath = path.join(olimpPath, '.env');
    if (fs.existsSync(olimpEnvPath)) {
        const envContent = fs.readFileSync(olimpEnvPath, 'utf-8');
        const envVars = {};
        for (const line of envContent.split('\n')) {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        }
        console.log('Environment variables loaded:');
        Object.keys(envVars).forEach(key => {
            console.log(`  ${key}: ${envVars[key].substring(0, 10)}...`);
        });
    }
    
    // Test 3: Simple UV run test
    console.log('\n3. Testing simple UV command...');
    const simpleTest = spawn('uv', ['run', 'python', '-c', 'print("UV works!")'], {
        cwd: olimpPath,
        stdio: 'pipe'
    });
    
    simpleTest.stdout.on('data', (data) => {
        console.log(`✅ UV run test: ${data.toString().trim()}`);
    });
    
    simpleTest.stderr.on('data', (data) => {
        console.log(`❌ UV run error: ${data.toString().trim()}`);
    });
    
    await new Promise((resolve) => simpleTest.on('close', resolve));
    
    // Test 4: Check if the issue is with LangGraph parallel execution
    console.log('\n4. Testing Python imports...');
    const importTest = spawn('uv', ['run', 'python', '-c', `
import sys
print("Python version:", sys.version)
try:
    from langchain_openai import ChatOpenAI
    print("✅ LangChain OpenAI import successful")
except Exception as e:
    print("❌ LangChain OpenAI import failed:", e)

try:
    from langchain_anthropic import ChatAnthropic
    print("✅ LangChain Anthropic import successful")
except Exception as e:
    print("❌ LangChain Anthropic import failed:", e)

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("✅ LangChain Google import successful")
except Exception as e:
    print("❌ LangChain Google import failed:", e)

try:
    from langgraph.graph import StateGraph
    print("✅ LangGraph import successful")
except Exception as e:
    print("❌ LangGraph import failed:", e)
`], {
        cwd: olimpPath,
        stdio: 'pipe'
    });
    
    importTest.stdout.on('data', (data) => {
        console.log(data.toString().trim());
    });
    
    importTest.stderr.on('data', (data) => {
        console.log(`Import error: ${data.toString().trim()}`);
    });
    
    await new Promise((resolve) => importTest.on('close', resolve));
    
    console.log('\n5. Current working directory comparison:');
    console.log(`Frontend dir: ${__dirname}`);
    console.log(`OLIMP dir: ${olimpPath}`);
    console.log(`OLIMP exists: ${fs.existsSync(olimpPath)}`);
}

debugEnvironment().catch(console.error);