module.exports = {
  port: 4000,
  envHosts: {
    paas: 'https://athena-paas.digiwincloud.com.cn',
    test: 'https://athena-test.digiwincloud.com.cn',
    prod: 'https://athena.digiwincloud.com.cn'
  },
  apiJson: {

  },
  pluginsConfigServer: {
    "app": {
      "PCC": {
        "name": "PCC",
        "urlPrefixType": "",
        "root": "http://localhost:4500",
        "path": "TaskProjectCenterConsoleModule.js",
        "description": "",
        "i18n": false,
        "disabledMultiVersion": true,
        "isMF": true,
        "moduleName": "TaskProjectCenterConsoleModule",
        "exposesPath": "./PCC"
      }
    }
  }
};
