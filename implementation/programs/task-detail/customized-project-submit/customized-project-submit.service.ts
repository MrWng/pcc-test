import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework';
import { CommonService } from '../../../service/common.service';
import { Observable } from 'rxjs';

@Injectable()
export class CustomizedProjectSubmitService{
  atmcUrl: string;
  content: any;
  executeContext: any;
  isLoadStatus: boolean = true;
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private commonService: CommonService,
    private translateService: TranslateService
  ) {
    this.configService.get('atmcUrl').subscribe((url: string) => {
      this.atmcUrl = url;
    });
  }

  executeAction(params: any): Observable<any> {
    const url = `${this.atmcUrl}/api/atmc/v1/action/submit`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }
}
