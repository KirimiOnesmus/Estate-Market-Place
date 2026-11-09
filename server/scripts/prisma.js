require('dotenv').config();
require('../src/config/database-url')();

const { spawnSync } = require('node:child_process');
const path = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [path, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
