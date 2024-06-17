var fs = require('fs'),
  path = require('path'),
  exec = require('child_process').exec,
  less = require('less'),
  sourcePath, targetPath;
// sourcePath = 'src/styles.less';
// targetPath = 'src/css/';
sourcePath = 'src/app/theme'; // less檔來源路徑
targetPath = 'src/assets/themes'; // 轉換為css後存檔路徑
cssPath = 'assets/themes'; // 專案存取css路徑
//自訂路徑:获取命令行中的路径
process.argv.forEach(function (val, index, array) {
  console.log(val);
  if (index == 2) {
    sourcePath = val;
  }
  if (index == 3) {
    targetPath = val;
  }
  if (index == 4) {
    cssPath = val;
  }
})

var lessc = function (rootPath, targetPath, cssPath) {

  //**簡易測試寫法 */
  // //判断文件是否为less文件
  // if (path.extname(rootPath) === ".less") {
  //   var currentFilePath = path.resolve(rootPath);
  //   var newFilePath = path.resolve(targetPath, path.basename(currentFilePath, '.less') + ".css");
  //   if (!fs.existsSync(targetPath)) {
  //     fs.mkdirSync(targetPath);
  //   }
  //   // 方法一:用less render
  //   less.render(fs.readFileSync(currentFilePath).toString(), {
  //     filename: path.resolve(currentFilePath),
  //   }, function (e, output) {
  //     if (e) {
  //       console.log(e);
  //     }
  //     fs.writeFileSync(newFilePath, output.css);
  //   });
  //   ////方法二:使用命令列lessc,但錯誤訊息不知如何列出
  //   // exec("lessc -x" + currentFilePath + " > " + newFilePath);
  // }
  //**簡易測試寫法END */

  //取得当前绝对路径
  rootPath = path.resolve(rootPath);
  //目标路径绝对路径
  targetPath = path.resolve(targetPath);
  
  //判断目录是否存在
  fs.exists(rootPath, function (exists) {
    //路径存在
    if (exists) {
      var jsonArr=[];
      //获取当前路径下的所有文件和路径名
      var childArray = fs.readdirSync(rootPath);
      if (childArray.length) {
        var id = '';
        var themePath = '';
        var jsonFilePath = path.resolve(targetPath, "themeJson.json");
        for (var i = 0; i < childArray.length; i++) {
          var currentFilePath = path.resolve(rootPath, childArray[i]);
          var currentTargetPath = path.resolve(targetPath, childArray[i])
          //读取文件信息
          var stats = fs.statSync(currentFilePath);
          //若是目录则递归调用
          if (stats.isDirectory()) {
            //lessc(currentFilePath, currentTargetPath);
          } else {
            //判断文件是否为less文件
            if (path.extname(currentFilePath) === ".less") {
              var newFilePath = path.resolve(targetPath, path.basename(currentFilePath, '.less') + ".css");
              id = path.basename(currentFilePath, '.less');
              themePath = cssPath + '/' + id + '.css';
              if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath);
              }
              // 方法一:用less render
              (function(currentFilePath, newFilePath, id, themePath) {
                less.render(fs.readFileSync(currentFilePath).toString(), {
                  filename: path.resolve(currentFilePath),
                }, function (e, output) {
                  if (e) {
                    console.log(e); // 錯誤訊息
                  }
                  console.log(newFilePath);
                  jsonArr.push({"id":id, "path":themePath});
                  fs.writeFileSync(newFilePath, output.css);　// 寫入css
                  fs.writeFileSync(jsonFilePath,JSON.stringify(jsonArr)); // 產生css名稱及路徑
                });
            })(currentFilePath, newFilePath, id, themePath);              
              ////方法二:使用命令列lessc,但錯誤訊息不知如何列出
              // exec("lessc -x " + currentFilePath + " > " + newFilePath);
            }
          }
        }
      }
      
    } else {
      console.log("directory is not exists");
    }
  });

}

lessc(sourcePath, targetPath, cssPath);
