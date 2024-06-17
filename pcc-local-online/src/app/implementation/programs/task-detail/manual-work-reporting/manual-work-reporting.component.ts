import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core';
import { FormGroup, FormBuilder, AbstractControl } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
  DynamicFormModel,
  cloneDeep,
  controlMarkShowErrorByHasValidator,
  DwFormArray,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicManualWorkReportingModel } from '../../../model/manual-work-reporting/manual-work-reporting.model';
import { ManualWorkReportingService } from './manual-work-reporting.service';
import { CommonService } from 'app/implementation/service/common.service';
import { APIService } from 'app/implementation/service/api.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as moment from 'moment';
import BigNumber from 'bignumber.js';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
@Component({
  selector: 'app-dynamic-manual-work-reporting',
  templateUrl: './manual-work-reporting.component.html',
  styleUrls: ['./manual-work-reporting.component.less'],
  providers: [ManualWorkReportingService],
})
export class ManualWorkReportingComponent
  extends DynamicFormControlComponent
  implements OnInit, AfterViewInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicManualWorkReportingModel;
  @Input() control: AbstractControl;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  dynamicGroup: FormGroup;
  dynamicLayout: DynamicFormLayout;
  dynamicModel: DynamicFormModel;

  // 手动报工，表格数据
  pageData: Array<any> = [];
  // 页面表格中对应的schema
  attachSchema: string;
  isShowSpin: boolean = true; // loading
  project_no: any;
  task_no: any;
  isVisible = false;
  list = [
    {
      employee_name: null,
      work_hours: 0,
      employee_no: null,
      department_name: null,
      department_no: null,
      user_id: null,
    },
  ];
  personListFormEvent: any;
  isShowTable: boolean = false;
  isActiveButton: boolean = false;
  callSubmit$ = new Subject<void>();

  ngAfterViewInit() {}

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    private formService: DynamicFormService,
    private messageService: NzMessageService,
    protected elementRef: ElementRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public fb: FormBuilder,
    public manualWorkReportingService: ManualWorkReportingService,
    public apiService: APIService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    // 任务负责人代为报工
    this.commonService
      .getMechanismParameters('reportWorkByTaskLiable')
      .toPromise()
      .then((res) => {
        const reportWorkByTaskLiable = res.data?.reportWorkByTaskLiable;
        if (reportWorkByTaskLiable === true) {
          this.isShowTable = true;
          this.initSubmitFn();
          this.initTemplateJson(this.list);
          this.changeRef.markForCheck();
        }
      });
  }

  initTemplateJson(data: Array<any>): void {
    const result = this.manualWorkReportingService.setTemplateJson(
      data,
      this.model.content?.executeContext
    );
    result.layout = result.layout && Array.isArray(result.layout) ? result.layout : [];
    result.content = result.content || {};
    const initializedData = this.formService.initData(
      result.layout as any,
      result.pageData,
      result.rules as any,
      result.style,
      result.content
    );
    this.dynamicLayout = initializedData.formLayout; // 样式
    this.dynamicModel = initializedData.formModel; // 组件数据模型
    this.dynamicGroup = initializedData.formGroup; // formGroup
    (this.dynamicGroup.get('manualWorkReporting') as DwFormArray).valueChanged.subscribe((v) => {
      if (v.operate && v.operate === 'add' && v.control.isNewRow) {
        v.control.get('work_hours').setValue('');
      }
    });
    this.changeRef.markForCheck();
  }

  initSubmitFn(): void {
    this.callSubmit$.pipe(debounceTime(200)).subscribe((change: any) => {
      this.getRowTData();
    });
  }

  callSubmitFn() {
    if (!this.isActiveButton) {
      controlMarkShowErrorByHasValidator(this.dynamicGroup, true);
      return;
    }
    this.callSubmit$.next();
  }

  // 打开
  showTable() {
    // if (
    //   ['0', '', 'null', 'undefined', null, undefined].includes(
    //     String(this.group?.get('project_info')?.value[0]?.work_hours)
    //   )
    // ) {
    //   this.messageService.info(
    //     this.translateService.instant(`dj-pcc-请输入正确的【工时】后再进行【代为报工】！`)
    //   );
    //   return;
    // }

    if (this.isShowTable) {
      this.isVisible = true;
      this.isActiveButton = false;
      const task_report_info = (this.group.get('project_info') as any).value[0].task_report_info;
      let list: any = [{ employee_name: null, work_hours: '' }];
      if (task_report_info?.length) {
        list = [];
        task_report_info.forEach((item) => {
          const obj = {};
          obj['work_hours'] = item.work_hours; // 报工工时
          obj['employee_no'] = item.executor_no; // 报工人员编号
          obj['employee_name'] = item.executor_name; //  报工人员名称
          obj['department_no'] = item.executor_department_no; //  报工人员部门编号
          obj['department_name'] = item.executor_department_name; //  报工人员部门名称
          list.push(obj);
        });
      }
      this.initTemplateJson(list);
    }
  }

  // 关闭
  closeMask() {
    this.isVisible = false;
    this.isActiveButton = false;
    this.initTemplateJson([{ employee_name: null, work_hours: 0 }]);
  }

  getChanges(event): void {
    const personList = this.dynamicGroup.get('manualWorkReporting')?.value;
    const nameList = personList.filter(
      (item) => item.employee_name !== null && item.employee_name !== ''
    );
    // 解决bug77324
    // if (nameList && nameList.length) {
    //   this.isActiveButton = this.dynamicGroup.get('manualWorkReporting')?.valid;
    // } else {
    //   this.isActiveButton = true;
    // }
    this.isActiveButton = this.dynamicGroup.get('manualWorkReporting')?.valid;
  }

  add(): void {
    (this.dynamicGroup?.get('manualWorkReporting') as any)._component.addRows([
      {
        employee_name: null,
        work_hours: '',
        employee_no: null,
        department_name: null,
        department_no: null,
        user_id: null,
      },
    ]);
  }

  async getRowTData() {
    const isworkHourZero = await this.commonService
      .getMechanismParameters('isworkHourZero')
      .toPromise()
      .then((res) => {
        // false, 表示不可为0
        return res.data?.isworkHourZero;
      });
    // 获取表格源数据，这里的'manualWorkReporting'为表格在form中的key值
    const personList = this.dynamicGroup.get('manualWorkReporting')?.value;
    const clone_work_hours_list = cloneDeep(personList).filter(
      (item) => item.work_hours !== null && item.work_hours !== ''
    );
    const clone_person_list = cloneDeep(personList).filter((item) => item.employee_name);
    // 解决bug77322
    // const result = personList
    //   .reduce((sum, item) => sum.plus(new BigNumber(item.work_hours)), new BigNumber(0))
    //   .toNumber();
    const pageData = cloneDeep(this.group?.get('project_info')?.value[0]);
    // 执行人信息有值的时候在走校验，解决bug77324
    if (personList?.length) {
      if (personList?.length !== clone_work_hours_list?.length) {
        this.messageService.info(this.translateService.instant(`dj-pcc-工时不允许为空！`));
        return;
      }
      if (isworkHourZero && clone_work_hours_list.find((item) => item.work_hours === 0)) {
        this.messageService.info(this.translateService.instant(`dj-pcc-工时不允许为0！`));
        return;
      }
      // if (result !== Number(pageData?.work_hours)) {
      //   this.messageService.info(
      //     this.translateService.instant(`dj-pcc-执行人报工总时数不等于工时！`)
      //   );
      //   return;
      // }

      if (personList?.length !== clone_person_list?.length) {
        this.messageService.info(this.translateService.instant(`dj-pcc-执行人名称必填项！`));
        return;
      }
    }

    let finderFlag = false;
    while (clone_person_list.length > 1 && !finderFlag) {
      const finderObj = clone_person_list.splice(0, 1)[0];
      for (let index = 0; index < clone_person_list.length; index++) {
        if (
          finderObj.employee_no === clone_person_list[index].employee_no &&
          finderObj.employee_name === clone_person_list[index].employee_name &&
          finderObj.department_no === clone_person_list[index].department_no &&
          finderObj.department_name === clone_person_list[index].department_name
        ) {
          finderFlag = true;
          break;
        }
      }
      if (finderFlag) {
        break;
      }
    }
    if (finderFlag) {
      this.messageService.info(this.translateService.instant(`dj-pcc-不能同时录入相同的执行人！`));
      return;
    }

    // task_report_info 任务报工资讯
    const employeeList = [];
    personList.forEach((item) => {
      const obj = {
        project_no: pageData.project_no,
        task_no: pageData.task_no,
        report_source: '10',
        // report_datetime: moment(new Date()).format('YYYY-MM-DD'),
        // report_work_hours: item.work_hours, // 报工工时
        // reporter_no: item.employee_no, // 报工人员编号
        // reporter_name: item.employee_name, //  报工人员名称
        // reporter_department_no: item.department_no, //  报工人员部门编号
        // reporter_department_name: item.department_name, //  报工人员部门名称
        // 按照标准前端要求，使用下面的字段进行传输
        report_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        work_hours: item.work_hours, // 报工工时
        executor_no: item.employee_no, // 报工人员编号
        executor_name: item.employee_name, //  报工人员名称
        executor_department_no: item.department_no, //  报工人员部门编号
        executor_department_name: item.department_name, //  报工人员部门名称
      };
      employeeList.push(obj);
    });
    const work_hours_sum = personList
      .reduce((sum, item) => sum.plus(new BigNumber(item.work_hours)), new BigNumber(0))
      .toNumber();
    (this.group.get('project_info') as any).controls.forEach((e) => {
      e.setControl('task_report_info', this.fb.array(employeeList));
      e.get('work_hours').setValue(work_hours_sum);
    });

    // 关闭开窗
    this.closeMask();
  }

  clickContent(ev: any): void {
    ev.stopPropagation();
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
