#!/usr/bin/env node

/**
 * Generate build-info.json with git commit metadata
 * This runs during the build process to capture deployment information
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get git commit information
  const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  const commitShort = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  const commitDate = execSync('git log -1 --format=%cI', { encoding: 'utf-8' }).trim();
  const commitMessage = execSync('git log -1 --format=%s', { encoding: 'utf-8' }).trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

  const buildInfo = {
    commitSha,
    commitShort,
    commitDate,
    commitMessage,
    branch,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version
  };

  // Write to build-info.json in the project root
  const outputPath = path.join(__dirname, '..', 'build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

  console.log('✅ Build info generated successfully');
  console.log('📅 Commit Date:', commitDate);
  console.log('🔖 Commit:', commitShort, '-', commitMessage);
  console.log('🌿 Branch:', branch);
} catch (error) {
  console.error('❌ Failed to generate build info:', error.message);
  
  // Create a fallback build-info.json with current time
  const fallbackInfo = {
    commitDate: new Date().toISOString(),
    buildTime: new Date().toISOString(),
    error: 'Git information unavailable'
  };
  
  const outputPath = path.join(__dirname, '..', 'build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(fallbackInfo, null, 2));
  
  console.log('⚠️ Created fallback build-info.json');
}

