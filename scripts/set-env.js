const fs = require('fs');
const path = require('path');

// Load environment variables
const apiKey = process.env.FIREBASE_API_KEY || '';
const authDomain = process.env.FIREBASE_AUTH_DOMAIN || '';
const projectId = process.env.FIREBASE_PROJECT_ID || '';
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || '';
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || '';
const appId = process.env.FIREBASE_APP_ID || '';
const measurementId = process.env.FIREBASE_MEASUREMENT_ID || '';

const envConfigFile = `export const environment = {
  production: true,
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
fs.writeFileSync(targetPath, envConfigFile);
// Also write to environment.ts so the build doesn't fail if it looks for it
fs.writeFileSync(targetPathDev, envConfigFile);

console.log(`Output generated at ${targetPath}`);
