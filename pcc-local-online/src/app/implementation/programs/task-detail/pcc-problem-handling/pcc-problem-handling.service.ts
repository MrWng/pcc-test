import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework';
import { CommonService } from '../../../service/common.service';
import { MaintenanceInformationComponent } from './components/maintenance-information/maintenance-information.component';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { DwFormGroup, isEmpty, isNotEmpty } from '@athena/dynamic-core';
import { FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { map } from 'rxjs/operators';

@Injectable()
export class PccProblemHandlingService {
  atdmUrl: string;
  eocUrl: string;
  uibotUrl: string;
  smartDataUrl: string;
  content: any;
  executeContext: any;
  isLoadStatus: boolean = true;
  startMaintenanceInformation;
  pageData: any;
  filePreviewPrefixUrl: string = `${this.commonService.dmcUrl}/api/dmc/v2/file/Athena/share/`;
  formatDateTransform = (date: string | number | Date, dateFormateType = 'yyyy-MM-dd HH:mm:ss') => {
    if (isEmpty(date)) {
      return date;
    }
    return formatDate(date, dateFormateType, this.locale);
  };
  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private commonService: CommonService,
    private translateService: TranslateService,
    public modalService: AthModalService
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

  deleteQuestionDo(params: any[]): Promise<any> {
    return this.commonService
      .getInvData('bmd.basc.question.do.delete', {
        question_do_info: params,
      })
      .toPromise();
  }

  updateQuestionDo(params: any[]) {
    return this.commonService
      .getInvData('bmd.basc.question.do.update', {
        question_do_info: params,
      })
      .toPromise();
  }
  /**
   * 选择人员异步校验
   */
  async employeeNameVerifyFn(info: any[] = []): Promise<any> {
    let errorMsg = '';
    if (!info.length) {
      return Promise.resolve(null);
    }
    try {
      errorMsg = await this.checkEmployee(
        info.map((item) => ({
          employee_no: item.process_person_no,
          employee_name: item.process_person_name,
        }))
      );
    } catch (error) {
    } finally {
      if (isNotEmpty(errorMsg)) {
        return Promise.resolve({
          error: true,
          errorMsg,
        });
      }
      return Promise.resolve(null);
    }
  }
  checkEmployee(params: any[]) {
    return this.commonService
      .getInvData('bm.pisc.auth.employee.info.check', {
        employee_info: params,
      })
      .toPromise()
      .then((e) => e?.data?.error_msg);
  }
}
