import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    console.log('Starting OLIMP analysis...');
    
    // Path to the OLIMP directory
    const olimpPath = path.join(process.cwd(), '..', 'OLIMP');
    
    // Check if required source files exist
    const sourceFiles = [
      path.join(olimpPath, 'data', 'process', 'A_1.json'),  // CLIMB_2 data
      path.join(olimpPath, 'data', 'process', 'A_2.json'),  // OLIMP data  
      path.join(olimpPath, 'data', 'process', 'A_gaps.json') // Gap analysis
    ];
    
    for (const filePath of sourceFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required source file missing: ${path.basename(filePath)}`);
      }
    }
    
    console.log('All source files found. Creating integrated A.json...');
    
    // CRITICAL FIX: Merge A_1.json (CLIMB_2) and A_2.json (OLIMP) into A.json
    try {
      const a1JsonPath = path.join(olimpPath, 'data', 'process', 'A_1.json');
      const a2JsonPath = path.join(olimpPath, 'data', 'process', 'A_2.json');
      const aJsonPath = path.join(olimpPath, 'data', 'process', 'A.json');
      
      // Read CLIMB_2 data
      const climb2Data = JSON.parse(fs.readFileSync(a1JsonPath, 'utf-8'));
      console.log('Loaded CLIMB_2 data from A_1.json');
      
      // Read OLIMP data  
      const olimpData = JSON.parse(fs.readFileSync(a2JsonPath, 'utf-8'));
      console.log('Loaded OLIMP data from A_2.json');
      
      // Create integrated structure
      const integratedData = {
        CLIMB_2: climb2Data,
        OLIMP: olimpData
      };
      
      // Save integrated A.json
      fs.writeFileSync(aJsonPath, JSON.stringify(integratedData, null, 2));
      console.log('✅ Created integrated A.json with both CLIMB_2 and OLIMP data');
      console.log(`CLIMB_2 sections: ${climb2Data.sections?.length || 0}`);
      console.log(`OLIMP sections: ${olimpData.sections?.length || 0}`);
      
    } catch (error) {
      console.error('Error creating integrated A.json:', error);
      throw new Error(`Failed to merge data files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('All required files found. Starting OLIMP process...');
    
    // Clean up any previous analysis files and reports
    console.log('Cleaning up previous analysis files and reports...');
    
    const filesToClean = [
      path.join(olimpPath, 'analysis_pid.txt'),
      path.join(olimpPath, 'stop_analysis.txt'),
      path.join(olimpPath, 'analysis_complete.txt'),
      path.join(olimpPath, 'analysis_error.txt'),
      // Only clean up gaps file, not A.json since it's properly created by frontend
      path.join(olimpPath, 'data', 'process', 'A_gaps.json')
    ];
    
    for (const file of filesToClean) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`Cleaned up: ${file}`);
        } catch (err) {
          console.error(`Error cleaning ${file}:`, err);
        }
      }
    }
    
    // Clean up previous reports to force regeneration
    const reportsToClean = [
      path.join(olimpPath, 'data', 'reports', 'A_recommendations.md'),
      path.join(olimpPath, 'data', 'reports', 'A_recommendations_CONSENSUS_FINAL.md')
    ];
    
    for (const file of reportsToClean) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`Cleaned up report: ${file}`);
        } catch (err) {
          console.error(`Error cleaning report ${file}:`, err);
        }
      }
    }
    
    // Clean up interim reports directory
    const interimReportsDirCleanup = path.join(olimpPath, 'data', 'reports', 'interim_reports');
    if (fs.existsSync(interimReportsDirCleanup)) {
      try {
        const interimFiles = fs.readdirSync(interimReportsDirCleanup);
        for (const file of interimFiles) {
          if (file.endsWith('.md')) {
            const filePath = path.join(interimReportsDirCleanup, file);
            fs.unlinkSync(filePath);
            console.log(`Cleaned up interim report: ${file}`);
          }
        }
      } catch (err) {
        console.error('Error cleaning interim reports:', err);
      }
    }
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(olimpPath, 'data', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const interimReportsDir = path.join(reportsDir, 'interim_reports');
    if (!fs.existsSync(interimReportsDir)) {
      fs.mkdirSync(interimReportsDir, { recursive: true });
    }
    
    // FIXED: Use UV to run OLIMP with proper environment
    console.log('Using UV package manager for OLIMP execution');
    
    // Check if uv is available
    const uvPath = 'uv';
    
    // Load OLIMP environment variables
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
    } else {
      console.log('⚠️ OLIMP .env file not found');
    }
    
    // Spawn the UV process with proper environment
    const pythonProcess = spawn(uvPath, ['run', 'main.py'], {
      cwd: olimpPath,
      detached: false,  // FIXED: Keep attached for proper monitoring
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...olimpEnv,  // FIXED: Include OLIMP environment variables
        NON_INTERACTIVE: 'true'
      }
    });
    
    // Save the process ID
    const pidFile = path.join(olimpPath, 'analysis_pid.txt');
    fs.writeFileSync(pidFile, pythonProcess.pid?.toString() || '');
    
    // FIXED: Proper stdio handling for progress monitoring
    if (pythonProcess.stdin) pythonProcess.stdin.end();
    
    // Log output for debugging (instead of discarding to /dev/null)
    if (pythonProcess.stdout) {
      pythonProcess.stdout.on('data', (data) => {
        console.log(`OLIMP stdout: ${data.toString()}`);
      });
    }
    
    if (pythonProcess.stderr) {
      pythonProcess.stderr.on('data', (data) => {
        console.log(`OLIMP stderr: ${data.toString()}`);
      });
    }
    
    // Monitor process completion
    pythonProcess.on('close', (code) => {
      console.log(`OLIMP process exited with code: ${code}`);
      
      // Create a simple completion marker
      const completionFile = path.join(olimpPath, 'analysis_complete.txt');
      fs.writeFileSync(completionFile, `Completed with exit code: ${code}\nTimestamp: ${new Date().toISOString()}\n`);
      
      // Clean up PID file
      try {
        fs.unlinkSync(pidFile);
      } catch (err) {
        console.log('PID file cleanup error (non-critical):', err);
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('OLIMP process error:', error);
      
      // Create error marker
      const errorFile = path.join(olimpPath, 'analysis_error.txt');
      fs.writeFileSync(errorFile, `Error: ${error.message}\nTimestamp: ${new Date().toISOString()}\n`);
    });
    
    // Log process information
    console.log(`OLIMP analysis started with PID: ${pythonProcess.pid}`);
    
    return NextResponse.json({
      success: true,
      message: 'OLIMP analysis started successfully',
      pid: pythonProcess.pid,
      status: 'running'
    });
    
  } catch (error) {
    console.error('Error starting OLIMP analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start OLIMP analysis' },
      { status: 500 }
    );
  }
}