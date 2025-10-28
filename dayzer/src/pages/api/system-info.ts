import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export const GET: APIRoute = async () => {
  try {
    // Read package.json to get version info
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // Detect environment - check Netlify context first, then NODE_ENV
    const netlifyContext = process.env.CONTEXT; // 'production', 'deploy-preview', 'branch-deploy'
    const isProduction = netlifyContext === 'production' || process.env.NODE_ENV === 'production';
    const environment = isProduction ? 'production' : 'development';
    
    // Get Netlify-specific info if available
    const netlifyBuildId = process.env.BUILD_ID || null;
    const netlifyDeployUrl = process.env.DEPLOY_URL || null;
    const gitCommitSha = process.env.COMMIT_REF || process.env.GIT_COMMIT || null;
    const gitBranch = process.env.BRANCH || process.env.HEAD || null;
    
    // Try to get git commit date
    let deployedAt = new Date().toISOString();
    try {
      // First try to read from build-time generated file
      const buildInfoPath = join(process.cwd(), 'build-info.json');
      if (existsSync(buildInfoPath)) {
        const buildInfo = JSON.parse(readFileSync(buildInfoPath, 'utf-8'));
        deployedAt = buildInfo.commitDate || deployedAt;
      } else {
        // Fallback: Try to get commit date from git (works locally and if .git exists)
        const commitDate = execSync('git log -1 --format=%cI', { encoding: 'utf-8' }).trim();
        if (commitDate) {
          deployedAt = commitDate;
        }
      }
    } catch (error) {
      // If git command fails (e.g., on Netlify without .git), use current time
      console.log('Could not retrieve git commit date, using current time');
    }
    
    // Runtime info
    const nodeVersion = process.version;
    const platform = process.platform;

    const systemInfo = {
      environment: {
        nodeEnv: environment,
        isProduction,
        platform,
        nodeVersion
      },
      deployment: {
        platform: netlifyContext ? 'Netlify' : 'Local',
        context: netlifyContext,
        buildId: netlifyBuildId,
        deployUrl: netlifyDeployUrl,
        gitCommitSha: gitCommitSha ? gitCommitSha.substring(0, 7) : null,
        gitBranch,
        deployedAt
      }
    };

    return new Response(JSON.stringify(systemInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('System info error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch system information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, null, 2), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

