const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const outputName = `${package.name}.mcpb`;

try {
  execFileSync('mcpb', ['pack', outputName], { stdio: 'inherit', cwd: path.dirname(packagePath) });
  console.log(`✓ Created ${outputName}`);
} catch (error) {
  console.error('✗ Failed to create MCPB bundle:', error.message);
  process.exit(1);
}