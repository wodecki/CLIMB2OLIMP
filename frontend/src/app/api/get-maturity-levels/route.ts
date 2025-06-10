import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the backend maturity_levels.json file
    const maturityLevelsFilePath = path.join(process.cwd(), '..', 'backend', 'maturity_levels.json');
    
    // Check if the file exists
    if (!fs.existsSync(maturityLevelsFilePath)) {
      // If the file doesn't exist, fall back to the status.json file
      const statusFilePath = path.join(process.cwd(), '..', 'backend', 'status.json');
      const statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
      const maturityLevels = statusData.strategicGoals || {};
      return NextResponse.json({ maturityLevels }, { status: 200 });
    }
    
    // Read the maturity levels file
    const maturityLevelsData = JSON.parse(fs.readFileSync(maturityLevelsFilePath, 'utf8'));
    
    return NextResponse.json({ maturityLevels: maturityLevelsData.maturityLevels }, { status: 200 });
  } catch (error) {
    console.error('Error fetching maturity levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maturity levels' },
      { status: 500 }
    );
  }
}
