/**
 * 任务模板开窗service
 */
import { Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/implementation/service/common.service';
import { observable, Observable } from 'rxjs';
import { ITaskTemplate } from '../types/task-template';
import { DwUserService } from '@webdpt/framework/user';
import { DynamicWbsService } from '../../wbs/wbs.service';

@Injectable()

export class TaskTemplateService {
  hasT100: boolean = false;

  constructor(
    public commonService: CommonService,
    public translateService: TranslateService,
    public openWindowService: OpenWindowService,
    private fb: FormBuilder,
    private userService: DwUserService,
    public wbsService: DynamicWbsService,
  ) { }

  /**
   * 存在T100的任务，hasT100=true
   */
  getTenantProductOperationList(): void {
    const tenantId = this.userService.getUser('tenantId');
    this.wbsService.getTenantProductOperationList(tenantId).subscribe(
      (res: any) => {
        // prod_name：产品别
        this.hasT100 = res.prod_eoc_mapping.filter(item => { return item.prod_name === 'T100'; }).length > 0;
      },
      (error) => { }
    );
  }

  /**
   * 任务类型开窗
   * 选择任务模板开窗
   * @returns
   */
  openChooseTaskTemplate(openWindowDefine: any): Observable<ITaskTemplate> {
    openWindowDefine.executeContext['openWindow'] = true; // 可控制列表展示列，roleAttention
    const roleAttention = [
      'task_template_parameter_name','task_category','eoc_company_id','item_operator','item_condition_value',
      'is_doc_date','is_confirm_date','is_project_no','complete_rate_method','is_need_doc_no','item_type_name','item_type_value',
      'user_defined01', 'user_defined02', 'user_defined03','doc_condition_value_info'
    ];
    if (this.hasT100) {
      roleAttention.splice(9, 0, 'is_task_no');
    }
    return new Observable(observable => {
      const operations = [
        {
          title: this.translateService.instant('dj-default-选择任务模板'),
          description: this.translateService.instant('dj-default-建议人工处理'),
          operate: 'openwindow',
          openWindowDefine: {
            title: this.translateService.instant('dj-default-选择任务模板'),
            selectedFirstRow: false,
            multipleSelect: false,
            rowSelection: 'single',
            allAction: {
              defaultShow: false,
              dataSourceSet: openWindowDefine.dataSourceSet,
              executeContext: openWindowDefine.executeContext,
            },
            roleAttention,
            buttons: [
              {
                title: this.translateService.instant('dj-default-确定'),
                actions: [
                  {
                    category: 'UI',
                    backFills: [
                      { key: 'task_category', valueScript: "selectedObject['task_category']" },
                      { key: 'parameter_name', valueScript: "selectedObject['task_template_parameter_name']" },
                      { key: 'parameter_no', valueScript: "selectedObject['task_template_parameter_no']" },
                      { key: 'eoc_company_id', valueScript: "selectedObject['eoc_company_id']" },
                      { key: 'eoc_site_id', valueScript: "selectedObject['eoc_site_id']" },
                      { key: 'eoc_region_id', valueScript: "selectedObject['eoc_region_id']" },
                      {
                        key: 'doc_condition_value',
                        valueScript: "selectedObject['doc_condition_value']",
                      },
                      {
                        key: 'doc_condition_value_info',
                        valueScript: "selectedObject['doc_condition_value_info']",
                      },
                      { key: 'item_type', valueScript: "selectedObject['item_type']" },
                      { key: 'item_type_value', valueScript: "selectedObject['item_type_value']" },
                      { key: 'item_operator', valueScript: "selectedObject['item_operator']" },
                      {
                        key: 'item_condition_value',
                        valueScript: "selectedObject['item_condition_value']",
                      },
                      { key: 'doc_type_no', valueScript: "selectedObject['doc_type_no']" },
                      { key: 'doc_no', valueScript: "selectedObject['doc_no']" },
                      {
                        key: 'type_condition_value',
                        valueScript: "selectedObject['type_condition_value']",
                      },
                      {
                        key: 'sub_type_condition_value',
                        valueScript: "selectedObject['sub_type_condition_value']",
                      },
                      {
                        key: 'outsourcing_condition_value',
                        valueScript: "selectedObject['outsourcing_condition_value']",
                      },
                      { key: 'is_doc_date', valueScript: "selectedObject['is_doc_date']" },
                      { key: 'is_confirm_date', valueScript: "selectedObject['is_confirm_date']" },
                      { key: 'is_project_no', valueScript: "selectedObject['is_project_no']" },
                      { key: 'is_task_no', valueScript: "selectedObject['is_task_no']" },
                      {
                        key: 'complete_rate_method',
                        valueScript: "selectedObject['complete_rate_method']",
                      },
                      // [spring 3.0] type_field_code ==> user_defined01，自定义条件1
                      { key: 'user_defined01', valueScript: "selectedObject['user_defined01']" },
                      // [spring 3.0] sub_type_field_code ==> user_defined02，自定义条件2
                      { key: 'user_defined02', valueScript: "selectedObject['user_defined02']" },
                      // [spring 3.0] outsourcing_field_code ==> user_defined03，自定义条件3
                      { key: 'user_defined03', valueScript: "selectedObject['user_defined03']" },
                      { key: 'is_need_doc_no', valueScript: "selectedObject['is_need_doc_no']" },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ];
      const selectRow = this.fb.group({ task_template_no: [''] });
      this.openWindowService.openWindow(selectRow, operations, [], '', '', (res: Array<any>) => {
        observable.next(res[0]);
      });
    });
  }

  /**
   *
   */
  checkAuthEmployeeInfo(item): Observable<boolean> {
    // sprint4.5 auth.employee.info.check==>bm.pisc.auth.employee.info.check
    return new Observable(observable => {
      this.commonService.getInvData('bm.pisc.auth.employee.info.check', {
        employee_info: [{ employee_no: item.id, employee_name: item.name }],
      });
      observable.next();
    });
  }
}
