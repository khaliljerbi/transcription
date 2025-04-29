const { register } = require('ts-node');
const tsConfig = require('./tsconfig.worker.json');
const moduleAlias = require('module-alias');

// Register TypeScript
register({
  project: './tsconfig.worker.json'
});

// Register module aliases
moduleAlias.addAliases({
  '@': __dirname
});