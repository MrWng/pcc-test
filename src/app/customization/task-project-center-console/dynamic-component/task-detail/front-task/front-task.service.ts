import { Inject, Injectable } from '@angular/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/customization/task-project-center-console/service/common.service';

@Injectable()
export class FrontTaskService {
  atmcUrl: string;
  smartDataUrl: string;
  eocUrl: string;
  aimUrl: string;
  group: any;

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private configService: DwSystemConfigService,
    protected translateService: TranslateService,
    protected commonService: CommonService
  ) {
    this.configService.get('atmcUrl').subscribe((url: string) => {
      this.atmcUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });
    this.configService.get('aimUrl').subscribe((url: string): void => {
      this.aimUrl = url;
    });
  }

  setTemplateJson(responseData: Array<any>): any {
    const columns = [
      {
        headerName: this.translateService.instant('dj-default-前置任务名称'),
        schema: 'before_task_name',
      },
      {
        headerName: this.translateService.instant('dj-default-前置任务负责人'),
        schema: 'before_task_liable_person_name',
      },
      {
        headerName: this.translateService.instant('dj-default-预计开始日'),
        schema: 'before_task_plan_start_date',
      },
      {
        headerName: this.translateService.instant('dj-default-预计完成日'),
        schema: 'before_task_plan_finish_date',
      },
      {
        headerName: this.translateService.instant('dj-default-实际开始日'),
        schema: 'before_task_actual_start_date',
      },
      {
        headerName: this.translateService.instant('dj-default-实际完成日'),
        schema: 'before_task_actual_finish_date',
      },
      {
        headerName: this.translateService.instant('dj-default-报工说明'),
        schema: 'before_task_remark',
      },
      {
        headerName: this.translateService.instant('dj-default-交付物'),
        schema: 'attachment0',
        upload: true,
      },
      {
        headerName: this.translateService.instant('dj-default-附件'),
        schema: 'attachment1',
        upload: true,
      },
    ];
    const taskCategoryLayout = [
      {
        id: 'inquiry',
        type: 'TABLE',
        schema: 'inquiry',
        editable: true,
        operations: [],
        columnDefs: this.commonService.getLayout(columns),
        details: [],
      },
    ];
    const data = {
      layout: taskCategoryLayout,
      pageData: {
        inquiry: responseData,
      },
      content: {
        pattern: 'DATA_ENTRY',
        category: 'SIGN-DOCUMENT',
      },
      rules: [
        {
          schema: 'price',
          path: 'inquiry',
          condition: 'true',
          key: 'required',
          scope: 'EDIT',
        },
      ],
      style: {},
    };

    return data;
  }
}
