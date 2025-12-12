const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const lineTrimmed = line.trim();
    if (!lineTrimmed || lineTrimmed.startsWith('#')) return;
    const separatorIdx = lineTrimmed.indexOf('=');
    if (separatorIdx > 0) {
      const key = lineTrimmed.substring(0, separatorIdx).trim();
      const value = lineTrimmed.substring(separatorIdx + 1).trim();
      // Only set if not already set (prioritize system env vars)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Load environment variables
const apiKey = process.env.FIREBASE_API_KEY || '';
const authDomain = process.env.FIREBASE_AUTH_DOMAIN || '';
const projectId = process.env.FIREBASE_PROJECT_ID || '';
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || '';
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || '';
const appId = process.env.FIREBASE_APP_ID || '';
const measurementId = process.env.FIREBASE_MEASUREMENT_ID || '';

const envConfigFile = (isProd) => `export const environment = {
  production: ${isProd},
  firebase: {
    apiKey: "${apiKey}",
    authDomain: "${authDomain}",
    projectId: "${projectId}",
    storageBucket: "${storageBucket}",
    messagingSenderId: "${messagingSenderId}",
    appId: "${appId}",
    measurementId: "${measurementId}",
  },
};
`;

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const targetPathDev = path.join(__dirname, '../src/environments/environment.ts');

// Ensure directory exists
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write the file
fs.writeFileSync(targetPath, envConfigFile(true));
// Also write to environment.ts so the build doesn't fail if it looks for it
fs.writeFileSync(targetPathDev, envConfigFile(false));

console.log(`Output generated at ${targetPath}`);
