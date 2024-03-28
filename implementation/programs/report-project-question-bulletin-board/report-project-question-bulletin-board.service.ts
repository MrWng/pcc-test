import { Injectable } from '@angular/core';
import { CommonService } from '../../service/common.service';
import '../../plugins/export.dhtmlx.js';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class ReportProjectQuestionService {

  constructor(
    private commonService: CommonService,
    protected translateService: TranslateService
  ) { }

  templateJson(data, model) {
    return {
      layout: [
        {
          id: 'project_question_data',
          type: 'ATHENA_TABLE',
          schema: 'project_question_data',
          editable: true,
          dataType: 'array',
          setting: {
            hideDefaultToolbar: ['composite-sort'],
            // defaultSetting: true,
            // groupSummary: null,
            // options: [
            //   {
            //     platform: 'webplatform',
            //     schema: 'question_no',
            //     title: this.translateService.instant('dj-pcc-问题编号'),
            //     type: 'group',
            //     value: 'question_no'
            //   }
            // ]
          },
          operations: [
            {
              title: 'image-indicative-information',
              type: 'custom_images_indicative_information_component',
              description: 'image-indicative-information',
              isCustomize: true,
              pccContent: data,
              pccContents: data,
              attach: {
                target: 'project_question_info',
                mode: 'all',
              },
            }
          ],
          checkbox: false,
          columnDefs: [
            {
              headerName: ' ',
              description: '',
              level: 0,
              operations: [],
              maxWidth: 10,
              width: 10,
              columns: [
                {
                  type: 'custom_images_ipilot_lamp_component',
                  isCustomize: true,
                  maxWidth: 10,
                  width: 10,
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                }
              ],
              suppressMovable: true,
              pinned: 'left',
            },
            {
              headerName: this.translateService.instant('dj-pcc-问题编号'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 115,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'question_no',
                  headerName: this.translateService.instant('dj-pcc-问题编号'),
                  path: 'project_question_data',
                  level: 0,
                  disabled: true,
                  editable: false,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  tagDefinitions: [
                    {
                      code: 'TYPE_STRING',
                      name: '数据组件',
                      description: '数据组件',
                      category: 'DATATYPE',
                      interpreterServiceName: 'typeStringTagInterpreter',
                      customize: false,
                      themeMapTag: {
                        id: 801000001,
                        name: 'XXXX',
                        code: 'ORDER_1',
                        category: 'ORDER',
                        value: '1',
                        uiBotCode: 'ORDER'
                      },
                      append: false
                    }
                  ],
                  width: 150,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-问题描述'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 400,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'question_description',
                  headerName: this.translateService.instant('dj-pcc-问题描述'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 400,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-问题类型'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'question_type_name',
                  headerName: this.translateService.instant('dj-pcc-问题类型'),
                  path: 'project_question_data',
                  level: 0,
                  disabled: false,
                  sortable: false,
                  filterable: false,
                  rowGroupable: false,
                  editable: false,
                  dataType: 'string',
                  width: 140,
                  important: false,
                  isNavigate: false,
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-问题提出人'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'initiator_name',
                  headerName: this.translateService.instant('dj-pcc-问题提出人'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-问题负责人'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'process_person_name',
                  headerName: this.translateService.instant('dj-pcc-问题负责人'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-发生日期'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'question_happen_datetime',
                  headerName: this.translateService.instant('dj-pcc-发生日期'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  important: false,
                  isNavigate: false,
                  width: 140,
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-期望关闭日期'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'desire_finish_datetime',
                  headerName: this.translateService.instant('dj-pcc-期望关闭日期'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-实际关闭日期'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'actual_finish_datetime',
                  headerName: this.translateService.instant('dj-pcc-实际关闭日期'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-default-项目编号'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'project_no',
                  headerName: this.translateService.instant('dj-default-项目编号'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-default-项目名称'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'project_name',
                  headerName: this.translateService.instant('dj-default-项目名称'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-pcc-任务'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'LABEL',
                  schema: 'task_name',
                  headerName: this.translateService.instant('dj-pcc-任务'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-default-状态'),
              path: 'project_question_data',
              level: 0,
              description: '',
              operations: [],
              width: 140,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'SELECT',
                  schema: 'status',
                  headerName: this.translateService.instant('dj-default-状态'),
                  path: 'project_question_data',
                  level: 0,
                  dataType: 'string',
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  width: 140,
                  important: false,
                  isNavigate: false,
                  editor: {
                    id: 'abf63757-1427-4c53-b315-141135c52981',
                    type: 'SELECT',
                    schema: 'status',
                    dataType: 'string',
                    editable: false,
                    disabled: true,
                    important: false,
                    options: [
                      // 1.已提醒；2.待处理；3.验收中；4.退回重办；5.待指派；6.指定结案；7.已转派；99.已完成
                      {
                        title: this.translateService.instant('dj-pcc-已提醒'),
                        value: '1'
                      },
                      {
                        title: this.translateService.instant('dj-pcc-待处理'),
                        value: '2'
                      },
                      {
                        title: this.translateService.instant('dj-pcc-验收中'),
                        value: '3'
                      },
                      {
                        title: this.translateService.instant('dj-pcc-退回重办'),
                        value: '4'
                      },
                      {
                        title: this.translateService.instant('dj-pcc-待指派'),
                        value: '5'
                      },
                      {
                        title: this.translateService.instant('dj-pcc-指定结案'),
                        value: '6'
                      },
                      {
                        title: this.translateService.instant('dj-pcc-已转派'),
                        value: '7'
                      },
                      {
                        title: this.translateService.instant('dj-pcc-已完成'),
                        value: '99'
                      }
                    ],
                    isNavigate: false
                  }
                }
              ],
              suppressMovable: true,
              headers: [],
              isUserDefined: false
            },
            {
              headerName: this.translateService.instant('dj-default-操作'),
              level: 0,
              description: '',
              operations: [],
              width: 110,
              important: false,
              isNavigate: false,
              columns: [
                {
                  type: 'question_row_detail_info',
                  schema: 'UIBOT_BUTTON_GROUP',
                  headerName: this.translateService.instant('dj-default-操作'),
                  important: false,
                  isNavigate: false,
                  sortable: false,
                  filterable: false,
                  rowGroupable: true,
                  useType : 'default',
                  pageReadonly: true,
                  pageType: '1',
                  parentModel: model,
                  isCustomize: true
                }
              ],
              headers: [],
              pinned: 'right',
              isUserDefined: false
            }
          ],
          details: [],
          allFields: [
            {
              name: 'question_no',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题编号'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'question_description',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题描述'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'question_type_no',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题类型编号'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: false
            },
            {
              name: 'question_type_name',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题类型'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'initiator_no',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题提出人编号'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: false
            },
            {
              name: 'nitiator_name',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题提出人'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'process_person_no',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题负责人编号'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: false
            },
            {
              name: 'process_person_name',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-问题负责人'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'question_happen_datetime',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-发生日期'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'desire_finish_datetime',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-期望关闭日期'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'actual_finish_datetime',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-实际关闭日期'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'project_no',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-default-项目编号'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'project_name',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-default-项目名称'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'task_name',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-pcc-任务'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
            {
              name: 'status',
              path: 'project_question_data',
              headerName: this.translateService.instant('dj-default-状态'),
              level: 0,
              defaultValue: '',
              dataType: 'string',
              isDataKey: false,
              isShow: true
            },
          ],
          pageDataKeys: {
            project_question_data: ['question_no', 'question_type_no', 'project_no']
          },
          queryInfo: {
            pageInfo: {
              hasNext: false,
              pageNo: 1,
              pageSize: 20,
              totalResults: data.length
            },
            target_schema: 'project_question_data',
            dataSourceSet: {}
          },
          statusFlag: false,
          saveColumnsWidth: true,
          disabledUserDefined: true,
        }
      ],
      style: {},
      rules: [
        {
          schema:'question_no',
          path:'project_question_data',
          key:'required'
        },
        {
          schema:'question_description',
          path:'project_question_data',
          key:'required'
        },
        {
          schema:'status',
          path:'project_question_data',
          key:'required'
        }
      ],
      pageData: {
        project_question_data: data
      },
      content: {
        pattern: 'DATA_ENTRY',
        category: 'SIGN-DOCUMENT',
        executeContext: model?.content?.executeContext ?? {},
      },
      pageDataKeys: {
        project_question_data: ['question_no', 'question_type_no', 'project_no']
      },
      actions: [],
      executeContext: model?.content?.executeContext ?? {},
      pageCountSize: 20
    };
  }

}
