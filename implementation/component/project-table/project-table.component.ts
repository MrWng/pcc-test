import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { ProjectTableService } from './project-table.service';
import { TaskWbsListService } from '../../programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
import { ProjectTableOptionsComponent } from '../project-table-options/project-table-options.component';
import { TaskStatusComponent } from '../task-status/task-status.component';
import { PersonInChargeComponent } from '../person-in-charge/person-in-charge.component';
import { WorkloadQtyComponent } from '../workload-qty/workload-qty.component';
import { CellCheckBoxComponent } from '../cell-checkBox/cell-checkBox.component';
import { CellDatePickerComponent } from '../cell-date-picker/cell-date-picker.component';
import { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import {
  AcCellDatePickerComponent,
  AcCellEmployeeTreeSelectComponent,
  AcTableCellCascadeComponent,
  AcTableCellInputComponent,
} from '@app-custom/ui/ac-table-cell';
import { FormControl, FormGroup } from '@angular/forms';
import { DynamicFormService, isNotEmpty } from '@athena/dynamic-core';
import { DynamicComponentRenderForAthTableService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { ButtonType } from '../add-subproject-card/add-subproject-card.interface';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { DynamicWbsService } from '../wbs/wbs.service';
import * as moment from 'moment';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { DwLanguageService } from '@webdpt/framework/language';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { NzMessageService } from 'ng-zorro-antd/message';
import { APIService } from '../../service/api.service';
import { ModalFormService } from '@app-custom/ui/modal-form';
import { message } from 'ag-grid-community/dist/lib/utils/general';

const FROM_GROUP_KEY = 'company_check';
export interface CustomIcon {
  name: string;
  fieldid: string;
  onClick?: Function;
}
@Component({
  selector: 'app-project-table',
  templateUrl: './project-table.component.html',
  styleUrls: ['./project-table.component.less'],
  providers: [ProjectTableService, TaskWbsListService, ModalFormService],
})

/**
 * 项目计划维护
 */
export class ProjectTableComponent implements OnInit, OnChanges, OnDestroy {
  // wbs入口
  frameworkComponents: any = {
    inputCell: AcTableCellInputComponent,
    cascade: AcTableCellCascadeComponent,
    datePickerCell: AcCellDatePickerComponent,
    employeeTreeSelectCell: AcCellEmployeeTreeSelectComponent,
    'project-table-options': ProjectTableOptionsComponent,
    'task-status': TaskStatusComponent,
    'person-in-charge': PersonInChargeComponent,
    'workload-qty': WorkloadQtyComponent,
    'cell-checkBox': CellCheckBoxComponent,
    'cell-date-picker': CellDatePickerComponent,
  };
  @Input() pageDatas;
  @Input() source;
  @Input() signOff: boolean = false;
  @Input() showAddIcon: boolean = true;
  @Input() personList;
  @Input() editable;
  @Input() root_task_card = {
    // 协同一级计划任务卡信息
    root_task_no: '', // 根任务卡编号
    schedule_status: '', // 协助计划排定状态
    assist_schedule_seq: '', // 协助排定计划序号
  };
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();
  @ViewChild('customIconTemplate', { static: true }) customIconTemplate: ElementRef;
  @ViewChild('changeReason') changeReason: any;
  // @ts-ignore
  dataSource;
  // 表格column
  columnDefs: ColDef[] | any[] = [];
  projectFormGroup;

  projectSubscribe: Subscription;
  tableEdit: Boolean = true;
  nodes = [];
  changeTimer;
  noTriggerChange: Boolean = false;
  loading: boolean = false;
  nowUpdateValues: any;
  pageDataList: any = [];
  // 变更状态
  change_status: string;
  // 原任务状态
  old_task_status: string;
  // 是否重推卡
  isSynTaskCard: boolean = true;

  constructor(
    protected dynamicFormService: DynamicFormService,
    public dynamicComponentRenderForAthTableService: DynamicComponentRenderForAthTableService,
    public commonService: CommonService,
    private translateService: TranslateService,
    public addSubProjectCardService: AddSubProjectCardService,
    public wbsService: DynamicWbsService,
    protected changeRef: ChangeDetectorRef,
    public wbsTabsService: WbsTabsService,
    private languageService: DwLanguageService,
    public athMessageService: AthMessageService,
    public projectTableService: ProjectTableService,
    private messageService: NzMessageService,
    private apiService: APIService,
    private taskWbsListService: TaskWbsListService
  ) {}

  ngOnInit() {
    if (this.source === Entry.collaborate) {
      this.addSubProjectCardService.getDateCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loading = false;
    this.noTriggerChange = false;
    if (changes.pageDatas?.currentValue) {
      if (this.source === Entry.card) {
        this.commonService
          .getProjectChangeStatus(this.wbsService.project_no, ['1', '2', '4', '5'], '2')
          .subscribe(
            (resChange: any): void => {
              if (!resChange.data?.project_info[0]?.check_result) {
                this.tableEdit = false;
              }
              setTimeout(() => {
                this.initData(changes.pageDatas?.currentValue);
              }, 0);
            },
            (error) => {
              this.initData(changes.pageDatas?.currentValue);
            }
          );
      } else {
        this.initData(changes.pageDatas?.currentValue);
      }
    } else if (changes.personList?.currentValue) {
      this.initData(this.pageDatas);
    }
    if (this.source === Entry.collaborate) {
      const schedule_status = this.root_task_card.schedule_status;
      const nowStatus = schedule_status && schedule_status !== '1' ? false : this.editable;
      if (this.tableEdit !== nowStatus) {
        this.tableEdit = nowStatus;
        this.initData(this.pageDatas);
      }
    }
  }

  // 转换负责人和执行人树形数据格式
  transformTreeData(sourceDatas) {
    // 根据role_name做一级分类
    const roleArray = [];
    sourceDatas.forEach((data) => {
      const { role_name, role_no, department_name, department_no, employee_name, employee_no } =
        data;
      const filterRole = roleArray.filter((role) => role.title === data.role_name);
      const employeeKey = `${
        role_no || role_name
      }/${department_no}/${employee_no}/${employee_name}`;
      const departmentKey = `${role_no || role_name}/${department_no}`;
      if (filterRole.length === 0) {
        roleArray.push({
          title: role_name,
          key: role_no || role_name,
          disabled: true,
          children: [
            {
              title: department_name,
              key: departmentKey,
              disabled: true,
              children: [
                {
                  title: employee_name,
                  key: employeeKey,
                  department_name,
                  role_name,
                  isLeaf: true,
                },
              ],
            },
          ],
        });
      } else {
        const roleChildren = filterRole[0].children;
        const filterDepartment = roleChildren.filter(
          (department) => department.key === departmentKey
        );
        if (filterDepartment.length === 0) {
          roleChildren.push({
            title: department_name,
            key: departmentKey,
            disabled: true,
            children: [
              {
                title: employee_name,
                key: employeeKey,
                department_name,
                role_name,
                isLeaf: true,
              },
            ],
          });
        } else {
          const departmentChildren = filterDepartment[0].children;
          const filterEmployee = departmentChildren.filter(
            (employee) => employee.key === employeeKey
          );
          if (filterEmployee.length === 0) {
            departmentChildren.push({
              title: employee_name,
              key: employeeKey,
              department_name,
              role_name,
              isLeaf: true,
            });
          }
        }
      }
    });
    return roleArray;
  }

  // 任务数据判断是否可编辑
  taskDisableEdit() {
    if (this.source === Entry.projectChange) {
      return [
        {
          schema: 'task_name',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!(Number(data.old_task_status) === 20) || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'liable_person_code_key',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || (["PLM"].includes(data.task_category) && data.designStatus && data.designStatus !== "notStart") || ((["PLM"].includes(data.task_category) && data.designStatus) ? false : !!(Number(data.old_task_status) === 20)) || !${this.tableEdit} || (!data.isCollaborationCard && data.isCollaborationCardTrue)`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'task_member_info_key',
          linkageSchemas: ['liable_person_code_key'],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || ["PLM_PROJECT","ASSC_ISA_ORDER","PCM"].includes(data.task_category) ||
          !data.liable_person_code_key || data.designStatus === "completed" || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_start_date',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!(Number(data.old_task_status) === 20) || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_finish_date',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'workload_qty',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_work_hours',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'is_approve',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!["PLM", "PLM_PROJECT", "PCM", "ASSC_ISA_ORDER", "PO_NOT_KEY"].includes(data.task_category) || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'is_attachment',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
      ];
    } else if (this.source === Entry.card) {
      return [
        {
          schema: 'task_name',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!(Number(data.task_status) === 20) || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'liable_person_code_key',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || (["PLM"].includes(data.task_category) && data.designStatus && data.designStatus !== "notStart") || ((["PLM"].includes(data.task_category) && data.designStatus) ? false : !!(Number(data.task_status) === 20)) || !${this.tableEdit} || (!data.isCollaborationCard && data.isCollaborationCardTrue)`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'task_member_info_key',
          linkageSchemas: ['liable_person_code_key'],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || ["PLM_PROJECT","ASSC_ISA_ORDER","PCM"].includes(data.task_category) ||
          !data.liable_person_code_key || data.designStatus === "completed" || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_start_date',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!(Number(data.task_status) === 20) || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_finish_date',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'workload_qty',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_work_hours',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'is_approve',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!["PLM", "PLM_PROJECT", "PCM", "ASSC_ISA_ORDER", "PO_NOT_KEY"].includes(data.task_category) || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'is_attachment',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCardTrue`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
      ];
    } else if (this.source === Entry.collaborate) {
      return [
        {
          schema: 'plan_start_date',
          path: 'company_check',
          validatorType: 'error',
          errorMessage: '采购数量不可超过采购剩余数量！',
          trigger: {
            condition: 'console.log(data)',
          },
          key: 'custom',
        },
        {
          schema: 'task_name',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!(Number(data.task_status) === 20) || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'liable_person_code_key',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || (["PLM"].includes(data.task_category) && data.designStatus && data.designStatus !== "notStart") || ((["PLM"].includes(data.task_category) && data.designStatus) ? false : !!(Number(data.task_status) === 20)) || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'task_member_info_key',
          linkageSchemas: ['liable_person_code_key'],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || ["PLM_PROJECT","ASSC_ISA_ORDER","PCM"].includes(data.task_category) ||
          !data.liable_person_code_key || data.designStatus === "completed" || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_start_date',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!(Number(data.task_status) === 20) || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_finish_date',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'workload_qty',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'plan_work_hours',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'is_approve',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !!["PLM", "PLM_PROJECT", "PCM", "ASSC_ISA_ORDER", "PO_NOT_KEY"].includes(data.task_category) || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
        {
          schema: 'is_attachment',
          linkageSchemas: [],
          path: 'company_check',
          trigger: {
            condition: `!data.canEdit || !${this.tableEdit} || data.isCollaborationCard`,
            type: 'sync',
            point: 'default',
          },
          key: 'disabled',
        },
      ];
    }
  }

  getRules() {
    return [
      {
        schema: 'task_name',
        path: 'company_check',
        condition: 'true',
        linkageSchemas: [],
        // scope: 'EDIT',
        errorMessage: this.translateWordPcc('任务名称不可空白'),
        trigger: {},
        key: 'required',
      },
      {
        schema: 'task_name',
        path: 'company_check',
        linkageSchemas: [],
        // scope: 'EDIT',
        errorMessage: this.translateWordPcc('存在非法字符'),
        trigger: {
          condition:
            '/[^a-zA-Z0-9\\u4E00-\\u9FA5_＿－\\-（）()[\\]［］【】&＆+＋.．、,，\\s]/g.test(data.task_name)',
          type: 'sync',
          point: 'default',
        },
        key: 'custom',
      },
      {
        schema: 'task_name',
        path: 'company_check',
        linkageSchemas: [],
        // scope: 'EDIT',
        errorMessage: this.translateWordPcc('存在非法字符'),
        trigger: {
          condition: '/^\\s+|\\s+$/g.test(data.task_name)',
          type: 'sync',
          point: 'default',
        },
        key: 'custom',
      },
      {
        schema: 'liable_person_code_key',
        path: 'company_check',
        linkageSchemas: [],
        // scope: 'EDIT',
        errorMessage: this.translateWordAll('不能为空'),
        trigger: {
          condition: `!data.liable_person_code_key && (!!(Number(data.task_status) === 20) || !!data.isCollaborationCardTrue)`,
          type: 'sync',
          point: 'dataChanged',
        },
        key: 'custom',
      },
      {
        schema: 'liable_person_code_key',
        path: 'company_check',
        condition: 'true',
        linkageSchemas: [],
        // scope: 'EDIT',
        errorMessageExpression: 'data.error_msg',
        trigger: {
          condition: `!!data.error_msg`,
          type: 'async',
          point: 'dataChanged',
          apiUrl: '/api/atdm/v1/data/query/by/actionId',
          apiPrefixType: 'atdmUrl',
          parameterScript: `return {
        executeContext,
        businessUnit:executeContext?.businessUnit,
        actionId:\'bm.pisc.auth.employee.info.check\',
        parameter:{
        employee_info: ["PLM_PROJECT","ASSC_ISA_ORDER"].includes(rowData.task_category)?
        []:[{employee_no:rowData.liable_person_code_key?.split(\'/\')[2],employee_name:rowData.liable_person_code_key?.split(\'/\')[3]}]}
        }`,
        },
        key: 'custom',
      },
      {
        schema: 'task_member_info_key',
        path: 'company_check',
        condition: 'true',
        linkageSchemas: [],
        // scope: 'EDIT',
        errorMessageExpression: 'data.error_msg',
        trigger: {
          condition: `!!data.error_msg`,
          type: 'async',
          point: 'dataChanged',
          apiUrl: '/api/atdm/v1/data/query/by/actionId',
          apiPrefixType: 'atdmUrl',
          actionId: 'bm.pisc.auth.employee.info.check',
          parameterScript: `const employee_info = ["PLM","PLM_PROJECT","ASSC_ISA_ORDER"].includes(rowData.task_category)?[]:
        rowData?.task_member_info_key?.map(info=>{return {employee_no: info.split(\'/\')[2],employee_name: info.split(\'/\')[3]}});
        return {
        executeContext,
        businessUnit:executeContext?.businessUnit,
        actionId:\'bm.pisc.auth.employee.info.check\',
        parameter:{employee_info}}`,
        },
        key: 'custom',
      },
      {
        schema: 'task_member_info_key',
        path: 'company_check',
        linkageSchemas: [],
        // scope: 'EDIT',
        errorMessage: this.translateWordPcc('不能删除或更换执行人，只能新增'),
        trigger: {
          condition:
            '((["PLM"].includes(data.task_category) && data.designStatus && data.designStatus !== "notStart") || ((["PLM"].includes(data.task_category) && data.designStatus) ? false : !!(Number(data.task_status) === 20))) && (currentControl._oldValue.length > 0 && !currentControl._oldValue?.every(item => currentControl.value?.includes(item)))',
          type: 'sync',
          point: 'dataChanged',
        },
        key: 'custom',
      },
      {
        schema: 'task_member_info_key',
        path: 'company_check',
        condition: 'true',
        linkageSchemas: ['liable_person_code_key'],
        // scope: 'EDIT',
        errorMessage: this.translateWordPcc('负责人与执行人有重复'),
        trigger: {
          condition: `!!data.liable_person_code_key && data.task_member_info_key?.includes(data.liable_person_code_key)`,
          type: 'sync',
          point: 'default',
        },
        key: 'custom',
      },
      {
        schema: 'liable_person_code_key',
        path: 'company_check',
        condition: 'true',
        linkageSchemas: ['task_member_info_key'],
        // scope: 'EDIT',
        errorMessage: this.translateWordPcc('负责人与执行人有重复'),
        trigger: {
          condition: `!!data.liable_person_code_key && data.task_member_info_key?.includes(data.liable_person_code_key)`,
          type: 'sync',
          point: 'default',
        },
        key: 'custom',
      },
      {
        schema: 'plan_start_date',
        path: 'company_check',
        condition: 'true',
        // scope: 'EDIT',
        // errorMessage: this.translateService.instant(
        //   `dj-pcc-开始日期不可早于任务内一级计划的开始日期(API-95的原根任务预计开始日期)`
        // ),
        errorMessageExpression: `(function (currentControl, m) {
          const { _startDateErrorInfo, root_task_plan_start_date } = currentControl.parent.getRawValue();
          return _startDateErrorInfo + '(' + m(root_task_plan_start_date).format('YYYY-MM-DD') + ')！'
        })(currentControl, moment)`,
        globalParameter: { a: 1 },
        trigger: {
          condition: `(function (currentControl, utils, moment) {
            if(!currentControl.valueIsChanged) {
              return false
            }
            const { root_task_plan_start_date, plan_start_date,  dateCheck,is_root_task, isCollaborate } = currentControl.parent.getRawValue();
            const { isNotEmpty } = utils;
            if (
              isCollaborate &&
              !is_root_task &&
              isNotEmpty(root_task_plan_start_date) &&
              isNotEmpty(plan_start_date) &&
              dateCheck === '1' &&
              moment(plan_start_date).format('YYYY-MM-DD') <
                moment(root_task_plan_start_date).format('YYYY-MM-DD')
            ) {
              return true
            }
            return false
          })(currentControl, utils, moment)`,
          type: 'sync',
          point: 'default',
        },
        key: 'custom',
      },
      {
        schema: 'plan_finish_date',
        path: 'company_check',
        condition: 'true',
        // scope: 'EDIT',
        errorMessageExpression: `(function (currentControl, m) {
          const { _endDateErrorInfo, root_task_plan_finish_date } = currentControl.parent.getRawValue();
          return _endDateErrorInfo + '(' + m(root_task_plan_finish_date).format('YYYY-MM-DD') + ')！'
        })(currentControl, moment)`,
        trigger: {
          condition: `(function (currentControl, utils, moment) {
            if(!currentControl.valueIsChanged) {
              return false
            }
            const { root_task_plan_finish_date, plan_finish_date,  dateCheck, is_root_task, isCollaborate } = currentControl.parent.getRawValue();
            const { isNotEmpty } = utils;
            if (
              isCollaborate &&
              !is_root_task &&
              isNotEmpty(root_task_plan_finish_date) &&
              isNotEmpty(plan_finish_date) &&
              dateCheck === '1' &&
              moment(plan_finish_date).format('YYYY-MM-DD') >
                moment(root_task_plan_finish_date).format('YYYY-MM-DD')
            ) {
              return true
            }
            return false
          })(currentControl, utils, moment)`,
          type: 'sync',
          point: 'default',
        },
        key: 'custom',
      },
      ...this.taskDisableEdit(),
    ];
  }

  getEmployee_name = (employee_no) => {
    let employee_name = '';
    this.personList.forEach((person) => {
      if (employee_no === person.employee_no) {
        employee_name = person.employee_name;
      }
    });
    return employee_name;
  };

  // 初始化表格和数据
  initData = (pageDatas) => {
    const newNodes = this.transformTreeData(this.personList);
    this.columnDefs = [
      {
        headerName: this.translateService.instant('dj-default-任务名称'),
        field: 'task_name',
        valueType: '',
        width: 200,
        resizable: true,
        pinned: 'left',
        cellRendererParams: {
          models: [{}],
          componentType: 'cascade',
          compProps: {
            // 层级展示字段
            orgHierarchy: 'treeTablePath',
            fromGroupKey: FROM_GROUP_KEY,
            placeholder: this.translateService.instant('dj-请输入'),
            // 当前行FormGroup
            insertRow: (e, params) => {
              const { data } = params;
              const parentData: { [key: string]: any } = { ...data.controls };
              const addChild = this.isHiddenAdd(data.value);
              Object.keys(data.controls).forEach(
                (el: string) => (parentData[el] = data.controls[el].value)
              );
              if (
                (this.source === Entry.card && parentData.isCollaborationCardTrue) ||
                (this.source !== Entry.collaborate && this.wbsService.needRefresh) ||
                !addChild
              ) {
                return;
              }
              if (parentData.children.length > 0 && Number(parentData.task_status) !== 30) {
                this.addSubProjectCard(parentData).then((r) => {});
              }
              if (parentData.children.length === 0 && Number(parentData.task_status) === 10) {
                this.addSubProjectCard(parentData).then((r) => {});
              }
            },
            setValue: (e: FormControl[]) => {},
          },
        },
        headerComponentParams: {
          required: true,
        },
        headers: {
          customIconTemplate: this.customIconTemplate,
        },
      },
      {
        headerName: this.translateService.instant('dj-default-负责人'),
        field: 'liable_person_code_key',
        valueType: '',
        width: 180,
        resizable: true,
        cellRendererParams: {
          componentType: 'person-in-charge',
          compProps: {
            nzCheckable: false,
            fromGroupKey: FROM_GROUP_KEY,
            nzPlaceHolder: this.translateService.instant('dj-default-负责人'),
            nodes: newNodes,
            personList: this.personList,
            nzShowSearch: false,
          },
        },
      },
      {
        headerName: this.translateService.instant('dj-pcc-执行人'),
        field: 'task_member_info_key',
        width: 200,
        resizable: true,
        cellRendererParams: {
          componentType: 'person-in-charge',
          compProps: {
            nzCheckable: true,
            fromGroupKey: FROM_GROUP_KEY,
            nzPlaceHolder: this.translateService.instant('dj-pcc-执行人'),
            nodes: newNodes,
            personList: this.personList,
            nzShowSearch: false,
          },
        },
      },
      {
        headerName: this.translateService.instant('dj-default-工期'),
        field: 'workload_qty',
        valueType: '',
        width: 120,
        resizable: true,
        cellRendererParams: {
          /**
           * 组件的key，与frameworkComponents中的key对应
           */
          componentType: 'workload-qty',
          /**
           * 组件的属性通过compProps传入
           */
          compProps: {
            // nzPlaceHolder: this.translateService.instant('dj-请输入'),
            nzPlaceHolder: 0,
          },
        },
      },
      {
        headerName: this.translateService.instant('dj-default-预计工时'),
        field: 'plan_work_hours',
        valueType: '',
        width: 120,
        resizable: true,
        cellRendererParams: {
          /**
           * 组件的key，与frameworkComponents中的key对应
           */
          componentType: 'workload-qty',
          /**
           * 组件的属性通过compProps传入
           */
          compProps: {
            nzPlaceHolder: this.translateService.instant('dj-请输入'),
          },
        },
      },
      {
        headerName: this.translateService.instant('dj-default-单位'),
        field: 'workload_unit',
        valueType: '',
        width: 140,
        resizable: true,
        valueGetter: (params: any): any => {
          const {
            colDef: { field },
            data: formGroup,
          } = params;
          return '日';
        },
      },
      {
        headerName: this.translateService.instant('dj-default-预计开始日'),
        field: 'plan_start_date',
        valueType: '',
        width: 140,
        resizable: true,
        cellRendererParams: {
          componentType: 'cell-date-picker',
          compProps: {
            nzPlaceHolder: this.translateService.instant('dj-请输入'),
            nzFormat: 'yyyy-MM-dd',
            customDisabledDate: this.disabledStartDate,
            checkValue: this.checkValue.bind(this),
            cancelTip: () => {
              this.loading = false;
              this.noTriggerChange = false;
              this.changeRef.markForCheck();
            },
          },
        },
      },
      {
        headerName: this.translateService.instant('dj-default-预计完成日'),
        field: 'plan_finish_date',
        valueType: '',
        width: 140,
        resizable: true,
        disabled: true,
        cellRendererParams: {
          componentType: 'cell-date-picker',
          compProps: {
            nzPlaceHolder: this.translateService.instant('dj-请输入'),
            nzFormat: 'yyyy-MM-dd',
            customDisabledDate: this.disabledEndDate,
            checkValue: this.checkValue.bind(this),
            cancelTip: () => {
              this.loading = false;
              this.noTriggerChange = false;
              this.changeRef.markForCheck();
            },
          },
        },
      },
      {
        headerName: this.translateService.instant('dj-default-需要签核'),
        field: 'is_approve',
        valueType: '',
        width: 100,
        resizable: true,
        cellRendererParams: {
          /**
           * 组件的key，与frameworkComponents中的key对应
           */
          componentType: 'cell-checkBox',
          /**
           * 组件的属性通过compProps传入
           */
          compProps: {},
        },
      },
      {
        headerName: this.translateService.instant('dj-default-需要交付物'),
        field: 'is_attachment',
        valueType: '',
        width: 100,
        resizable: true,
        cellRendererParams: {
          /**
           * 组件的key，与frameworkComponents中的key对应
           */
          componentType: 'cell-checkBox',
          /**
           * 组件的属性通过compProps传入
           */
          compProps: {},
        },
      },
      {
        headerName: this.translateService.instant('dj-default-任务说明'),
        field: 'attachment_remark',
        valueType: '',
        width: 140,
        resizable: true,
        valueGetter: (params: any): any => {
          const {
            colDef: { field },
            data: formGroup,
          } = params;
          return formGroup.value[field];
        },
      },
      {
        headerName: '操作',
        field: 'actions',
        minWidth: 100,
        pinned: 'right',
        cellRendererParams: {
          /**
           * 组件的key，与frameworkComponents中的key对应
           */
          componentType: 'project-table-options',
          /**
           * 组件的属性通过compProps传入
           */
          compProps: {
            source: this.source,
            tableEdit: this.tableEdit,
            changeWbsTaskCardProportion: this.changeWbsTaskCardProportion,
            root_task_card: this.root_task_card,
          },
        },
      },
    ];
    this.transformData(pageDatas).then((r) => {
      const rules = this.getRules();
      this.projectFormGroup = this?.dynamicFormService?.buildFormGroupForCustom(
        {
          [FROM_GROUP_KEY]: this.pageDataList,
        },
        this.commonService.content,
        // @ts-ignore
        rules
      );
      // 初始化数据
      this.dataSource = this.projectFormGroup
        // @ts-ignore
        ?.get(FROM_GROUP_KEY)?.controls as unknown as FormGroup[];
      this.projectSubscribe?.unsubscribe();
      this.projectSubscribe = this.projectFormGroup.valueChanged
        .pipe(debounceTime(1000))
        .subscribe((res) => {
          setTimeout(() => this.tableChange(res), 0);
        });
      this.loading = false;
      setTimeout(() => {
        this.noTriggerChange = false;
      }, 1500);
      this.changeRef.markForCheck();
    });
  };

  // 初始化数据转换
  transformData = async (pageDatas) => {
    const newDatas = [];
    await this.flatteningData(pageDatas || [], [], newDatas);
    this.pageDataList = newDatas;
  };

  // 拉平数据，做数据处理
  async flatteningData(datas, upperPath = [], newDatas) {
    for (const data of datas) {
      data['dateCheck'] = this.addSubProjectCardService.dateCheck;
      data['_startDateErrorInfo'] = this.translateService.instant(
        `dj-pcc-开始日期不可早于任务内一级计划的开始日期(API-95的原根任务预计开始日期)`
      );
      data['_endDateErrorInfo'] = this.translateService.instant(
        `dj-pcc-结束日期不可晚于任务内一级计划的结束日期(API-95的原根任务预计结束日期)`
      );
      data['isCollaborate'] = this.source === Entry.collaborate;
      // eslint-disable-next-line max-len
      const {
        liable_person_role_no,
        liable_person_role_name,
        liable_person_department_name,
        liable_person_department_code,
        liable_person_code,
        liable_person_name,
      } = data;
      let role_name_temp = '';
      if (this.languageService.currentLanguage === 'zh_TW') {
        role_name_temp = '無角色';
      } else if (this.languageService.currentLanguage === 'zh_CN') {
        role_name_temp = '无角色';
      } else {
        role_name_temp = 'no role';
      }
      data.treeTablePath = upperPath.concat([data.task_no]);
      // 负责人数据处理
      if (liable_person_code) {
        const personList = this.personList;
        personList.forEach((person) => {
          const { role_name, role_no, department_name, department_no, employee_name, employee_no } =
            person;
          if (
            liable_person_role_no === role_no &&
            liable_person_department_code === department_no &&
            liable_person_code === employee_no
          ) {
            data.liable_person_code_key = `${
              liable_person_role_no || role_name_temp
            }/${liable_person_department_code}/${liable_person_code}/${employee_name}`;
            data.liable_person_name_key = `${employee_name} ${department_name} ${
              role_name || role_name_temp
            }`;
          }
        });
        if (!data.liable_person_code_key) {
          data.liable_person_code_key = `${
            liable_person_role_no || role_name_temp
          }/${liable_person_department_code}/${liable_person_code}/${liable_person_name}`;
          // eslint-disable-next-line max-len
          data.liable_person_name_key = `${liable_person_name} ${liable_person_department_name} ${
            liable_person_role_name || role_name_temp
          }`;
        }
      } else {
        data.liable_person_code_key = '';
        data.liable_person_name_key = '';
      }
      // 执行人数据处理
      data.task_member_info_name = [];
      data.task_member_info_key =
        data.task_member_info?.length > 0
          ? data.task_member_info.map((member_info) => {
              // eslint-disable-next-line max-len
              const {
                executor_role_no,
                executor_role_name,
                executor_department_no,
                executor_department_name,
                executor_no,
                executor_name,
              } = member_info;
              let executorInfo = '';
              const personList = this.personList;
              personList.forEach((person) => {
                const {
                  role_name,
                  role_no,
                  department_name,
                  department_no,
                  employee_name,
                  employee_no,
                } = person;
                if (
                  executor_role_no === role_no &&
                  executor_department_no === department_no &&
                  executor_no === employee_no
                ) {
                  executorInfo = `${
                    executor_role_no || role_name_temp
                  }/${executor_department_no}/${executor_no}/${employee_name}`;
                  data.task_member_info_name.push(
                    `${employee_name} ${department_name} ${role_name || role_name_temp}`
                  );
                }
              });
              if (!executorInfo) {
                executorInfo = `${
                  executor_role_no || role_name_temp
                }/${executor_department_no}/${executor_no}/${executor_name}`;
                data.task_member_info_name.push(
                  `${executor_name} ${executor_department_name} ${
                    executor_role_name || role_name_temp
                  }`
                );
              }
              return executorInfo;
            })
          : '';
      const task_status =
        this.source !== Entry.projectChange && this.source !== Entry.projectChangeSignOff
          ? Number(data.task_status)
          : Number(data.old_task_status);
      data.canEdit =
        this.source !== Entry.collaborate && this.wbsService.needRefresh
          ? false
          : [10, 20].includes(task_status);
      if (Number(data?.project_status) > 10) {
        this.wbsService.projectInfo.project_status = data.project_status;
      }
      data.unDelete = !!(task_status > 10 || data.unDelete);
      if (!data.plan_start_date) {
        data.plan_start_date = '';
      }
      if (!data.plan_finish_date) {
        data.plan_finish_date = '';
      }
      if (task_status === 20 && data.task_category === 'PLM') {
        await this.getDesignStatus(data);
        if (
          ['PLM'].includes(data.task_category) &&
          data.designStatus &&
          data.designStatus === 'completed'
        ) {
          data.canEdit = false;
        }
      }
      if (this.source === Entry.card) {
        if (data.upper_level_task_no === data.task_no) {
          data.isCollaborationCardTrue = !!data.isCollaborationCard;
        } else {
          const rootNode = newDatas.filter(
            (rootData) => rootData.task_no === data.upper_level_task_no
          )[0];
          data.isCollaborationCardTrue = !!rootNode.isCollaborationCard;
        }
      }
      newDatas.push(data);
      if (data.children && data.children.length > 0) {
        await this.flatteningData(data.children, data.treeTablePath, newDatas);
      }
      if (this.wbsService.userModel && this.wbsService.userModel.finished) {
        data.canEdit = false;
      }
    }
  }

  /**
   * 控制负责人是否禁用：取得plm工作项数组后，判断是否全部为未启动，如果全部未启动，则禁用负责人
   */
  async getDesignStatus(currentCardInfo) {
    const { project_no, task_no } = currentCardInfo;
    currentCardInfo['plmDisabledEdit'] = true;
    await this.apiService
      .work_Item_Data_Get([{ project_no: project_no, task_no: task_no }])
      .then((plmResult) => {
        // 若PLM状态（其中一笔） = 已完成（completed），子项开窗所有栏位只读
        const completed =
          plmResult.filter((item) => item.design_status === 'completed').length > 0
            ? 'completed'
            : '';
        let notStart = '';
        if (!completed) {
          // 若PLM状态（多笔）全部 = 未启动（notStart） 则负责人、执行人可删除/新增；否则只能新增执行人，负责人不可修改
          notStart =
            plmResult.filter((item) => item.design_status === 'notStart').length ===
            plmResult.length
              ? 'notStart'
              : '';
        }
        currentCardInfo['designStatus'] = completed ? completed : notStart;
        currentCardInfo['plmDisabledEdit'] = false;
      });
  }

  getUpperLevelTaskPath(upper_level_task_no, path) {
    const upperTask = this.pageDatas.filter((item) => item.task_no === upper_level_task_no)[0];
    if (upperTask) {
      path = upperTask.treeTablePath.concat(path);
      if (upperTask.task_no !== upperTask.upper_level_task_no) {
        this.getUpperLevelTaskPath(upperTask.upper_level_task_no, path);
      }
      return path;
    }
  }

  public athTableProps = {
    suppressClickEdit: false,
    height: '100%',
    defaultToolbarConfig: false,
  };

  ngOnDestroy(): void {
    this.projectSubscribe?.unsubscribe();
  }

  // 添加下级任务卡片
  async addSubProjectCard(currentCardInfo: any): Promise<void> {
    if (this.source === Entry.projectChange) {
      if (!this.addSubProjectCardService.showAddTaskCard) {
        const result = await this.wbsService.checkChangeForbidden(currentCardInfo.task_no);
        const { change_status, old_task_status } = result;
        this.change_status = change_status;
        this.old_task_status = old_task_status;
      }
      // 变更状态是1.进行中 且 当前任务不存在任务比重<100%的下阶任务 且 (任务状态是10.未开始 或 (任务状态是20.进行中 且 当前任务非尾阶))
      // eslint-disable-next-line max-len
      if (
        this.change_status === '1' &&
        !this.hasTaskProportionCheckForPC(currentCardInfo) &&
        (['10'].includes(this.old_task_status) ||
          (['20'].includes(this.old_task_status) && currentCardInfo.children.length > 0))
      ) {
      } else {
        return;
      }
    }
    // 表单未清空之前，不允许打开
    if (this.addSubProjectCardService.validateForm?.value?.task_name) {
      return;
    }

    if (this.source === Entry.collaborate) {
      // 代理卡片，则不做权限管控
      await this.wbsService.setCollaborateAgentIdSameUserId();
      if (!this.wbsService.collaborateAgentIdSameUserId) {
        // 协同任务卡需要校验当前登录员工必是否是当前协同排定的一级计划的负责人
        const rootTaskInfo = await this.taskWbsListService.getRootTaskInfo(
          this.root_task_card?.root_task_no
        );
        if (!rootTaskInfo.isCollaboratePlanOwner) {
          this.messageService.error(this.translateService.instant('dj-pcc-非负责人'));
          return;
        }
        // 协同任务卡需要校验根任务协同计划排定状态为进行中才可以编辑
        const assistScheduleInfo = await this.taskWbsListService.getAssistScheduleInfo(
          this.root_task_card?.root_task_no
        );
        if (assistScheduleInfo[0]?.schedule_status !== '1') {
          this.messageService.error(this.translateService.instant('dj-pcc-不为进行中'));
          return;
        }
      }
    }

    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(currentCardInfo);
    const title = this.translateService.instant('dj-default-添加子项');
    if (this.source === Entry.card) {
      this.commonService
        .getProjectChangeStatus(
          currentCardInfo.project_no,
          ['1', '2', '3', '4', '5'],
          '1',
          currentCardInfo.task_no
        )
        .subscribe(
          (resChange: any): void => {
            this.addSubProjectCardService.openAddSubProjectCard(
              title,
              ButtonType.PLUS,
              firstLevelTaskCard,
              currentCardInfo,
              this.source
            );
            this.addSubProjectCardService.showAddTaskCard = true;
            this.changeRef.markForCheck();
          },
          (error) => {}
        );
    } else {
      this.addSubProjectCardService.openAddSubProjectCard(
        title,
        ButtonType.PLUS,
        firstLevelTaskCard,
        currentCardInfo,
        this.source
      );
      this.changeRef.markForCheck();
    }
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no 项目变更
  hasTaskProportionCheckForPC(data): boolean {
    let taskNos: Set<string> = new Set();
    // + 检查各一级任务的整棵树下，是否存在任务比重<100%
    let array: Array<string> = [];
    this.wbsService.pageDatas.forEach((element) => {
      const arr: Array<string> = [];
      const flag: Array<string> = [];
      this.getUpperTask(element, arr, flag);
      if (flag[0]) {
        array = [...array, ...arr];
      }
    });
    taskNos = new Set([...array].filter((v) => v !== ''));
    return taskNos.has(data.task_no);
  }

  // 新建一级计划
  addFirstItem(): void {
    if (this.source === Entry.collaborate) {
      return;
    }
    if (
      this.wbsService.needRefresh ||
      !(
        !this.signOff &&
        (this.source === Entry.projectChange
          ? this.wbsService.projectChangeDoc.change_status === '1' &&
            !this.hasTaskProportionForRoot()
          : this.wbsService.editable &&
            !this.wbsService.needRefresh &&
            !this.getTaskProportionCheck())
      )
    ) {
      return;
    }
    const title = this.translateService.instant('dj-default-新建一级计划');
    if (this.source === Entry.card) {
      this.commonService
        .getProjectChangeStatus(this.wbsService?.project_no, ['1', '2', '4', '5'], '1')
        .subscribe(
          (resChange: any): void => {
            this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.CREATE);
            this.addSubProjectCardService.showAddTaskCard = true;
            this.changeRef.markForCheck();
          },
          (error) => {}
        );
    } else {
      this.addSubProjectCardService.openAddSubProjectCard(title, ButtonType.CREATE);
    }
  }

  // 所有根任务比重不小于100%
  hasTaskProportionForRoot(): boolean {
    let flag = false;
    this.wbsService.pageDatas.forEach((element) => {
      if (element.task_proportion < 1) {
        flag = true;
      }
    });
    return flag;
  }

  private async tableChange(param: any) {
    if (!this.wbsService.collaborateAgentIdSameUserId && this.source === Entry.collaborate) {
      // 协同定制页面：当前登录员工是当前协同排定的一级计划的负责人才可继续操作
      const rootTaskInfo = await this.taskWbsListService.getRootTaskInfo(
        this.root_task_card?.root_task_no
      );
      if (!rootTaskInfo.isCollaboratePlanOwner) {
        this.messageService.error(this.translateService.instant('dj-pcc-非负责人'));
        return;
      }
      // 协同任务卡需要校验根任务协同计划排定状态为进行中才可以编辑
      const assistScheduleInfo = await this.taskWbsListService.getAssistScheduleInfo(
        this.root_task_card?.root_task_no
      );
      if (assistScheduleInfo[0]?.schedule_status !== '1') {
        this.messageService.error(this.translateService.instant('dj-pcc-不为进行中'));
        return;
      }
    }
    if (this.noTriggerChange) {
      return;
    }
    this.loading = true;
    const { path, prevValue, newValue, control } = param;
    if (newValue === prevValue) {
      this.loading = false;
      this.noTriggerChange = false;
      return;
    }
    const parentControl = control._parent;
    const schema = path.split('.')[1];
    // 如果是需要签核和需要交付物不推卡
    if (schema === 'is_approve' || schema === 'is_attachment') {
      this.isSynTaskCard = false;
    } else {
      this.isSynTaskCard = true;
    }
    // 修改工期
    if (schema === 'workload_qty') {
      this.noTriggerChange = true;
      if (!newValue || newValue === 0) {
        this.noTriggerChange = false;
        this.checkValue(parentControl);
      } else {
        this.callTaskWorkCalendarFn('1', 'workload_qty', newValue || 0, parentControl);
      }
    } else if (schema === 'plan_start_date') {
      if (
        moment(newValue).format('YYYY-MM-DD') === moment(prevValue).format('YYYY-MM-DD') ||
        control.invalid
      ) {
        this.noTriggerChange = false;
        this.loading = false;
        return;
      }
      if (!control.parent['firstLevelTaskCard']) {
        const firstLevelTaskNo = parentControl.controls['treeTablePath'].value[0];
        const firstLevelTaskCard = this.getFirstLevelTaskCard(firstLevelTaskNo);
        control.parent['firstLevelTaskCard'] = firstLevelTaskCard;
      }
      // 修改预计开始时间
      this.noTriggerChange = true;
      const plan_start_date = parentControl.controls['plan_start_date'].value;
      const workload_qty = parentControl.controls['workload_qty'].value;
      const plan_finish_date = parentControl.controls['plan_finish_date'].value;
      if ((!workload_qty && !plan_finish_date) || !plan_start_date) {
        this.noTriggerChange = false;
        this.checkValue(parentControl, schema);
        return;
      }
      if (!this.dateCheck(parentControl, schema)) {
        return;
      }
      let callback: any = '';
      if (plan_start_date) {
        callback = (extraFun) => {
          const startTime = moment(newValue).format('YYYY-MM-DD');
          // 项目变更，任务卡，预计开始，校验信息
          if (this.source === Entry.projectChange) {
            this.checkPromptForStartDateByProjectChangeEntry(startTime, parentControl, extraFun);
          }

          // 协同排定，任务卡，预计开始，校验信息
          if (this.source === Entry.collaborate) {
            this.checkPromptForStartDateByCollaborateEntry(
              startTime,
              parentControl,
              extraFun,
              schema
            );
          }

          // 项目计划维护、模板，任务卡，预计开始，校验信息
          if (this.source === Entry.card || this.source === Entry.maintain) {
            // 项目计划维护、模板，任务卡，预计开始，校验信息
            this.checkPromptForStartDateByCardOrMaintainEntry(startTime, parentControl, extraFun);
          }
        };
      }
      this.callTaskWorkCalendarFn(
        '1',
        'plan_start_date',
        newValue,
        parentControl,
        callback,
        schema
      );
    } else if (schema === 'plan_finish_date') {
      if (
        moment(newValue).format('YYYY-MM-DD') === moment(prevValue).format('YYYY-MM-DD') ||
        control.invalid
      ) {
        this.noTriggerChange = false;
        this.loading = false;
        return;
      }
      if (!control.parent['firstLevelTaskCard']) {
        const firstLevelTaskNo = parentControl.controls['treeTablePath'].value[0];
        const firstLevelTaskCard = this.getFirstLevelTaskCard(firstLevelTaskNo);
        control.parent['firstLevelTaskCard'] = firstLevelTaskCard;
      }
      // 修改预计结束时间
      this.noTriggerChange = true;
      const plan_start_date = parentControl.controls['plan_start_date'].value;
      const workload_qty = parentControl.controls['workload_qty'].value;
      const plan_finish_date = parentControl.controls['plan_finish_date'].value;

      if ((!workload_qty && !plan_start_date) || !plan_finish_date) {
        this.noTriggerChange = false;
        this.checkValue(parentControl, schema);
        return;
      }
      if (!this.dateCheck(parentControl, schema)) {
        return;
      }
      const callback = () => {
        this.checkPromptForFinishDate(newValue, parentControl, undefined, schema);
      };
      this.callTaskWorkCalendarFn('2', 'plan_finish_date', newValue, parentControl, callback);
    } else {
      // 校验保存
      await this.checkValue(parentControl);
    }
  }
  private dateCheck(parentControl: any, schema?: string): boolean {
    if (this.source !== Entry.collaborate) {
      return true;
    }
    if (!parentControl['firstLevelTaskCard']) {
      return true;
    }
    const firstLevelTaskCard = parentControl['firstLevelTaskCard'];
    if (!firstLevelTaskCard) {
      return true;
    }
    // const {
    //   root_task_plan_start_date: plan_start_date,
    //   root_task_plan_finish_date: plan_finish_date,
    // } = firstLevelTaskCard;
    // const finishWhiteListSchema = ['plan_finish_date', 'workload_qty'],
    //   startWhiteListSchema = ['plan_start_date', 'workload_qty'];
    // s17: 交付设计器日期管控
    // if (
    //   isNotEmpty(plan_finish_date) &&
    //   isNotEmpty(parentControl.get('plan_finish_date').value) &&
    //   this.addSubProjectCardService.dateCheck === '1' &&
    //   moment(parentControl.get('plan_finish_date').value).format('YYYY-MM-DD') >
    //     moment(plan_finish_date).format('YYYY-MM-DD')
    // ) {
    //   this.noTriggerChange = false;
    //   this.loading = false;
    //   this.changeRef.markForCheck();
    //   return false;
    // }
    // if (
    //   isNotEmpty(plan_start_date) &&
    //   isNotEmpty(parentControl.get('plan_start_date').value) &&
    //   this.addSubProjectCardService.dateCheck === '1' &&
    //   moment(parentControl.get('plan_start_date').value).format('YYYY-MM-DD') <
    //     moment(plan_start_date).format('YYYY-MM-DD')
    // ) {
    //   this.noTriggerChange = false;
    //   this.loading = false;
    //   this.messageService.error(
    //     this.translateService.instant(
    //       `dj-pcc-开始日期不可早于任务内一级计划的开始日期(API-95的原根任务预计开始日期)`
    //     )
    //   );
    //   this.changeRef.markForCheck();
    //   return false;
    // }
    return true;
  }
  /**
   * 校验表单值
   * @returns
   */
  async checkValue(parentControl: any, schema?: string): Promise<void> {
    // 如果当前行有报错提示，则禁止保存
    let isError = 0;
    Object.keys(parentControl.controls).forEach((el: string) => {
      if (parentControl.controls[el].errors) {
        isError += 1;
      }
    });
    if (isError > 0 || parentControl.invalid) {
      this.loading = false;
      this.noTriggerChange = false;
      return;
    }
    const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
    this.wbsService.needRefresh = data.check_result;
    if (this.source !== Entry.collaborate && this.wbsService.needRefresh) {
      this.addSubProjectCardService.showAddTaskCard = false;
      this.athMessageService.error(this.wbsService.needRefresh);
      this.loading = false;
      this.noTriggerChange = false;
      this.wbsService.changeWbs$.next();
      return;
    }
    const updateValues: { [key: string]: any } = { ...parentControl.controls };

    Object.keys(parentControl.controls).forEach(
      (el: string) => (updateValues[el] = parentControl.controls[el].value)
    );

    const { task_name, workload_qty } = updateValues;
    if (!task_name?.trim()) {
      return;
    }
    if (!this.dateCheck(parentControl, schema)) {
      return;
    }
    if (!workload_qty) {
      updateValues.workload_qty = 0;
    }

    if (Number(this.wbsService.projectInfo?.project_status) === 30) {
      if (this.source === Entry.collaborate || this.source === Entry.projectChange) {
        this.nowUpdateValues = updateValues;
        this.handelData({ status: true });
      } else {
        this.nowUpdateValues = updateValues;
        this.changeReason.showModal();
      }
    } else {
      this.nowUpdateValues = updateValues;
      this.handelData({ status: true });
    }
  }

  /**
   * 确认录入变更原因
   * @param value 变更原因
   */
  changeReasonOk(value): void {
    let changeReason = null;
    let changeReasonUploadFile = null;
    if (Object.keys(value).length > 1 && Object.keys(value).includes('fileList')) {
      changeReason = { value: value.changeReason, status: true };
      changeReasonUploadFile = value.fileList && value.fileList.length ? value.fileList[0] : {};
    } else {
      changeReason = { value: value, status: true };
    }
    this.handelData(changeReason, changeReasonUploadFile);
  }

  changeReasonCancel() {
    this.loading = false;
    this.noTriggerChange = false;
  }

  /**
   * 点击提交：获取入参 提交内容
   * @param changeReason
   * @param changeReasonUploadFile
   */
  handelData(changeReason: any, changeReasonUploadFile?: any): void {
    const enterParams = {
      changeReason,
      hasGroundEnd: this.wbsService.hasGroundEnd,
    };
    if (changeReasonUploadFile) {
      enterParams['change_attachment'] = changeReasonUploadFile;
    }
    // 验证表单信息
    const params = this.projectTableService.handelData(
      enterParams,
      this.nowUpdateValues,
      this.personList
    );
    params.task_property = '1';
    delete params.liable_person_code_data;
    params.item_type = params.item_type === null ? '' : params.item_type;
    // 修改 -- 保存【子项开窗】表单
    this.saveEditInfo(params).then((r) => {
      this.nowUpdateValues = {};
    });
  }

  /**
   * 保存编辑任务卡
   * @param params 编辑的任务卡信息
   */
  async saveEditInfo(params: any): Promise<void> {
    params.is_update_upper_date = 'Y';
    let res;
    try {
      if (this.source === Entry.collaborate) {
        res = await this.projectTableService.assistTaskDetailUpdate(
          params,
          this.root_task_card,
          this.wbsService.project_no,
          () => {
            this.loading = false;
            this.noTriggerChange = false;
            this.changeRef.markForCheck();
          }
        );
      } else if (this.source === Entry.projectChange) {
        params.change_version = this.wbsService.change_version;
        res = await this.projectTableService.taskBaseInfoChangeUpdate(params, () => {
          this.loading = false;
          this.noTriggerChange = false;
          this.changeRef.markForCheck();
        });
      } else {
        let updateParams;
        if (this.source === Entry.card) {
          updateParams = {
            task_info: [params],
            is_sync_document: this.wbsService.is_sync_document,
          };
        } else {
          updateParams = { task_info: [params] };
        }
        res = await this.projectTableService.taskBaseInfoUpdate(updateParams, () => {
          this.loading = false;
          this.noTriggerChange = false;
          this.changeRef.markForCheck();
        });
      }
      if (params?.isCollaborationCard && this.source !== Entry.collaborate) {
        this.projectTableService.getServiceOrchestration(params);
      }
      if (this.projectTableService.mistakeMessage(res)) {
        this.updateTaskFlow(params);
        this.taskProportionCheck();
        this.updateWbsTasks('true');
      }
      this.messageService.success(this.translateService.instant('dj-default-保存成功'));
    } catch (err) {
      if (err) {
        this.loading = false;
        this.noTriggerChange = false;
        this.changeRef.markForCheck();
        this.messageService.error(err);
      }
    }
  }

  /**
   * 更新任务流程
   * @param params 任务卡信息
   */
  updateTaskFlow(params: any): void {
    if (this.source === Entry.card) {
      this.projectTableService.bmPiscProjectGet(this.wbsService.project_no).then((projectInfo) => {
        const status = projectInfo.project_status;
        this.wbsService.projectInfo.project_status =
          Number(status) > 10 ? status : this.wbsService.projectInfo.project_status;
        if (this.isSynTaskCard) {
          this.projectTableService.updateTaskFlow(
            params,
            this.wbsService.modelType,
            this.wbsService.project_no,
            this.source
          );
        }
      });
    }
  }

  /**
   * 任务比重校验
   */
  taskProportionCheck(): void {
    this.wbsService.$checkProportion.next(true);
  }

  /**
   * 更新wbs界面任务卡列表
   * @param params true ｜ taskInfo
   */
  updateWbsTasks(params): void {
    this.wbsService.pageChange.next(params);
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

  translateWordAll(val: string): String {
    return this.translateService.instant(`dj-${val}`);
  }

  /**
   * 调用推算栏位值的API
   * @param calculation_method 计算方式
   * @param callName 调用的栏位名称
   * @param callVale 调用的栏位值
   * @param formGroup
   * @param callback
   */
  callTaskWorkCalendarFn(
    calculation_method: string,
    callName: string,
    callVale: any,
    formGroup?: any,
    callback?: any,
    sourceSchema?: string
  ) {
    const task_no = formGroup.controls['task_no'].value;
    const project_no = formGroup.controls['project_no'].value;
    const workload_qty = formGroup.controls['workload_qty'].value;
    const workload_unit = formGroup.controls['workload_unit'].value;
    const plan_work_hours = formGroup.controls['plan_work_hours'].value;
    const plan_start_date = formGroup.controls['plan_start_date'].value;
    const plan_finish_date = formGroup.controls['plan_finish_date'].value;

    const params = {
      is_repush_workload_qty_and_date: true, // 是否重推工作量及日期
      calculation_method, // 计算方式
      task_info: [
        {
          project_no,
          task_no,
          workload_qty: Number(workload_qty ?? 0),
          workload_unit, // 日期单位：1.小时；2.日；3.月
          plan_work_hours: Number(plan_work_hours ?? 0),
          plan_start_date,
          plan_finish_date,
        },
      ],
    };

    this.commonService
      .taskWorkCalendar(params)
      .pipe(debounceTime(1000))
      .subscribe(
        (res: any): void => {
          if (res && res.data && res.data.task_info && res.data.task_info.length > 0) {
            // 预计工时
            const return_plan_work_hours = res.data.task_info[0].plan_work_hours;
            if (plan_work_hours !== return_plan_work_hours) {
              formGroup.controls['plan_work_hours'].setValue(return_plan_work_hours);
            }
            if (calculation_method === '1') {
              // 计划结束日期
              const return_plan_finish_date = res.data.task_info[0].plan_finish_date;
              const date = return_plan_finish_date
                ? moment(return_plan_finish_date).format('YYYY/MM/DD')
                : '';
              if (plan_finish_date !== date) {
                formGroup.controls['plan_finish_date'].setValue(date);
              }
              if (callback) {
                callback((disableCheckValue, _sourceSchema?: string) => {
                  if (formGroup.controls['plan_finish_date'].value) {
                    // 校验结束日期
                    this.checkPromptForFinishDate(
                      formGroup.controls['plan_finish_date'].value,
                      formGroup,
                      disableCheckValue,
                      _sourceSchema || sourceSchema
                    );
                  }
                });
              } else {
                if (formGroup.controls['plan_finish_date'].value) {
                  // 校验结束日期
                  this.checkPromptForFinishDate(
                    formGroup.controls['plan_finish_date'].value,
                    formGroup,
                    undefined,
                    sourceSchema
                  );
                } else {
                  this.checkValue(formGroup, sourceSchema);
                }
              }
            } else {
              // 工作量
              const return_workload_qty = res.data.task_info[0].workload_qty;
              // if (this.getFormItem('workload_qty') !== return_workload_qty) {
              formGroup.controls['workload_qty'].setValue(return_workload_qty);
              // }

              // 工作单位
              const return_workload_unit = res.data.task_info[0].workload_unit;
              if (workload_unit !== return_workload_unit) {
                formGroup.controls['workload_unit'](return_workload_unit);
              }
              if (callback) {
                callback();
              }
            }
          }
          // setTimeout(()=>{
          //   this.loading = false;
          //   this.noTriggerChange = false;
          //   this.changeRef.markForCheck();
          // },2000);
        },
        (err) => {
          this.loading = false;
          this.noTriggerChange = false;
        }
      );
  }

  // 校验结束日期
  checkPromptForFinishDate(
    plan_finish_date: any,
    formGroup?: any,
    disableCheckValue?: any,
    sourceSchema?: any
  ): void {
    const endTime = moment(plan_finish_date).format('YYYY-MM-DD');
    if (this.source === Entry.projectChange) {
      // 项目变更，任务卡，预计结束日期，校验信息
      this.checkPromptForFinishDateByProjectChangeEntry(endTime, formGroup, disableCheckValue);
    } else if (this.source === Entry.collaborate) {
      // 协同排定，任务卡，预计结束日期，校验信息
      this.checkPromptForFinishDateByCollaborateEntry(
        endTime,
        formGroup,
        disableCheckValue,
        sourceSchema
      );
    } else {
      // 项目计划维护、模板，任务卡，预计结束日期，校验信息
      this.checkPromptForFinishDateByCardOrMaintainEntry(endTime, formGroup, disableCheckValue);
    }
  }

  // 协同排定，任务卡，预计结束日期，校验信息
  checkPromptForFinishDateByCollaborateEntry(
    endTime: any,
    formGroup?: any,
    disableCheckValue?: any,
    sourceSchema?: string
  ): void {
    // 校验，和上阶任务卡（一级任务卡)
    // if (endTime > moment(this.addSubProjectCardService.firstLevelTaskCard?.plan_finish_date).format('YYYY-MM-DD')) {
    //   this.messageService.error(this.translateService.instant(`dj-default-任务结束日期大于一级计划的结束日期！`));
    // }
    // 校验，和下阶任务卡
    const bpmData = this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData;
    const taskInfo = bpmData?.assist_schedule_info
      ? bpmData?.assist_schedule_info[0]
      : bpmData?.task_info[0];
    const assist_schedule_seq = taskInfo['assist_schedule_seq']
      ? taskInfo['assist_schedule_seq']
      : taskInfo['teamwork_plan_seq'];
    const plan_finish_date_control = formGroup.controls['plan_finish_date'];
    const task_no = formGroup.controls['task_no'].value;
    const project_no = formGroup.controls['project_no'].value;

    const endNotice = '';
    let endNoticeForEarly = '';
    plan_finish_date_control?.infoCheck('', 0);
    plan_finish_date_control?.infoCheck('', 1);

    const params = {
      query_condition: 'M1', // 查询范围
      level_type: '1', // 阶层类型
      assist_task_detail_info: [
        {
          project_no: project_no, // 项目编号
          upper_level_task_no: task_no,
          assist_schedule_seq: assist_schedule_seq, // 协助排定计划序号
          is_delete: 'false', // 是否删除
        },
      ],
      search_info: [
        {
          order: 1,
          search_field: 'plan_finish_date',
          search_operator: 'greater',
          search_value: [endTime],
          logic: 'and',
        },
        {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [task_no],
        },
      ],
    };
    this.commonService.getInvData('bm.pisc.assist.task.detail.get', params).subscribe(
      (res: any): void => {
        if (
          res &&
          res.data &&
          res.data.assist_task_detail_info &&
          res.data.assist_task_detail_info.length > 0
        ) {
          endNoticeForEarly = this.translateService.instant(
            `dj-pcc-预计结束日已早于下阶任务的最大预计结束日！`
          );
        } else {
          endNoticeForEarly = '';
        }
        plan_finish_date_control?.infoCheck(endNotice, 0);
        plan_finish_date_control?.infoCheck(endNoticeForEarly, 1);
        if (!endNotice && !endNoticeForEarly) {
          if (!disableCheckValue) {
            this.checkValue(formGroup, sourceSchema);
          }
        }
      },
      (err) => {
        this.loading = false;
        this.noTriggerChange = false;
      }
    );
  }

  // 项目变更，任务卡，预计结束日期，校验信息
  checkPromptForFinishDateByProjectChangeEntry(
    endTime: any,
    formGroup?: any,
    disableCheckValue?: any
  ): void {
    const task_no = formGroup.controls['task_no'].value;
    const project_no = formGroup.controls['project_no'].value;
    const plan_finish_date_control = formGroup.controls['plan_finish_date'];
    const endNotice = '';
    let endNoticeForEarly = '';
    plan_finish_date_control?.infoCheck('', 0);
    plan_finish_date_control?.infoCheck('', 1);

    // 校验，和下阶任务卡
    const params = {
      excluded_already_deleted_task: true,
      project_change_task_detail_info: [
        {
          project_no: project_no, // 项目编号
          change_version: this.wbsService.change_version,
          upper_level_task_no: task_no,
        },
      ],
      search_info: [
        {
          order: 1,
          search_field: 'plan_finish_date',
          search_operator: 'greater',
          search_value: [endTime],
          logic: 'and',
        },
        {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [task_no],
        },
      ],
    };
    this.commonService.getInvData('bm.pisc.project.change.task.detail.get', params).subscribe(
      (res: any): void => {
        if (
          res &&
          res.data &&
          res.data.project_change_task_detail_info &&
          res.data.project_change_task_detail_info.length > 0
        ) {
          endNoticeForEarly = this.translateService.instant(
            `dj-pcc-预计结束日已早于下阶任务的最大预计结束日！`
          );
        } else {
          endNoticeForEarly = '';
        }
        plan_finish_date_control?.infoCheck(endNotice, 0);
        plan_finish_date_control?.infoCheck(endNoticeForEarly, 1);
        if (!endNotice && !endNoticeForEarly) {
          if (!disableCheckValue) {
            this.checkValue(formGroup);
          }
        }
      },
      (err) => {
        this.loading = false;
        this.noTriggerChange = false;
      }
    );
  }

  // 项目计划维护、模板，预计结束日期，校验信息
  checkPromptForFinishDateByCardOrMaintainEntry(
    endTime: any,
    formGroup?: any,
    disableCheckValue?: any
  ): void {
    const task_no = formGroup.controls['task_no'].value;
    const project_no = formGroup.controls['project_no'].value;
    const plan_finish_date_control = formGroup.controls['plan_finish_date'];
    const upper_level_task_no = formGroup.controls['upper_level_task_no'].value;
    let endNotice = '';
    let endNoticeForEarly = '';
    plan_finish_date_control?.infoCheck('', 0);
    plan_finish_date_control?.infoCheck('', 1);

    // 校验，和上阶任务卡（一级任务卡)
    const firstLevelTaskNo = formGroup.controls['treeTablePath'].value[0];
    const firstLevelTaskCard = this.getFirstLevelTaskCard(firstLevelTaskNo);
    const endNoticeCondition = task_no !== firstLevelTaskCard?.task_no;
    if (endNoticeCondition) {
      const parentInfo = this.getParentTime(upper_level_task_no);
      const { plan_start_date, plan_finish_date } = parentInfo ?? {};
      if (plan_start_date && endTime < moment(plan_start_date).format('YYYY-MM-DD')) {
        endNotice = this.translateService.instant(`dj-pcc-预计完成日早于上阶任务预计开始日`);
      } else if (plan_finish_date && endTime > moment(plan_finish_date).format('YYYY-MM-DD')) {
        endNotice = this.translateService.instant(`dj-pcc-预计完成日晚于上阶任务预计完成日`);
      } else {
        endNotice = '';
      }
    }

    // 校验，和下阶任务卡
    const paras = {
      query_condition: 'M1',
      task_info: [
        {
          project_no,
          upper_level_task_no: task_no,
          task_property: '1',
        },
      ],
      search_info: [
        {
          order: 1,
          search_field: 'plan_finish_date',
          search_operator: 'greater',
          search_value: [endTime],
          logic: 'and',
        },
        {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [task_no],
        },
      ],
    };
    this.commonService.getInvData('bm.pisc.task.get', paras).subscribe(
      (res: any): void => {
        if (res && res.data && res.data.task_info && res.data.task_info.length > 0) {
          endNoticeForEarly = this.translateService.instant(
            `dj-pcc-预计结束日已早于下阶任务的最大预计结束日！`
          );
        } else {
          endNoticeForEarly = '';
        }
        plan_finish_date_control?.infoCheck(endNotice, 0);
        plan_finish_date_control?.infoCheck(endNoticeForEarly, 1);
        if (!endNotice && !endNoticeForEarly) {
          if (!disableCheckValue) {
            this.checkValue(formGroup);
          }
        }
      },
      (err) => {
        this.loading = false;
        this.noTriggerChange = false;
      }
    );
  }

  // 项目变更，任务卡，预计开始，校验信息
  checkPromptForStartDateByProjectChangeEntry(
    startTime: string,
    formGroup?: any,
    extraFun?: any
  ): void {
    // 校验，和上阶任务卡（一级任务卡)
    const task_no = formGroup.controls['task_no'].value;
    const project_no = formGroup.controls['project_no'].value;
    const plan_start_date_control = formGroup.controls['plan_start_date'];
    const startNotice = '';
    let startNoticeForlate = '';
    plan_start_date_control?.infoCheck('', 0);
    plan_start_date_control?.infoCheck('', 1);

    // 校验，和下阶任务卡
    const params = {
      excluded_already_deleted_task: true,
      project_change_task_detail_info: [
        {
          project_no: project_no, // 项目编号
          change_version: this.wbsService.change_version,
          upper_level_task_no: task_no,
        },
      ],
      search_info: [
        {
          order: 1,
          search_field: 'plan_start_date',
          search_operator: 'less',
          search_value: [startTime],
          logic: 'and',
        },
        {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [task_no],
        },
      ],
    };
    this.commonService.getInvData('bm.pisc.project.change.task.detail.get', params).subscribe(
      (res: any): void => {
        if (
          res &&
          res.data &&
          res.data.project_change_task_detail_info &&
          res.data.project_change_task_detail_info.length > 0
        ) {
          startNoticeForlate = this.translateService.instant(
            `dj-pcc-预计开始日已晚于下阶任务的最小预计开始日！`
          );
        } else {
          startNoticeForlate = '';
        }
        plan_start_date_control?.infoCheck(startNotice, 0);
        plan_start_date_control?.infoCheck(startNoticeForlate, 1);
        if (!startNotice && !startNoticeForlate) {
          if (extraFun) {
            extraFun();
          } else {
            this.checkValue(formGroup);
          }
        } else {
          if (extraFun) {
            extraFun(true);
          }
        }
      },
      (err) => {
        this.loading = false;
        this.noTriggerChange = false;
      }
    );
  }

  // 协同排定，预计开始，校验信息
  checkPromptForStartDateByCollaborateEntry(
    startTime: string,
    formGroup?: any,
    extraFun?: any,
    sourceSchema?: any
  ): void {
    // 校验，和上阶任务卡（一级任务卡)
    // const { plan_start_date, plan_finish_date } = this.addSubProjectCardService.firstLevelTaskCard;
    const task_no = formGroup.controls['task_no'].value;
    const project_no = formGroup.controls['project_no'].value;
    const plan_start_date_control = formGroup.controls['plan_start_date'];
    const startNotice = '';
    let startNoticeForlate = '';
    plan_start_date_control?.infoCheck('', 0);
    plan_start_date_control?.infoCheck('', 1);
    // if (startTime < moment(plan_start_date).format('YYYY-MM-DD')) {
    //   this.messageService.error(this.translateService.instant(`dj-default-任务开始日期小于一级计划的开始日期！`));
    // }
    // if (startTime > moment(plan_finish_date).format('YYYY-MM-DD')) {
    //   this.messageService.error(this.translateService.instant(`dj-default-任务开始日期不可大于一级计划的结束日期，请核查！`));
    // }
    // 校验，和下阶任务卡
    const bpmData = this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData;
    const taskInfo = bpmData?.assist_schedule_info
      ? bpmData?.assist_schedule_info[0]
      : bpmData?.task_info[0];
    const assist_schedule_seq = taskInfo['assist_schedule_seq']
      ? taskInfo['assist_schedule_seq']
      : taskInfo['teamwork_plan_seq'];

    const params = {
      query_condition: 'M1', // 查询范围
      level_type: '1', // 阶层类型
      assist_task_detail_info: [
        {
          project_no: project_no, // 项目编号
          upper_level_task_no: task_no,
          assist_schedule_seq: assist_schedule_seq, // 协助排定计划序号
          is_delete: 'false', // 是否删除
        },
      ],
      search_info: [
        {
          order: 1,
          search_field: 'plan_start_date',
          search_operator: 'less',
          search_value: [startTime],
          logic: 'and',
        },
        {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [task_no],
        },
      ],
    };
    this.commonService.getInvData('bm.pisc.assist.task.detail.get', params).subscribe(
      (res: any): void => {
        if (
          res &&
          res.data &&
          res.data.assist_task_detail_info &&
          res.data.assist_task_detail_info.length > 0
        ) {
          startNoticeForlate = this.translateService.instant(
            `dj-pcc-预计开始日已晚于下阶任务的最小预计开始日！`
          );
        } else {
          startNoticeForlate = '';
        }
        plan_start_date_control?.infoCheck(startNotice, 0);
        plan_start_date_control?.infoCheck(startNoticeForlate, 1);
        if (!startNotice && !startNoticeForlate) {
          if (extraFun) {
            extraFun(undefined, sourceSchema);
          } else {
            this.checkValue(formGroup, sourceSchema);
          }
        } else {
          if (extraFun) {
            extraFun(true, sourceSchema);
          }
        }
      },
      (err) => {
        this.loading = false;
        this.noTriggerChange = false;
      }
    );
  }

  // 项目计划维护、模板，预计开始，校验信息
  checkPromptForStartDateByCardOrMaintainEntry(
    startTime: string,
    formGroup?: any,
    extraFun?: any
  ): void {
    const task_no = formGroup.controls['task_no'].value;
    const project_no = formGroup.controls['project_no'].value;
    const upper_level_task_no = formGroup.controls['upper_level_task_no'].value;
    const plan_start_date_control = formGroup.controls['plan_start_date'];
    let startNotice = '';
    let startNoticeForlate = '';
    plan_start_date_control?.infoCheck('', 0);
    plan_start_date_control?.infoCheck('', 1);

    // 校验，和上阶任务卡（一级任务卡)
    const firstLevelTaskNo = formGroup.controls['treeTablePath'].value[0];
    const firstLevelTaskCard = this.getFirstLevelTaskCard(firstLevelTaskNo);
    if (
      (firstLevelTaskCard?.children?.length || firstLevelTaskCard?.task_no) &&
      task_no !== firstLevelTaskCard?.task_no
    ) {
      // 获取上级的内容
      const parentInfo = this.getParentTime(upper_level_task_no);
      const { plan_start_date, plan_finish_date } = parentInfo ?? {};
      if (
        firstLevelTaskCard?.plan_start_date &&
        startTime < moment(plan_start_date).format('YYYY-MM-DD')
      ) {
        startNotice = this.translateService.instant(`dj-pcc-预计开始日早于上阶任务预计开始日`);
      } else if (plan_finish_date && startTime > moment(plan_finish_date).format('YYYY-MM-DD')) {
        startNotice = this.translateService.instant(`dj-pcc-预计开始日晚于上阶任务预计完成日`);
      } else {
        startNotice = '';
      }
    }

    // 校验，和下阶任务卡
    const paras = {
      query_condition: 'M1',
      task_info: [
        {
          project_no: project_no,
          upper_level_task_no: task_no,
          task_property: '1',
        },
      ],
      search_info: [
        {
          order: 1,
          search_field: 'plan_start_date',
          search_operator: 'less',
          search_value: [startTime],
          logic: 'and',
        },
        {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [task_no],
        },
      ],
    };

    this.commonService.getInvData('bm.pisc.task.get', paras).subscribe(
      (res: any): void => {
        if (res && res.data && res.data.task_info && res.data.task_info.length > 0) {
          startNoticeForlate = this.translateService.instant(
            `dj-pcc-预计开始日已晚于下阶任务的最小预计开始日！`
          );
        } else {
          startNoticeForlate = '';
        }
        plan_start_date_control?.infoCheck(startNotice, 0);
        plan_start_date_control?.infoCheck(startNoticeForlate, 1);
        if (!startNotice && !startNoticeForlate) {
          if (extraFun) {
            extraFun();
          } else {
            this.checkValue(formGroup);
          }
        } else {
          if (extraFun) {
            extraFun(true);
          }
        }
      },
      (err) => {
        this.loading = false;
        this.noTriggerChange = false;
      }
    );
  }

  // 获取首阶任务
  getFirstLevelTaskCard(firstLevelTaskNo) {
    return this.pageDatas.filter((data) => data.task_no === firstLevelTaskNo)[0];
  }

  // 获取上阶任务卡信息
  getParentTime(upper_level_task_no) {
    return this.pageDatas.filter((data) => data.task_no === upper_level_task_no)[0];
  }

  /**
   * 开始时间：是否可选
   * @param startValue
   * @returns
   */
  disabledStartDate = (startValue: Date, formGroup): boolean => {
    if (!startValue) {
      return false;
    }
    if (this.wbsService.projectInfo?.plan_finish_date) {
      return (
        moment(startValue).format('YYYY-MM-DD') >
        moment(this.wbsService.projectInfo?.plan_finish_date).format('YYYY-MM-DD')
      );
    } else {
      return false;
    }
  };

  /**
   * 结束时间是否可选
   * @param endValue
   * @param formGroup
   * @returns
   */
  disabledEndDate = (endValue: Date, formGroup): boolean => {
    if (!endValue) {
      return false;
    }
    const plan_start_date = formGroup.controls['plan_start_date'].value;
    if (!plan_start_date) {
      return (
        moment(this.wbsService.projectInfo?.plan_finish_date).format('YYYY-MM-DD') <
        moment(endValue).format('YYYY-MM-DD')
      );
    } else {
      return (
        moment(endValue).format('YYYY-MM-DD') < moment(plan_start_date).format('YYYY-MM-DD') ||
        moment(this.wbsService.projectInfo?.plan_finish_date).format('YYYY-MM-DD') <
          moment(endValue).format('YYYY-MM-DD')
      );
    }
  };

  // 项目已启动，任务比重校验不通过，屏蔽新建一级计划按钮功能
  getTaskProportionCheck(): boolean {
    // 存在一级任务的任务比重<100% ==> 整个计划维护页面禁用WBS的删除功能、添加子项功能、新建一级计划
    if (Number(this.wbsService.projectInfo?.project_status) > 20 && this.source === Entry.card) {
      return this.wbsService.pageDatas.find((element) => element.task_proportion < 1) !== undefined;
    } else {
      return false;
    }
  }

  // + 新增按钮是否可用
  isHiddenAdd(item): boolean {
    if (this.signOff) {
      return false;
    }
    let isShowButton = false;
    if (this.source === Entry.projectChange) {
      item.unDelete = item.old_task_status > '10' || item.unDelete ? true : false;
      item.someEdit = item.old_task_status > '10' ? true : false;
      return true;
    }
    if (this.source === Entry.collaborate) {
      isShowButton =
        this.wbsService.editable &&
        this.projectTableService.getAddButtonPermissions(
          item,
          this?.root_task_card?.schedule_status,
          !this.hasTaskProportionCheck(item)
        );
      this.hiddenAdd(item, 1);
    } else {
      const condition1 =
        (this.hiddenAdd(item, 2) && this.wbsService.editable) || this.source === Entry.maintain;
      const condition2 = !this.hasTaskProportionCheck(item);
      if (condition1 && condition2) {
        isShowButton = true;
      } else {
        isShowButton = false;
      }
    }
    return isShowButton;
  }

  hiddenAdd(item, type) {
    let unShow;
    if (type === 2) {
      if (item.children && item.children.length) {
        unShow = item.task_status === 30 ? true : false;
      } else {
        unShow = item.task_status > 10 ? true : false;
      }
    } else {
      unShow = item.task_status > 20 ? true : false;
      if (this.source === Entry.projectChange) {
        unShow = item.old_task_status > '20' ? true : false;
      }
    }
    return !unShow;
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  hasTaskProportionCheck(data): boolean {
    let taskNos: Set<string> = new Set();
    if (
      Number(this.wbsService.projectInfo?.project_status) > 20 &&
      (this.source === Entry.card || this.source === Entry.collaborate)
    ) {
      // + 检查各一级任务的整棵树下，是否存在任务比重<100%
      let array: Array<string> = [];
      this.wbsService.pageDatas.forEach((element) => {
        const arr: Array<string> = [];
        const flag: Array<string> = [];
        this.getUpperTask(element, arr, flag);
        if (flag[0]) {
          array = [...array, ...arr];
        }
      });
      taskNos = new Set([...array].filter((v) => v !== ''));
    }
    return taskNos.has(data.task_no);
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  getUpperTask(children, array, flag) {
    if (children) {
      array.push(children.task_no);
      if (children.task_proportion < 1) {
        flag.push(true);
      }
      if (children.children.length) {
        children.children.forEach((v) => {
          this.getUpperTask(v, array, flag);
        });
      }
    }
  }
}
