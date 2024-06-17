const fs = require('fs');

// fs.readFileSync();

// console.log(libStr);

function writeLibJson() {
  const lib = require('../../../../../builders/plugin-builder/lib.json');
  let targetLib = '\n';

  for (const item in lib) {
    if (lib.hasOwnProperty(item)) {
      // targetLib[item] = item;
      // targetLib[item] = `require('${item}')`;
      targetLib += `  '${item}': require('${item}'),\n`;
    }
  }

  const libStr = `export const PLUGIN_EXTERNALS_MAP = {${targetLib}};`;

  fs.writeFileSync('./plugin-externals.ts', libStr);
}

writeLibJson();
