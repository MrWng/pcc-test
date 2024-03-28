const mvDir = require('mvdir');
// //公共文件库地址
let sourcePath = './src/assets/iconfont';
// //你需要copy到的位置
let destPath = './dist/iconfont';
mvDir(sourcePath, destPath, { copy: true }).then((res) => {
  console.log('iconfont复制成功');
}, () => {
  console.error('iconfont复制失败');
});
