let path = require('path');
let fs = require('fs-extra');
let currentDir = __dirname;
let root = currentDir.substring(0, currentDir.lastIndexOf('src'));
let pluginsDir = root + 'dist/assets/plugins/';

function getAllFiles(dir, fileReg, fileList) {
  const fileNames = fs.readdirSync(dir);
  if (!Array.isArray(fileNames)) {
    return;
  }
  fileNames.forEach((fileName) => {
    const fullPath = path.join(dir, fileName);
    let fileStats = fs.statSync(fullPath);
    if (fileStats.isFile() && fileReg.test(fileName)) {
      fileList.push({
        fileName,
        fullPath,
      });
    } else if (fileStats.isDirectory()) {
      getAllFiles(fullPath, fileReg, fileList);
    }
  });
}

const reg = /.(png|jpe?g|gif|svg)$/;
const fileList = [];
console.log(`开始获取所有插件的图片文件....`);
getAllFiles(pluginsDir, reg, fileList);
console.log(`获取所有插件的图片文件成功，个数为：${fileList.length}`);
let targetDir = root + 'dist/';
const errorFiles = [];
fileList.forEach((item) => {
  fs.move(item.fullPath, path.join(targetDir, item.fileName), { overwrite: true }, (error) => {
    if (error) {
      errorFiles.push({ item, error });
    }
  });
});
errorFiles.length > 0 ? console.log('插件图片文件移动失败的文件列表：', errorFiles) : null;
console.log(`插件图片文件移动到${targetDir}目录结束`);
fileList.splice(0, fileList.length);
errorFiles.splice(0, errorFiles.length);

const mapReg = /.map$/;
getAllFiles(pluginsDir, mapReg, fileList);
fileList.forEach((item) => {
  fs.remove(item.fullPath);
});
console.log(`成功删除插件的map文件`);
