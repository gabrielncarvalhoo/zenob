const fs = require('fs');
const dirs = fs.readdirSync('/home/gabrielndc/zenob/zenob-web/src/app/imoveis');
console.log('Dirs:', dirs);

const badDirName = dirs.find(d => d.includes('\\'));
if (badDirName) {
  const badDirPath = `/home/gabrielndc/zenob/zenob-web/src/app/imoveis/${badDirName}`;
  console.log('Found bad dir:', badDirPath);
  fs.rmSync(badDirPath, {recursive: true, force: true});
  console.log('Deleted');
} else {
  console.log('No bad dir found');
}
