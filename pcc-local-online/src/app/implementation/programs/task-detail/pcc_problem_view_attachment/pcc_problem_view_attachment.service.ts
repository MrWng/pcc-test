import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework';
import { CommonService } from '../../../service/common.service';
import { map } from 'rxjs/operators';

@Injectable()
export class PccProblemViewAttachmentService {
  atdmUrl: string;
  eocUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  content: any;
  executeContext: any;
  isLoadStatus: boolean = true;
  pageData;
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private commonService: CommonService,
    private translateService: TranslateService
  ) {
    this.configService.get('atdmUrl').subscribe((url: string) => {
      this.atdmUrl = url;
    });
    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
  }

  getQuestionDetail(params: any[]): Promise<any> {
    return this.commonService
      .getInvData('bm.basc.project.question.detail.get', {
        question_list_info: params,
      })
      .pipe(
        map((e: any) => {
          const data = e?.data?.question_list_info?.[0] || [];
          return data;
        })
      )
      .toPromise()
      .then((res) => {
        this.pageData = res;
        return res;
      });
  }
}
