#!/usr/bin/env node

/**
 * Test script to verify OLIMP integration fixes
 * Tests the same integration path as frontend API
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testOlimpIntegration() {
    console.log('Testing OLIMP Integration with Frontend Fixes');
    console.log('=' * 50);
    
    const olimpPath = path.join(__dirname, '..', 'OLIMP');
    
    console.log(`OLIMP directory: ${olimpPath}`);
    
    // Check if required files exist
    const requiredFiles = [
        path.join(olimpPath, 'main.py'),
        path.join(olimpPath, 'pyproject.toml'),
        path.join(olimpPath, '.env'),
        path.join(olimpPath, 'data', 'process', 'A.json')
    ];
    
    for (const filePath of requiredFiles) {
        if (fs.existsSync(filePath)) {
            console.log(`✅ Found: ${path.basename(filePath)}`);
        } else {
            console.log(`❌ Missing: ${filePath}`);
            return false;
        }
    }
    
    // Load OLIMP environment variables (same as fixed frontend code)
    const olimpEnvPath = path.join(olimpPath, '.env');
    let olimpEnv = {};
    if (fs.existsSync(olimpEnvPath)) {
        const envContent = fs.readFileSync(olimpEnvPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const [key, value] = line.split('=');
            if (key && value) {
                olimpEnv[key.trim()] = value.trim();
            }
        }
        console.log('✅ Loaded OLIMP .env file with API keys');
        console.log(`✅ Found ${Object.keys(olimpEnv).length} environment variables`);
    }
    
    console.log('\nStarting OLIMP process with UV (same as fixed frontend)...');
    
    // Test the same command as the fixed frontend
    const pythonProcess = spawn('uv', ['run', 'main.py'], {
        cwd: olimpPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
            ...process.env,
            ...olimpEnv,
            NON_INTERACTIVE: 'true'
        }
    });
    
    console.log(`OLIMP process started with PID: ${pythonProcess.pid}`);
    
    // Monitor output
    let outputBuffer = '';
    let errorBuffer = '';
    
    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        console.log(`OLIMP: ${output.trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        errorBuffer += error;
        console.log(`OLIMP ERROR: ${error.trim()}`);
    });
    
    // Set timeout to detect hanging
    const timeout = setTimeout(() => {
        console.log('\n❌ TIMEOUT: Process took longer than 5 minutes');
        pythonProcess.kill('SIGTERM');
    }, 5 * 60 * 1000); // 5 minutes
    
    return new Promise((resolve) => {
        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            console.log(`\nOLIMP process exited with code: ${code}`);
            
            if (code === 0) {
                console.log('✅ OLIMP completed successfully!');
                console.log('✅ Frontend integration fix verified!');
                resolve(true);
            } else {
                console.log('❌ OLIMP failed, but no hanging detected');
                console.log('Last output:', outputBuffer.slice(-500));
                if (errorBuffer) {
                    console.log('Errors:', errorBuffer.slice(-500));
                }
                resolve(false);
            }
        });
        
        pythonProcess.on('error', (error) => {
            clearTimeout(timeout);
            console.error('❌ Process error:', error);
            resolve(false);
        });
    });
}

// Run the test
testOlimpIntegration().then((success) => {
    if (success) {
        console.log('\n✅ Integration test PASSED!');
        console.log('✅ Frontend should now work without hanging!');
    } else {
        console.log('\n❌ Integration test FAILED');
        console.log('❌ Further debugging needed');
    }
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.error('Test error:', error);
    process.exit(1);
});