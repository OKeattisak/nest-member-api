#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env');
const envDevFile = path.join(__dirname, '..', '.env.development');

function toggleSecurity(mode) {
  const files = [envFile, envDevFile];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      if (mode === 'strict') {
        content = content
          .replace(/ENABLE_STRICT_IP_VALIDATION=false/g, 'ENABLE_STRICT_IP_VALIDATION=true')
          .replace(/ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=false/g, 'ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=true')
          .replace(/ENABLE_STRICT_USER_AGENT_VALIDATION=false/g, 'ENABLE_STRICT_USER_AGENT_VALIDATION=true');
        console.log(`✅ Enabled strict security mode in ${path.basename(file)}`);
      } else if (mode === 'lenient') {
        content = content
          .replace(/ENABLE_STRICT_IP_VALIDATION=true/g, 'ENABLE_STRICT_IP_VALIDATION=false')
          .replace(/ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=true/g, 'ENABLE_STRICT_MALICIOUS_PATTERN_DETECTION=false')
          .replace(/ENABLE_STRICT_USER_AGENT_VALIDATION=true/g, 'ENABLE_STRICT_USER_AGENT_VALIDATION=false');
        console.log(`✅ Enabled lenient security mode in ${path.basename(file)}`);
      }
      
      fs.writeFileSync(file, content);
    }
  });
}

const mode = process.argv[2];

if (mode === 'strict' || mode === 'lenient') {
  toggleSecurity(mode);
  console.log(`\n🔄 Security mode changed to: ${mode.toUpperCase()}`);
  console.log('📝 Restart your application to apply changes');
} else {
  console.log('Usage: node scripts/toggle-security.js [strict|lenient]');
  console.log('');
  console.log('  strict  - Enable strict security validation (production-ready)');
  console.log('  lenient - Enable lenient security validation (development-friendly)');
}