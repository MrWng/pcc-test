// .lintstagedrc.js
module.exports = {
  '*.js': ['prettier --config .prettierrc --write', 'eslint --fix --ext .js'],
  '*.ts': ['prettier --config .prettierrc --write', 'eslint --fix --ext .ts'],
  '*.json': 'prettier --config .prettierrc --write',
};