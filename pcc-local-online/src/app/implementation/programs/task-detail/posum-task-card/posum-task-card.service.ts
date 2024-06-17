import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { CommonService } from '../../../service/common.service';

@Injectable()
export class PosumTaskCardService {
  atmcUrl: string;
  smartDataUrl: string;
  eocUrl: string;
  aimUrl: string;
  group: any;

  taskInfo: any = {};
  operations = [];

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

  /**
   * 获取任务卡数据
   * @param project_no
   * @param task_no
   */
  async getTaskInfo(project_no: string, task_no): Promise<any> {
    const params = {
      project_info: [
        {
          control_mode: '1',
          project_no: project_no,
          task_no: task_no,
        },
      ],
    };
    const res: any = await this.commonService.getInvData('task.info.get', params).toPromise();
    this.taskInfo = res?.data.project_info?.[0] ?? {};
    return this.taskInfo;
  }

  setTemplateJson(
    category: string,
    responseData: Array<any>,
    showBtn: boolean,
    contents: any
  ): any {
    let taskCategoryLayout;
    if (['PRSUM', 'POSUM', 'MOOP'].includes(category)) {
      let columns, columnDefs;
      if (showBtn || ['MOOP'].includes(category)) {
        columns = [
          {
            headerName: this.translateService.instant('dj-default-单别'),
            schema: 'doc_type_no',
            editable: true,
            showIcon: true,
          },
          {
            headerName: this.translateService.instant('dj-default-单号'),
            schema: 'doc_no',
            editable: true,
            showIcon: true,
          },
          {
            headerName: this.translateService.instant('dj-default-品号类别/群组'),
            schema: 'item_classification',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
        ];
        // 单独处理MOOP
        if (['MOOP'].includes(category)) {
          columns.forEach((o, i) => {
            if (o.schema === 'item_classification') {
              columns.splice(i, 1, {
                headerName: this.translateService.instant('dj-default-序号'),
                editable: true,
                showIcon: true,
                schema: 'seq',
              });
            }
          });
        }
        console.log(columns, 'columns');
      } else {
        columns = [
          {
            headerName: this.translateService.instant('dj-pcc-参考单别'),
            schema: 'reference_type_no',
          },
          {
            headerName: this.translateService.instant('dj-pcc-参考单号'),
            schema: 'reference_doc_no',
          },
          {
            headerName: this.translateService.instant('dj-default-品名规格'),
            columns: [
              {
                schema: 'item_name_spec',
                headerName: this.translateService.instant('dj-default-品名'),
                level: 0,
                path: 'item_name_spec',
              },
              {
                schema: 'item_spec',
                headerName: this.translateService.instant('dj-default-规格'),
                level: 0,
                path: 'item_spec',
              },
            ],
          },
          {
            headerName: this.translateService.instant('dj-default-品号类别/群组'),
            schema: 'item_classification',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
        ];
        let columsType;
        if (['POSUM'].includes(category)) {
          columsType = [
            {
              headerName: this.translateService.instant('dj-default-采购人员'),
              schema: 'purchaser_name',
            },
            { headerName: this.translateService.instant('dj-pcc-采购单号'), schema: 'purchase_no' },
            {
              headerName: this.translateService.instant('dj-default-采购数量'),
              schema: 'purchase_qty',
            },
            {
              headerName: this.translateService.instant('dj-default-入库数量'),
              schema: 'stock_in_qty',
            },
          ];
        } else if (['PRSUM'].includes(category)) {
          columsType = [
            {
              headerName: this.translateService.instant('dj-default-请购人员'),
              schema: 'requisitioner_name',
            },
            {
              headerName: this.translateService.instant('dj-default-请购单号'),
              schema: 'requisitions_no',
            },
            // s10: 新增请购日期栏位
            {
              headerName: this.translateService.instant('dj-pcc-请购日期'),
              schema: 'pr_date',
            },
            {
              headerName: this.translateService.instant('dj-default-请购数量'),
              schema: 'requisitions_qty',
            },
            {
              headerName: this.translateService.instant('dj-default-采购数量'),
              schema: 'purchase_qty',
            },
          ];
        }
        columns = columns.concat(columsType);
      }
      this.operations = [
        {
          title: this.translateService.instant('dj-default-问题反馈'),
          type: 'showProblemFeedback',
          description: '',
          pcontent: contents[0],
          contents: contents[0],
          attach: {
            target: 'project_info',
            mode: 'all',
          },
          isCustomize: true,
        },
        {
          title: this.translateService.instant('dj-pcc-查看前置任务'),
          type: 'showPreTaskType',
          description: '',
          pcontent: contents[1],
          contents: contents[1],
          attach: {
            target: 'project_info',
            mode: 'all',
          },
          isCustomize: true,
        },
      ];

      taskCategoryLayout = [
        {
          id: 'inquiry',
          type: 'GRID_TABLE',
          schema: 'inquiry',
          editable: true,
          operations: this.operations,
          columnDefs: this.commonService.getLayout(columns),
          details: [],
        },
      ];
    }
    console.log(responseData, '表格数据-responseData');
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
