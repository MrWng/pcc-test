import { Injectable, Inject } from '@angular/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { programs } from 'app/config/custom-app-config';
@Injectable({
  providedIn: 'root',
})
export class EmailService {
  uibotUrl: string;
  atmcUrl: string;
  bpmUrl: string;

  constructor(
    private config: DwSystemConfigService,
    private http: HttpClient,
    private datePipe: DatePipe,
    @Inject(DW_AUTH_TOKEN) protected authToken: any
  ) {
    this.config.get('uibotUrl').subscribe((url: string) => {
      this.uibotUrl = url + '/api/ai/v1/bot/';
    });
    this.config.get('atmcUrl').subscribe((url: string) => {
      this.atmcUrl = url;
    });
    this.config.get('bpmUrl').subscribe((url: string) => {
      this.bpmUrl = url;
    });
  }

  /**
   * 通过密钥获取data
   * @param secretKey
   */
  getDataBySecretKey(secretKey: string, programName?: string): Observable<any> {
    /**
     * 默认调用真实环境的数据
     * 如果需要本地调式使用本地的mock数据，模拟线上环境加载你的自定义组件，可以在app/config/custom-app-config.ts文件中配置jsonPath的地址，对应你本地的api路径，访问url时带上programName的queryParams参数
     * 示例：配置如下
     * 访问地址栏使用：http://localhost:4500/dev/xxx?programName=helloWorld
     */
    let url = this.uibotUrl + `shorter/address/show/${secretKey}`;
    if (programName && programs[programName] && programs[programName]?.jsonPath) {
      url = programs[programName]?.jsonPath;
    }
    return this.http.get(url);
  }

  /**
   * 执行操作
   * @param params 提交参数
   */
  executeAction(params: any): Observable<any> {
    const url = this.atmcUrl + '/api/atmc/v1/action/submit';
    return this.http.post(url, params);
  }

  /**
   * 格式化更新的参数
   * @param formData
   * @param oldData
   */
  formateUpdateParams(formData: any, oldData: any = []): Array<any> {
    const formArrayData = [];
    const newArrayData = [];

    Object.keys(formData).forEach((key) => {
      if (Array.isArray(formData[key])) {
        formData[key].forEach((item) => {
          formArrayData.push(this.translateNestedToTiled(item));
        });
      }
    });

    oldData.forEach((item: any, index: number) => {
      const newObj = Object.assign({}, item, formArrayData[index]);
      newArrayData.push(newObj);
    });
    return newArrayData;
  }

  /**
   * 将源嵌套对象转换成平铺结构
   * @param source
   * @param obj
   */
  private translateNestedToTiled(source: any = {}, obj: any = {}): any {
    Object.keys(source).forEach((key) => {
      if (typeof source[key] === 'object') {
        const fieldType = Object.prototype.toString.call(source[key]);

        switch (fieldType) {
        case '[object Date]':
          obj[key] = this.datePipe.transform(source[key], 'yyyy/MM/dd');
          break;

        case '[object Array]':
          const newArr = [];
          source[key].forEach((item) => {
            let newItem;
            if (typeof item === 'object') {
              newItem = this.translateNestedToTiled(item, newItem);
            } else {
              newItem = item;
            }
            newArr.push(newItem);
          });
          obj[key] = newArr;
          break;

        case '[object Object]':
          obj = this.translateNestedToTiled(source[key], obj);
          break;

        default:
          break;
        }
      } else {
        obj[key] = source[key];
      }
    });

    return obj;
  }
}
