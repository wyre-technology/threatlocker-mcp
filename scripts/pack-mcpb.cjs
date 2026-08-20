const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const outputName = `${package.name}.mcpb`;

try {
  // `mcpb pack [directory] [output]` takes the SOURCE DIRECTORY first and the
  // output filename second. This was calling it with only the output name,
  // so mcpb tried to pack a directory literally named "threatlocker-mcp.mcpb"
  // (which doesn't exist) instead of packing "." into that output file.
  execFileSync('mcpb', ['pack', '.', outputName], { stdio: 'inherit', cwd: path.dirname(packagePath) });
  console.log(`✓ Created ${outputName}`);
} catch (error) {
  console.error('✗ Failed to create MCPB bundle:', error.message);
  process.exit(1);
}