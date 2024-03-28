const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const _rootPath = path.resolve('.', __dirname);
// 待打包的文件夹
const _distPath = '/dist';
const distPath = path.join(_rootPath, _distPath);
const zipFilePath = path.join(_rootPath, 'dist.zip');
// 获取参数配置，用于创建文件夹
const pathName = process.argv[2] || '';

/**
 * 压缩文件夹
 * @param sourceFolder，待压缩的文件夹路径
 * @param destZip，压缩后的zip文件路径
 */
function zipFolder(sourceFolder, destZip) {
  // 创建文件输出流
  const output = fs.createWriteStream(destZip);
  // 设置压缩级别
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  // 监听文件输出流结束
  output.on('close', function () {
    console.log('zip folder success!');
  });
  // 监听压缩是否出错
  archive.on('error', function (err) {
    console.log('zip folder fail!', err);
  });
  // 通过管道方法将输出流存档到文件
  archive.pipe(output);
  // 追加一层文件夹
  archive.directory(sourceFolder, pathName);
  // 追加一个index.html避开网站的校验
  archive.append('', { name: 'index.html' });
  // 完成压缩
  archive.finalize();
}

if (fs.existsSync(distPath)) {
  zipFolder(distPath, zipFilePath);
} else {
  console.log('dist文件夹不存在，请执行打包命令生成dist文件夹内容！');
}
// 'D:\\project\\定制应用工程-1.0.3\\dist'
// 'D:\\project\\定制应用工程-1.0.3\\dist.zip'
