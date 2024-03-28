import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DynamicFormService,
  DynamicUserBehaviorCommService,
  isNotEmpty,
} from '@athena/dynamic-core';
import { DwUserService } from '@webdpt/framework';
import { BaseDynamicCompBuilder } from 'app/implementation/class/DynamicCom';
import { CommonService } from 'app/implementation/service/common.service';
import { CreateDynamicFormCopService } from 'app/implementation/service/create-dynamic-form-cop.setvice';
import { CreateDynamicTableCopService } from 'app/implementation/service/create-dynamic-table-cop.setvice';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
// eslint-disable-next-line no-shadow
export enum pageDataChangeEmitterType {
  INIT = 'init',
  UPDATE = 'update',
}
@Injectable()
export class ProblemHandlingService extends BaseDynamicCompBuilder {
  pageDataChangeEmitter = new BehaviorSubject<any>({});

  constructor(
    public commonService: CommonService,
    public formService: DynamicFormService,
    public createDynamicFormCopService: CreateDynamicFormCopService,
    public createDynamicTableCopService: CreateDynamicTableCopService,
    private http: HttpClient,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private userService: DwUserService
  ) {
    super(formService, createDynamicFormCopService, createDynamicTableCopService);
  }
  generateDynamicCop(uploadData: any = {}) {
    const id = 'attachment';
    return this.initDynamicUpload({
      id,
      isEdit: false,
      headerName: this.commonService.translatePccWord('问题附件'),
      size: 'small',
      downloadEnable: true,
      taskId: 'pccQuestionAttachment',
      uploadData: uploadData,
    });
  }

  // bm.basc.project.question.detail.get
  // getQuestionDetail(params: any[], type = pageDataChangeEmitterType.INIT): Promise<any> {
  //   return this.http
  //     .post(
  //       'http://127.0.0.1:4523/m2/3569931-0-default/123852707',
  //       {
  //         question_list_info: [
  //           {
  //             question_no: '1',
  //           },
  //         ],
  //       },
  //       {
  //         headers: this.commonService.getHeader(),
  //       }
  //     )
  //     .pipe(
  //       map((e: any) => {
  //         this.pageDataChangeEmitter.next({
  //           type,
  //           data: e.question_list_info[0],
  //         });
  //         return e.question_list_info[0];
  //       })
  //     )
  //     .toPromise();
  // }
  // // bm.basc.project.question.detail.get
  getQuestionDetail(params: any[], type = pageDataChangeEmitterType.INIT): Promise<any> {
    return this.commonService
      .getInvData('bm.basc.project.question.detail.get', {
        question_list_info: params,
      })
      .pipe(
        map((e: any) => {
          const data = e?.data?.question_list_info?.[0] || [];
          this.pageDataChangeEmitter.next({
            type,
            data,
          });
          return data;
        })
      )
      .toPromise();
  }

  createQuestionDoList(createParams: any[], getParams: any[]) {
    return this.commonService
      .getInvData('bm.basc.question.do.create', {
        question_do_info: createParams,
      })
      .toPromise()
      .then((e) => {
        return e.data?.success_info?.[0] || {};
      });
  }
  checkEmployee(params: any[]) {
    return this.commonService
      .getInvData('bm.pisc.auth.employee.info.check', {
        employee_info: params,
      })
      .toPromise()
      .then((e) => e?.data?.error_msg);
  }

  submitProcess(params: any[]) {
    return this.commonService
      .getInvData('bm.basc.question.process.create', {
        question_list_process_info: params,
      })
      .toPromise();
  }
  getUserInfoAndAgentInfo(): Promise<any> {
    const personInCharge =
      this.userBehaviorCommService.commData?.workContent?.personInCharge ??
      this.userService.getUser('userId');
    return forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: personInCharge }),
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)))
      .toPromise();
  }
}
