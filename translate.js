const path = require('path');
const fs = require('fs');
const axios = require('axios');

// 由简体zh_CN翻译到繁体zh_TW，并写入到zh_TW文件夹中
const _rootPath = path.resolve('.', __dirname);
const i18nPath = '/src/assets/i18n';
const _originI18nDir = '/zh_CN';
const _targetI18nDir = '/zh_TW';
const originI18nPathName = path.join(_rootPath, i18nPath, _originI18nDir);
const targetI18nPathName = path.join(_rootPath, i18nPath, _targetI18nDir);

function translateApi(jsonData) {
  // 接口文档地址： http://10.40.46.16:22694/html/web/controller/share/share.html#6310205052a244000d150a61
  return axios({
    url: 'https://translation.digiwincloud.com/restful/service/translater/IDWTranslateService/translate',
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    data: {
      content: jsonData,
      convertTypes: ['zh2Hant'], //'zh2Hant'- 中文简体转繁体；'zh2En' - 中文简体转英文
    },
  });
}

function execTranslate(fileInfo) {
  const originfile = path.join(fileInfo.originPath, fileInfo.name);
  let jsonData = fs.readFileSync(originfile, { encoding: 'utf-8' });
  if (!jsonData) {
    return;
  }
  jsonData = JSON.parse(jsonData);
  translateApi(jsonData).then(
    function (res) {
      if (res.data && res.data.response && res.data.response.success) {
        const translatedData = res.data.response.data;
        const hantJSON = JSON.stringify(translatedData.zh2Hant, null, 2);

        const targetfile = path.join(fileInfo.targetPath, fileInfo.name);
        fs.writeFileSync(targetfile, hantJSON);
      } else {
        console.log(`翻译API调用失败，请重试!`);
      }
    },
    function (err) {
      console.log(`翻译API调用失败，请重试!`);
    }
  );
}

function init() {
  fs.readdirSync(originI18nPathName).forEach(function (filename) {
    // 针对zh_CN文件夹下的json文件进行逐一翻译，并写入
    execTranslate({
      originPath: originI18nPathName,
      targetPath: targetI18nPathName,
      name: filename,
    });
  });
  console.log("翻译结束！")
}

init();
