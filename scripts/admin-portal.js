const { exec } = require('child_process');
const path = require('path');

console.log('--------------------------------------------------');
console.log('🛡️  INDUSTRIAL TIMES - SECURE ADMIN GATEWAY');
console.log('--------------------------------------------------');
console.log('\n[STATUS] Initializing administrative session...');
console.log('[INFO] Testing Phase Credentials:');
console.log('   👤 ID: admin');
console.log('   🔑 Pass: admin123');
console.log('\n[ACTION] Opening Superadmin Portal in your browser...');

// Open the browser to the admin-login page
const url = 'http://localhost:5173/admin-login';
const start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');

exec(`${start} ${url}`, (err) => {
  if (err) {
    console.error('[ERROR] Failed to open browser automatically.');
    console.log(`[MANUAL] Please visit: ${url}`);
  } else {
    console.log('[SUCCESS] Portal opened. You may now login.');
  }
});

console.log('\n--------------------------------------------------');
