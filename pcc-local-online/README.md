###### 项目中控台打包

控制台下在项目根目录执行npm run build:task-project-center-console

然后把src/assets/plugins/list目录下的打包好的插件拷贝到支athena-web的master分相同目录下


同时修改src/assets/plugins/plugins-config.json插件注册文件，如果不存在则添加对应的插件信息，如下：
`
{
  "TaskProjectCenterConsoleModule": {
    "name": "TaskProjectCenterConsoleModule",
    "path": "/assets/plugins/list/task-project-center-console/TaskProjectCenterConsoleModule.js",
    "description": "clarity form",
    "isRouter": false,
    "deps": []
  }
}
`

然后提交上传

athena-web正常运行或者打包
### 账号
```
pass区

test区
pcc001/pcc001

需求方: 潘晓婷

禅道
waixie0010/waixie0010
```

## 构建地址
`
打包成镜像地址
https://athena-devops-jenkins.digiwincloud.com.cn/job/MUI/
操作
登录:admin admin
选择需要打包的项目，以mkp为例：
选择： Build with Parameters --》 选择正确的分支--》点击build 按钮

运维平台部署
https://ops.digiwincloud.com.cn/
账号：
outsourcing01  0uts0uRcINg01
outsourcing02  ouTSourcing02
outsourcing03  oUtsoUrcing03
outsourcing04  outsourcING04
outsourcing05  OutSourcIng05
`

### 链接
`
PAAS区登录验证 https://athena-paas.digiwincloud.com.cn/
TEST区登录验证https://athena-test.digiwincloud.com.cn/
`
