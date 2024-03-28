import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class ListOfDeliverableService {
  uibotUrl: string;
  // 记录机制的content参数
  content: any;
  // 开窗所需参数
  executeContext: any;
  OpenWindowDefine: any; // 开窗定义
  smartDataUrl: string;

  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    protected translateService: TranslateService
  ) {
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
  }

  setTemplateJson(responseData: Array<any>, isEdit): any {
    let fileMaxSizeFlag = false;
    if (responseData && responseData.length) {
      responseData.forEach( e=> fileMaxSizeFlag = ['manualAssignmentDelivery', 'manualAssignmentAttachment'].includes(e?.category));
    }
    const data = {
      layout: [
        {
          id: 'inquiry',
          type: 'ATHENA_TABLE',
          schema: 'inquiry',
          editable: true,
          checkbox: responseData[0]?.category !== 'manualAssignmentDelivery_PLM',
          operations: [],
          setting: {
            hideDefaultToolbar: ['setting', 'composite-sort']
          },
          columnDefs: [
            {
              headerName: this.translateService.instant('dj-default-任务名称'),
              description: '',
              operations: [],
              columns: [
                {
                  schema: 'task_name',
                  headerName: this.translateService.instant('dj-default-任务名称'),
                  dataType: 'string',
                  sortable: true,
                  filterable: true,
                  rowGroupable: true,
                  tagDefinitions: [
                    {
                      code: 'TYPE_STRING',
                      name: this.translateService.instant('dj-pcc-数据组件'),
                      description: this.translateService.instant('dj-pcc-数据组件'),
                      category: 'DATATYPE',
                      interpreterServiceName: 'typeStringTagInterpreter',
                      customize: false,
                      themeMapTag: {
                        id: 802020055,
                        name: 'xxxx',
                        code: 'UNEDITABLE',
                        category: 'BUSINESS',
                        uiBotCode: 'UNEDITABLE',
                      },
                    },
                  ],
                  operations: [],
                },
              ],
            },
            {
              headerName: this.translateService.instant('dj-default-档案类型'),
              description: '',
              operations: [],
              columns: [
                {
                  schema: 'categoryName',
                  headerName: this.translateService.instant('dj-default-档案类型'),
                  dataType: 'string',
                  sortable: true,
                  filterable: true,
                  rowGroupable: true,
                  tagDefinitions: [
                    {
                      code: 'TYPE_STRING',
                      name: this.translateService.instant('dj-pcc-数据组件'),
                      description: this.translateService.instant('dj-pcc-数据组件'),
                      category: 'DATATYPE',
                      interpreterServiceName: 'typeStringTagInterpreter',
                      customize: false,
                      themeMapTag: {
                        id: 802020055,
                        name: 'xxxx',
                        code: 'UNEDITABLE',
                        category: 'BUSINESS',
                        uiBotCode: 'UNEDITABLE',
                      },
                    },
                  ],
                  operations: [],
                },
              ],
            },
            {
              headerName: this.translateService.instant('dj-default-档案名称'),
              description: '',
              operations: [],
              columns: responseData[0]?.category === 'manualAssignmentDelivery_PLM' ? [{
                type: 'pcc_deliverable',
                // description: 'PLM交付物',
                isCustomize: true,
              }] : [
                {
                  type: 'FILE_UPLOAD',
                  schema: 'attachment1',
                  headerName: this.translateService.instant('dj-default-档案名称'),
                  dataType: 'string',
                  filterable: true,
                  tagDefinitions: [
                    {
                      code: 'BUSINESS_ATTACHMENT_FILE',
                      name: this.translateService.instant('dj-pcc-附件'),
                      description: this.translateService.instant('dj-pcc-附件'),
                      category: 'BUSINESS',
                      interpreterServiceName: 'attachmentFileInterpreter',
                      customize: false,
                    },
                  ],
                  operations: [],
                  attribute: {
                    // type: 'DMC',
                    // 是否可以继续上传文件
                    // disabled 为false并且 attribute.uploadEnable 为true并且已上传的文件小于fileCount数量
                    uploadEnable: isEdit,
                    editable: true,
                    uploadCategory: 'reply_quotation_task', // 临时类型
                    fileCount: 3,
                    operations: [
                      {
                        actionParas: [
                          { type: 'VARIABLE', value: 'id', key: 'id' },
                          { type: 'VARIABLE', value: 'name', key: 'name' },
                          { type: 'VARIABLE', value: 'rowDataKey', key: 'rowDataKey' },
                          { type: 'VARIABLE', value: 'category', key: 'category' },
                          { type: 'VARIABLE', value: 'categoryId', key: 'categoryId' },
                          { type: 'VARIABLE', value: 'size', key: 'size' },
                        ],
                        paras: {
                          tenantId: 'E10ATHENA',
                          projectId: 'task_purchaseInquiryForQuotation',
                          taskId: 'reply_quotation_task', // 临时类型
                        },
                        type: 'upload',
                      },
                      {
                        actionParas: [
                          { type: 'VARIABLE', value: 'id', key: 'id' },
                          { type: 'VARIABLE', value: 'category', key: 'category' },
                          { type: 'VARIABLE', value: 'categoryId', key: 'categoryId' },
                        ],
                        paras: {
                          tenantId: 'E10ATHENA',
                          projectId: 'task_purchaseInquiryForQuotation',
                          taskId: 'reply_quotation_task', // 临时类型
                        },
                        type: 'delete',
                      },
                    ],
                    // 档案类型=交付物，category=manualAssignmentDelivery，调整上传文件的上限是100MB
                    fileMaxSize: fileMaxSizeFlag ? 104857600 : 52428800,
                    // 下载功能
                    // attribute?.readEnable 为true并且 attribute?.readCategory 目录包括 item.category 里面的目录
                    readEnable: true,
                    readCategory: [
                      'pcc_project_status_change', // 状态变更附件
                      'manualAssignmentDelivery',
                      'manualAssignmentAttachment',
                      'mohDeliverable',
                      'mohAttachment',
                      'athena_LaunchSpecialProject_create',
                      'manualAssignmentSampleDelivery',
                      'pcc_wbs_planChanges',
                      'pcc_project_change_task',
                      'reply_quotation_task', // 临时类型
                    ],
                    // 删除功能
                    // (1) 正在上传的文件可删除
                    // (2) disabled 为false 并且 attribute.deleteEnable 为true 并且 deleteCategory.deleteCategory
                    // 目录包括 item.category 里面的目录 并且 (attribute.onlyDeleteByOwner字段存在且为false 或者文件是自己上传的
                    //   => { uploadUserId为空或者uploadUserId===userId} )
                    deleteCategory: [
                      'manualAssignmentDelivery',
                      'manualAssignmentAttachment',
                      'mohDeliverable',
                      'mohAttachment',
                      'athena_LaunchSpecialProject_create',
                      'manualAssignmentSampleDelivery',
                      'reply_quotation_task', // 临时类型
                    ],
                    id: '9854a0d3-38cb-46d1-a16a-037952943ca8',
                    deleteEnable: isEdit,
                  },
                },
              ],
            },
          ],
          details: [],
        },
      ],
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
        {
          schema: 'attachment1',
          path: 'inquiry',
          key: 'disabled',
          trigger: {
            condition:
              'currentControl.parent.get("category").value === "pcc_project_status_change"',
          },
        },
      ],
      style: {},
    };
    return data;
  }
}
