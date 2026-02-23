/* eslint-disable */
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envConfig = dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (envConfig.error) {
  console.warn('Warning: .env.local file not found');
}

// Merge .env.local values with process.env
const env = {
  ...process.env,
  ...(envConfig.parsed || {})
};

// Get arguments passed to this script (e.g. "dev", "deploy")
const args = process.argv.slice(2);

// If "deploy" is passed, we use production env vars, otherwise use dev env vars
const isDeployingToProd = args.includes('deploy');

// Override with development values if they exist, but ONLY if we are not deploying to prod
if (!isDeployingToProd) {
  if (env.DEVELOPMENT_CONVEX_SELF_HOSTED_URL) {
    console.log('🔄 [DEV] Using Development Convex URL:', env.DEVELOPMENT_CONVEX_SELF_HOSTED_URL);
    env.CONVEX_SELF_HOSTED_URL = env.DEVELOPMENT_CONVEX_SELF_HOSTED_URL;
  }
  if (env.DEVELOPMENT_CONVEX_SELF_HOSTED_ADMIN_KEY) {
    console.log('🔑 [DEV] Using Development Convex Admin Key');
    env.CONVEX_SELF_HOSTED_ADMIN_KEY = env.DEVELOPMENT_CONVEX_SELF_HOSTED_ADMIN_KEY;
  }
} else {
  if (!env.CONVEX_SELF_HOSTED_URL) {
    console.error('❌ Error: CONVEX_SELF_HOSTED_URL is not set for production deployment');
    process.exit(1);
  }
  if (!env.CONVEX_SELF_HOSTED_ADMIN_KEY) {
    console.error('❌ Error: CONVEX_SELF_HOSTED_ADMIN_KEY is not set for production deployment');
    process.exit(1);
  }
  console.log('🚀 [PROD] Using Production Convex URL:', env.CONVEX_SELF_HOSTED_URL);
  console.log('🔑 [PROD] Using Production Convex Admin Key');
}

// Always run 'convex dev', just with different env vars
console.log('🏃 Running: npx convex dev');

const child = spawn('npx', ['convex', 'dev'], {
  stdio: 'inherit',
  env: env,
  shell: false
});

child.on('exit', (code) => {
  process.exit(code);
});
