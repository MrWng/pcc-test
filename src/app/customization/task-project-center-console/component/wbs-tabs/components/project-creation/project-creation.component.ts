import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  SimpleChanges,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { AddSubProjectCardService } from '../../../add-subproject-card/add-subproject-card.service';
import { CommonService } from '../../../../service/common.service';
import * as moment from 'moment';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { ProjectCreationService } from './project-creation.service';
import { cloneDeep } from '@ng-dynamic-forms/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DwUserService } from '@webdpt/framework/user';
import { WbsTabsService } from '../../wbs-tabs.service';
import { UploadAndDownloadService } from '../../../../service/upload.service';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.less'],
  providers: [ProjectCreationService],
})
export class ProjectCreationComponent implements OnInit, OnChanges, OnDestroy {
  projectInfo: any;
  validateForm: FormGroup;
  personList: any[] = [];
  saleList: any[] = [];
  activeStatus: boolean = false;
  copyProjectInfo: any;
  backupsProjectInfo: any; // 潜在转正式项目，为【转正式选项】值为[3.潜在项目直接转正式项目]准备的备份数据，勿动
  toBeFormalOption: number = 0;
  updateSubmitSuccess: boolean = false; // 提交修改表单信息，true：成功
  potentialStatusList: Array<any> = []; // 转正式选项，数据集合
  showProjectNo: boolean = false;
  actionList: Array<any> = [];
  originPersonList: any = []; // 记录原始的负责人数据
  salePersonList: any = []; // 记录原始业务人数据
  show_project_set_no: string;
  show_project_type_no: string;
  projectType: string = '';
  projectSetNo: string = '';
  isHasRerverse: boolean = false;
  auto_coding_mode = '';
  fileList: any[] = [];
  isSpinning: boolean = false;
  previewVisible: boolean = false;
  previewImage = '';
  person_info: any = [];
  isChangeTypeNo = false;
  projectNoFind: boolean = false; // 项目编号，错误提示信息，“项目编号已存在”是否显示管控
  projectNoHasGroundEnd: string = '';
  plan_summary_qty: string = ''; // 預計總數量
  shippingInfoListLength: number = 0; // 出货信息，笔数
  hasT100: boolean = false; // 存在T100的任务，hasT100=true

  @Input() potentialStatus: number; // 是否点击潜在按钮 0: 潜在 1: 取消 2:已转正式
  @Input() tabIndex: any;

  @Output() successTransfer = new EventEmitter();
  @Output() changeConfig = new EventEmitter();
  hasSubmit = true
  private projectTypeChange$ = new Subject<any>();

  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private addSubProjectCardService: AddSubProjectCardService,
    private fb: FormBuilder,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    public projectCreationService: ProjectCreationService,
    private modalService: NzModalService,
    private userService: DwUserService,
    private messageService: NzMessageService,
    protected wbsTabsService: WbsTabsService,
    public uploadService: UploadAndDownloadService,
    public wbsService: DynamicWbsService,
  ) { }

  ngOnInit(): void {
    this.potentialStatusList = [
      {
        name: this.translateService.instant('dj-pcc-潜在项目结案并发起新的正式项目'),
        value: '1',
      },
      {
        name: this.translateService.instant('dj-pcc-潜在项目任务继续执行并转为正式项目'),
        value: '2',
      },
      {
        name: this.translateService.instant('dj-pcc-潜在项目直接转正式项目'),
        value: '3',
      },
    ];
    this.actionList = [
      {
        name: this.translateService.instant('dj-pcc-系统自动编码'),
        value: '1',
      },
      {
        name: this.translateService.instant('dj-pcc-ERP项目编号'),
        value: '2',
      },
    ];
    this.projectType = this.translateService.instant('dj-pcc-请选择项目类型>');
    this.projectSetNo = this.translateService.instant('dj-default-请选择项目集编号>');
    this.wbsService.projectInfo.control_type =
      this.wbsService.projectInfo.control_type || '';
    this.wbsService.projectInfo.budget_planning =
      this.wbsService.projectInfo.budget_planning || false;
    this.fileList = this.wbsService.projectInfo.attachment?.data || [];
    this.projectInfo = cloneDeep(this.wbsService.projectInfo);
    this.show_project_set_no =
      cloneDeep(this.projectInfo.project_set_name ? this.projectInfo.project_set_name : '') +
      cloneDeep(this.projectInfo.project_set_no ? this.projectInfo.project_set_no : '');
    this.getProjectSetInfo();
    this.show_project_type_no =
      cloneDeep(this.projectInfo.project_type_name ? this.projectInfo.project_type_name : '') +
      cloneDeep(this.projectInfo.project_type_no ? this.projectInfo.project_type_no : '');

    this.copyProjectInfo = cloneDeep(this.projectInfo);
    this.getKeyDate(this.copyProjectInfo);
    this.projectInfo.to_be_formal_option = '2';
    this.projectInfo.actual_start_date_copy = null;
    const required = [
      'project_name',
      'plan_start_date',
      'plan_finish_date',
      'project_days',
    ];
    if (this.projectInfo.actual_start_date) {
      this.projectInfo.actual_start_date = moment(this.projectInfo.actual_start_date).format(
        'YYYY/MM/DD'
      );
    } else {
      this.copyProjectInfo.actual_start_date = null;
    }
    if (this.projectInfo.actual_finish_date) {
      this.projectInfo.actual_finish_date = moment(this.projectInfo.actual_finish_date).format(
        'YYYY/MM/DD'
      );
    }
    this.getKeyDate(this.projectInfo);
    this.backupsProjectInfo = cloneDeep(this.projectInfo);
    this.backupsProjectInfo.show_project_type_no = this.show_project_type_no; // 项目类型
    this.backupsProjectInfo.show_project_set_no = this.show_project_set_no; // 项目集编号

    const validateForm = new FormGroup({});
    Object.entries(this.projectInfo).forEach(([key, value]): void => {
      if (required.indexOf(key) > -1) {
        validateForm.addControl(key, new FormControl(value, Validators.required));
      } else {
        validateForm.addControl(key, new FormControl(value));
      }
    });
    validateForm.addControl('plan_summary_qty', new FormControl(''));
    // 添加自动编码方式
    validateForm.addControl('actionCode', new FormControl('1'));
    validateForm.addControl('coding_rule_no', new FormControl(''));
    validateForm.addControl('coding_rule_name', new FormControl(''));
    // 无数据添加默认值
    if (!this.projectInfo.eoc_company_id) {
      this.copyProjectInfo.eoc_company_name = '';
      this.copyProjectInfo.eoc_company_id = '';
      validateForm.addControl('eoc_company_name', new FormControl(''));
      validateForm.addControl('eoc_company_id', new FormControl(''));
    }
    if (!this.projectInfo.actual_start_date) {
      validateForm.addControl('actual_start_date', new FormControl(null));
    }
    if (!this.projectInfo.actual_finish_date) {
      validateForm.addControl('actual_finish_date', new FormControl(null));
    }
    if (!this.projectInfo.key_date) {
      validateForm.addControl('key_date', new FormControl(null));
    }
    if (!this.projectInfo.enter_scene_date) {
      validateForm.addControl('enter_scene_date', new FormControl(null));
    }
    this.validateForm = validateForm;
    this.validateForm.controls['project_no'].disable();
    // this.validateForm.get('project_no').disable();
    this.validateForm.controls['project_template_no'].disable();
    this.validateForm.controls['potential_project_no'].disable();
    this.validateForm.controls['actual_start_date'].disable();
    this.validateForm.controls['actual_start_date_copy'].disable();
    this.validateForm.controls['actual_finish_date'].disable();
    this.getPlanSummaryQty();
    this.validateForm.controls['plan_summary_qty'].disable();
    if (!this.wbsService.projectInfo.budget_planning) {
      this.validateForm.controls['control_type'].disable();
    }
    if (['60', '40'].includes(this.wbsService.projectInfo?.project_status)) {
      this.validateForm.controls['customer_shortname'].disable();
    }
    if (this.wbsService.projectInfo?.project_status === '50') {
      this.validateForm.disable();
    }
    this.querySalePersonList();
    this.changeFormValue();
    this.getTenantProductOperationList();
    this.monitorProjectTypeChange();
  }

  ngOnDestroy(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    this.showProjectNo = false;
    this.projectNoFind = false;
    this.projectNoHasGroundEnd = '';
    if (this.updateSubmitSuccess) {
      // 修改项目信息后，重新获取项目信息
      this.projectInfo = cloneDeep(this.wbsService.projectInfo);
      this.getProjectSetInfo();
      this.getKeyDate(this.projectInfo);
      this.copyProjectInfo = cloneDeep(this.projectInfo);
      this.backupsProjectInfo = cloneDeep(this.projectInfo);
      this.updateSubmitSuccess = false;
      this.show_project_type_no = (this.projectInfo.project_type_name ? this.projectInfo.project_type_name : '') +
        (this.projectInfo.project_type_no ? this.projectInfo.project_type_no : '');
      this.show_project_set_no = (this.projectInfo.project_set_name ? this.projectInfo.project_set_name : '') +
        (this.projectInfo.project_set_no ? this.projectInfo.project_set_no : '');
      this.backupsProjectInfo.show_project_type_no = this.show_project_type_no; // 项目类型
      this.backupsProjectInfo.show_project_set_no = this.show_project_set_no; // 项目集编号
    }
    if (changes.potentialStatus && changes.potentialStatus.currentValue === 1) {
      this.validateForm.get('project_no').reset();
      this.validateForm.get('project_name').reset();
      this.validateForm.get('to_be_formal_option').setValue('2');
      this.validateForm.get('potential_project_no').setValue(this.copyProjectInfo.project_no);
      this.validateForm.get('key_date').setValue(this.copyProjectInfo.key_date);
      this.activeStatus = false;
      if (this.wbsTabsService.hasGroundEnd === 'N') {
        this.actionList = [
          {
            name: this.translateService.instant('dj-pcc-系统自动编码'),
            value: '1',
          },
        ];
      }
    } else if (
      changes.potentialStatus &&
      (changes.potentialStatus.currentValue === 0 || changes.potentialStatus.currentValue === 2)
    ) {
      this.showProjectNo = true;
      if (this.validateForm) {
        // this.validateForm.controls['project_no'].disable();
        this.validateForm.get('project_no').disable();
        this.validateForm.get('project_no').setValue(this.copyProjectInfo.project_no);
        this.validateForm.get('key_date').setValue(this.copyProjectInfo.key_date);
        this.validateForm.get('to_be_formal_option').setValue(null);
        this.validateForm.get('project_name').setValue(this.copyProjectInfo.project_name);
        this.validateForm.get('potential_project_no').setValue('');
        this.validateForm.get('coding_rule_no').reset();
        this.validateForm.get('coding_rule_name').reset();
        this.validateForm.get('actionCode').patchValue('1');
        this.validateForm.get('eoc_company_name').setValue(this.copyProjectInfo.eoc_company_name);
        this.validateForm.get('eoc_company_id').setValue(this.copyProjectInfo.eoc_company_id);
        this.validateForm.get('project_property').setValue(this.copyProjectInfo.project_property);
        if (changes.potentialStatus.currentValue === 0) {
          this.projectInfo.project_type_name = this.backupsProjectInfo.project_type_name;
          this.projectInfo.project_type_no = this.backupsProjectInfo.project_type_no;
          this.show_project_type_no = this.backupsProjectInfo.show_project_type_no; // 项目类型
          this.isChangeTypeNo = false;
          this.validateForm.get('project_days').setValue(this.backupsProjectInfo.project_days); // 项目天数
          this.validateForm.get('plan_start_date').setValue(this.backupsProjectInfo.plan_start_date);
          this.validateForm.get('plan_finish_date').patchValue(this.backupsProjectInfo.plan_finish_date);
          this.validateForm.get('customer_shortname').setValue(this.backupsProjectInfo.customer_shortname); // 客户简称
        }
        this.activeStatus = false;
      }
    }
    this.changeRef.markForCheck();
  }

  /**
   * 接口返回不正确的日期，前端做处理，不展示
   * @param param 表单对象
   */
  getKeyDate(param: any): void {
    if (param.key_date) {
      if ((param.key_date.indexOf('1900/01/01') > -1) || (param.key_date.indexOf('1900-01-01') > -1)
        || (param.key_date.indexOf('9998-12-31') > -1) || (param.key_date.indexOf('9998/12/31') > -1)) {
        param.key_date = '';
      } else {
        param.key_date = moment(param.key_date).format('YYYY/MM/DD');
      }
    }
  }

  // 入參.查詢模式=1.查詢、專案編號取得回參.預計總數量
  getPlanSummaryQty() {
    const params = {
      query_mode: '1',
      project_info: [{ project_no: this.wbsService.projectInfo.project_no }]
    };
    this.commonService.getInvData('project.batch.shipment.info.get', params)
      .subscribe(async (resProcess: any): Promise<void> => {
        // 入參.查詢模式=1.查詢、專案編號取得回參.預計總數量
        if (resProcess.data && resProcess.data.project_info) {
          this.plan_summary_qty = resProcess.data.project_info.plan_summary_qty;
          this.shippingInfoListLength = resProcess.data.project_info.shipping_info
            ? resProcess.data.project_info.shipping_info.length : 0;
        }
        if (!this.plan_summary_qty) {
          this.plan_summary_qty = '0';
        }
        this.validateForm.get('plan_summary_qty').setValue(this.plan_summary_qty);
      });
  }

  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue || !this.validateForm.getRawValue().plan_start_date) {
      return false;
    }
    return (
      moment(endValue).format('YYYY-MM-DD') <
      moment(this.validateForm.getRawValue().plan_start_date).format('YYYY-MM-DD')
    );
  };

  changeFormValue(): void {
    this.validateForm.valueChanges.subscribe((form: any): void => {
      if (this.wbsService.projectInfo?.project_status !== '50') {
        if (!this.validateForm.dirty) {
          return;
        }
        if (this.potentialStatus === 1) {
          if (this.validateForm.getRawValue().actionCode === '1') {
            if (this.auto_coding_mode === '7' && !this.validateForm.getRawValue().project_no) {
              this.activeStatus = false;
              return;
            }
            if (!this.validateForm.getRawValue().coding_rule_no) {
              this.activeStatus = false;
              return;
            }
          } else {
            if (!this.validateForm.getRawValue().project_no) {
              this.activeStatus = false;
              return;
            }
          }
          if (this.wbsTabsService.hasGroundEnd === 'Y') {
            if (!this.validateForm.getRawValue().eoc_company_id) {
              this.activeStatus = false;
              return;
            }
          }
        }
        this.activeStatus = true;
      }
    });
  }

  selectDirty() {
    if (this.potentialStatus === 1) {
      if (this.validateForm.getRawValue().actionCode === '1') {
        if (this.auto_coding_mode === '7' && !this.validateForm.getRawValue().project_no) {
          this.activeStatus = false;
          return;
        }
        // 编码规则
        if (!this.validateForm.getRawValue().coding_rule_no) {
          return;
        }
      } else {
        if (!this.validateForm.getRawValue().project_no) {
          this.activeStatus = false;
          return;
        }
      }
      if (this.wbsTabsService.hasGroundEnd === 'Y') {
        if (!this.validateForm.getRawValue().eoc_company_id) {
          this.activeStatus = false;
          return;
        }
      }
    }
    this.activeStatus = true;
  }

  querySalePersonList() {
    this.addSubProjectCardService.queryChargePersonList().subscribe((res: any) => {
      const list = res.data.list.filter((item): void => item.status && item.id);
      this.salePersonList = list;
      if (list.length > 0) {
        this.saleList = this.addSubProjectCardService.mergeUserList(this.salePersonList);
      }
    });
  }

  queryChargePersonList(): void {
    if (this.wbsTabsService.personList) {
      this.setPeopleList(this.wbsTabsService.personList);
      return;
    }
    const params = {
      project_member_info: [
        {
          project_no: this.validateForm.getRawValue().project_no,
        },
      ],
    };
    this.commonService
      .getInvData('employee.info.process', params)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          const list = res.data.project_member_info;
          this.wbsTabsService.personList = list;
          this.setPeopleList(list);
        }
      });
  }
  setPeopleList(list) {
    this.originPersonList = [];
    let hasPerson = false;
    list.forEach((res) => {
      const arr = {
        deptId: res.department_no,
        deptName: res.department_name,
        id: res.employee_no,
        name: res.employee_name,
      };
      if (
        res.department_no === this.validateForm.getRawValue().project_leader_dept_no &&
        res.employee_no === this.validateForm.getRawValue().project_leader_code
      ) {
        hasPerson = true;
        this.validateForm.get('project_leader_info').patchValue(arr);
      }
      this.originPersonList.push(arr);
    });
    if (!hasPerson) {
      this.person_info = [
        {
          deptId: this.validateForm.getRawValue().project_leader_dept_no,
          deptName: this.validateForm.getRawValue().project_leader_dept_name,
          id: this.validateForm.getRawValue().project_leader_code,
          name: this.validateForm.getRawValue().project_leader_name,
          bigId:
            this.validateForm.getRawValue().project_leader_dept_no +
            ';' +
            this.validateForm.getRawValue().project_leader_code,
        },
      ];
      this.validateForm.get('project_leader_info').patchValue(this.person_info[0]);
    }
    if (list.length > 0) {
      this.personList = this.addSubProjectCardService.mergeUserList(this.originPersonList);
    }
    this.changeRef.markForCheck();
  }

  endTimeClick(): void {
    this.isHasRerverse = true;
  }
  rerverseClick(): void {
    this.isHasRerverse = false;
  }

  endTimeChange($event: any): void {
    if (!this.isHasRerverse) {
      return;
    }
    const date = $event ? moment($event).format('YYYY-MM-DD') : '';
    this.validateForm.get('plan_finish_date').patchValue(date);
    const startTime = moment(this.validateForm.getRawValue().plan_start_date).format('YYYY-MM-DD');
    const endTime = moment(this.validateForm.getRawValue().plan_finish_date).format('YYYY-MM-DD');
    if ($event) {
      this.changeEndTime(startTime, endTime);
    }
    this.selectDirty();
    this.changeRef.markForCheck();
  }

  changeEndTime(startTime, endTime): void {
    const start = moment(startTime);
    const end = moment(endTime);
    const day = end.diff(start, 'day');
    if (day) {
      this.validateForm.get('project_days').patchValue(day + 1);
    }
  }

  projectDaysOnChange($event: any): void {
    if (this.isHasRerverse || isNaN($event)) {
      return;
    }
    const startTime = this.validateForm.getRawValue().plan_start_date;
    if (!startTime) {
      return;
    }
    this.ComputingTime(this.validateForm.getRawValue().project_days, startTime);
  }

  startTimeChange($event: any): void {
    if (this.isHasRerverse) {
      return;
    }
    const date = $event ? moment($event).format('YYYY-MM-DD') : '';
    this.validateForm.get('plan_start_date').patchValue(date);
    if ($event) {
      this.ComputingTime(this.validateForm.getRawValue().project_days, $event);
    }
    this.selectDirty();
    this.changeRef.markForCheck();
  }

  ComputingTime(qty: string, startTime: any): void {
    if (isNaN(Number(qty)) || Number(qty) <= 0) {
      return;
    }
    const start_time = moment(startTime).format('YYYY-MM-DD'); // moment().format('YYYY-MM-DD');
    const day = Number(qty);
    if (day < 1) {
      return;
    }
    // 页面渲染时，根据【项目天数】-1，计算得到【计划起讫时间】的结束时间
    const end_time = moment(start_time).add(day - 1, 'days').format('YYYY-MM-DD');
    this.validateForm.get('plan_finish_date').patchValue(end_time);
  }

  // 通过业务人员号码反向查找姓名
  findLiablePersonName(params: any): void {
    this.salePersonList.forEach((person: any): void => {
      if (person.id === params.sales_no) {
        const name = cloneDeep(person.name);
        params.sales_name = name;
      }
    });
  }

  // 提交，项目基础信息维护，表单
  async updateSubmit(): Promise<void> {
    this.hasSubmit = false;
    this.changeRef.markForCheck();
    if (
      this.validateForm.invalid ||
      !this.activeStatus ||
      this.projectNoFind || (this.projectNoHasGroundEnd !== '') ||
      (!this.show_project_type_no && this.wbsService.projectInfo?.project_status === '10')
    ) {
      this.hasSubmit = true;
      this.changeRef.markForCheck();
      return;
    }
    const param = this.validateForm.getRawValue();
    if ((param.to_be_formal_option !== '3') && (this.toBeFormalOption !== 3)) {
      // -------- 优化， 包起来
      if (
        moment(param.plan_finish_date).format('YYYY-MM-DD') <
        moment(param.plan_start_date).format('YYYY-MM-DD')
      ) {
        this.messageService.error(
          this.translateService.instant('dj-default-开始时间必须早于结束时间')
        );
        this.hasSubmit = true;
        this.changeRef.markForCheck();
        return;
      }
      if (this.projectInfo.hasOwnProperty('project_set_plan_finish_date')
        && (this.projectInfo.project_set_plan_finish_date !== undefined)
        && (this.projectInfo.project_set_plan_finish_date !== '')
        && (moment(param.plan_finish_date).format('YYYY-MM-DD')
          > moment(this.projectInfo.project_set_plan_finish_date).format('YYYY-MM-DD'))
      ) {
        this.modalService.info({
          nzTitle: this.translateService.instant('dj-c-提示'),
          nzContent: this.translateService.instant(
            'dj-default-项目结束日期不可大于项目集结束日期'
          ),
          nzOkText: this.translateService.instant('dj-default-我知道了'),
          nzClassName: 'confirm-modal-center-sty',
          nzOnOk: (): void => { },
        });
        this.hasSubmit = true;
        this.changeRef.markForCheck();
        return;
      }
    }

    param.sync_steady_state = this.wbsTabsService.hasGroundEnd;
    param.operation_no = this.userService.getUser('userId');
    param.operation_name = this.userService.getUser('userName');
    param.contact_tel_no = param.contact_tel_no ?? '';
    param.contact_tel_no = String(param.contact_tel_no);
    this.getProjectInfo().subscribe(async (res: any): Promise<void> => {
      this.wbsService.projectInfo = res.data.project_info[0] ?? [];
      param.project_status = this.wbsService.projectInfo?.project_status;
      this.changeRef.markForCheck();
      let eoc_company_id = this.projectInfo.eoc_company_id;
      if ((this.potentialStatus === 1) && (this.toBeFormalOption !== 3)) {
        this.transferToFormal();
      } else {
        let params = {};
        if ((param.to_be_formal_option === '3') && (this.toBeFormalOption === 3)) {
          const opton3Param = this.wbsService.projectInfo || param;
          opton3Param.sync_steady_state = this.wbsTabsService.hasGroundEnd;
          opton3Param.operation_no = this.userService.getUser('userId');
          opton3Param.operation_name = this.userService.getUser('userName');
          opton3Param.to_be_formal_option = '3';
          opton3Param.control_mode = '3'; // 0.无 3.潜在项目直接转正式项目
          opton3Param.project_property = '20'; // 项目性质
          eoc_company_id = this.wbsService.projectInfo.eoc_company_id;
          params = {
            project_info: [opton3Param],
          };
        } else {
          this.findLiablePersonName(param);
          param.plan_start_date = moment(param.plan_start_date).format('YYYY-MM-DD');
          param.plan_finish_date = moment(param.plan_finish_date).format('YYYY-MM-DD');
          param.project_template_no = this.projectInfo.project_template_no;
          param.project_set_no = this.projectInfo.project_set_no;
          param.project_type_no = this.projectInfo.project_type_no;
          param.project_attachment = {
            data: this.fileList,
            row_data: this.validateForm.getRawValue().project_no + ';',
          };
          param.key_date = !!param.key_date ? moment(param.key_date).format('YYYY-MM-DD') : '';
          param.control_mode = '0'; // 0.无 3.潜在项目直接转正式项目
          Reflect.deleteProperty(param, 'project_type_name');
          Reflect.deleteProperty(param, 'project_set_name');
          Reflect.deleteProperty(param, 'potential_project_no');
          Reflect.deleteProperty(param, 'actual_start_date');
          Reflect.deleteProperty(param, 'actual_start_date_copy');
          Reflect.deleteProperty(param, 'actual_finish_date');
          params = {
            project_info: [param],
          };
        }
        this.commonService
          .getInvData('project.info.update', params, eoc_company_id)
          .subscribe(async (res3: any): Promise<void> => {
            if (res3.code === 0) {
              this.activeStatus = false;
              this.wbsService.projectInfo.remark = param.remark;
              this.projectCreationService.getProjectInfo();
              this.getProjectSetInfo();
              if ((param.to_be_formal_option === '3') && (this.toBeFormalOption === 3)) {
                this.potentialStatus = 2; // 潜在直接转为正式项目
                this.successTransfer.emit(this.potentialStatus);
              } else {
                this.isChangeProjectNo(param);
              }
              this.updateSubmitSuccess = true;
              this.wbsService.changeWbs$.next();
            }
            this.hasSubmit = true;
            this.changeRef.markForCheck();
          },
            (err: any): any => {
              this.hasSubmit = true;
              this.changeRef.markForCheck();
            });
      }
    }, (err: any): any => {
      this.hasSubmit = true;
      this.changeRef.markForCheck();
    });
  }

  /**
   * 获取项目信息
   */
  getProjectInfo(): Observable<any> {
    const project_info = [
      {
        project_no: this.wbsService.project_no,
      },
    ];
    return this.commonService.getInvData('bm.pisc.project.get', { project_info });
  }

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
 * 是否变更项目类型
 * @param param
 */
  isChangeProjectNo(param: any): void {
    if (this.isChangeTypeNo) {
      this.modalService.confirm({
        nzTitle: null,
        nzContent: this.translateService.instant(
          'dj-pcc-项目类型已变更，是否需要同步更新已排WBS的需要交付物和需要签核？'
        ),
        nzCancelText: this.translateService.instant('dj-default-否'),
        nzOkText: this.translateService.instant('dj-default-是'),
        nzClassName: 'confirm-modal-center-sty confirm-modal-center-content-sty',
        nzOnOk: (): void => {
          this.getProjectType(param.project_type_no);
        },
      });
      this.isChangeTypeNo = false;
    }

  }

  /**
 * 获取项目类型
 */
  getProjectType(project_type_no: string): void {
    const params = {
      project_type_info: [
        {
          project_type_no: project_type_no,
        },
      ],
    };
    this.commonService
      .getInvData('bm.pisc.project.type.get', params)
      .subscribe((res: any): void => {
        const param = {
          is_approve: res.data.project_type_info[0].is_approve,
          is_attachment: res.data.project_type_info[0].is_attachment,
        };
        this.changeConfig.emit(param);
        this.changeRef.markForCheck();
      });
  }

  // 提交按钮的权限管控
  isActive(): boolean {
    if (this.wbsService.projectInfo?.project_status === '10') {
      return this.activeStatus && !this.validateForm.invalid
        && !!this.show_project_type_no && !this.projectNoFind && (this.projectNoHasGroundEnd === '');
    } else {
      return this.activeStatus && !this.validateForm.invalid && !this.projectNoFind && !this.projectNoHasGroundEnd;
    }
  }

  // 切换，转正式选项
  potentialStatusChange(event?: any) {
    // 潜在转为正式项目
    // 转正式选项 = 3.
    if (event === '3') {
      if (this.validateForm) {
        this.toBeFormalOption = 3; // 【转正式选项】 == 3
        this.projectNoFind = false;
        this.projectNoHasGroundEnd = '';
        // if (this.projectInfo.project_type_no === this.backupsProjectInfo.project_type_no) {
        //   this.isChangeTypeNo = false;
        // }
        this.projectInfo.project_type_name = this.backupsProjectInfo.project_type_name;
        this.projectInfo.project_type_no = this.backupsProjectInfo.project_type_no;
        this.show_project_type_no = this.backupsProjectInfo.show_project_type_no; // 项目类型
        this.validateForm.get('eoc_company_name').setValue(this.backupsProjectInfo.eoc_company_name); // 归属公司别
        this.validateForm.get('eoc_company_id').setValue(this.backupsProjectInfo.eoc_company_id);
        this.validateForm.get('actionCode').patchValue('1'); // 项目编号编码方式
        this.validateForm.get('coding_rule_no').reset();
        this.validateForm.get('coding_rule_name').reset(); // 编码规则
        this.validateForm.get('project_no').setValue(this.backupsProjectInfo.project_no); // 项目编号
        this.validateForm.get('project_no').disable();
        this.validateForm.get('project_name').setValue(this.backupsProjectInfo.project_name);
        this.validateForm.get('project_name').disable();
        this.validateForm.get('project_days').setValue(this.backupsProjectInfo.project_days); // 项目天数
        this.validateForm.get('project_days').disable();
        // this.validateForm.get('to_be_formal_option').enable();
        this.validateForm.get('plan_start_date').setValue(this.backupsProjectInfo.plan_start_date);
        this.validateForm.get('plan_finish_date').patchValue(this.backupsProjectInfo.plan_finish_date);
        this.validateForm.get('project_property').setValue('20'); // 项目性质
        this.validateForm.get('project_introduction').setValue(this.backupsProjectInfo.project_introduction); // 项目简介
        this.validateForm.get('project_introduction').disable();
        this.validateForm.get('enter_scene_date').patchValue(this.backupsProjectInfo.enter_scene_date); // 进场日期
        // this.validateForm.get('enter_scene_date').disable();
        this.validateForm.get('contract_no').setValue(this.backupsProjectInfo.contract_no); // 合同编号
        this.validateForm.get('contract_no').disable();
        this.validateForm.get('sales_no').setValue(this.backupsProjectInfo.sales_no); // 业务员
        this.validateForm.get('sales_no').disable();
        this.validateForm.get('sales_name').setValue(this.backupsProjectInfo.sales_name);

        // 项目集编号
        this.show_project_set_no = this.backupsProjectInfo.show_project_set_no;
        this.deleteFileForProject();
        // this.getProjectSetInfo();
        // this.projectInfo.project_set_leader_name = this.backupsProjectInfo.project_set_leader_name;
        // this.projectInfo.project_set_leader_dept_name = this.backupsProjectInfo.project_set_leader_dept_name;
        this.projectInfo.project_set_plan_start_date = this.backupsProjectInfo.project_set_plan_start_date;
        this.projectInfo.project_set_plan_finish_date = this.backupsProjectInfo.project_set_plan_finish_date;

        this.validateForm.get('customer_no').setValue(this.backupsProjectInfo.customer_no); // 客户编号
        this.validateForm.get('customer_no').disable();
        this.validateForm.get('customer_shortname').setValue(this.backupsProjectInfo.customer_shortname); // 客户简称
        this.validateForm.get('customer_shortname').disable();
        this.validateForm.get('project_contact_name').setValue(this.backupsProjectInfo.project_contact_name); // 项目联系人
        this.validateForm.get('project_contact_name').disable();
        this.validateForm.get('contact_tel_no').setValue(this.backupsProjectInfo.contact_tel_no); // 联系人电话
        this.validateForm.get('contact_tel_no').disable();
        this.validateForm.get('address').setValue(this.backupsProjectInfo.address); // 联系人地址
        this.validateForm.get('address').disable();
        this.validateForm.get('remarks').setValue(this.backupsProjectInfo.remarks); // 备注
        this.validateForm.get('remarks').disable();
        this.validateForm.get('key_date').setValue(this.backupsProjectInfo.key_date); // 预计出货日
        // this.validateForm.get('key_date').disable();
        this.validateForm.get('remark').setValue(this.backupsProjectInfo.remark); // 特别资讯
        this.validateForm.get('remark').disable();
        this.validateForm.get('budget_planning').setValue(this.backupsProjectInfo.budget_planning); // 预算编制
        this.validateForm.get('budget_planning').disable();
        this.validateForm.get('control_type').setValue(this.backupsProjectInfo.control_type); // 预算编制 - 选项
        this.validateForm.get('control_type').disable();
        this.fileList = this.backupsProjectInfo.attachment?.data || []; // 项目附件

        this.activeStatus = true;
      }
    }
    // 切换【转正式选项】 由 3  --切换--> 1 或 2 或 【取消】
    if ((this.validateForm?.get('to_be_formal_option').value !== '3') && (this.toBeFormalOption === 3)) {
      if (!this.showProjectNo) {
        this.validateForm.get('project_no').reset();
        this.validateForm.get('project_no').disable();
      }
      this.validateForm.get('project_name').reset();
      this.validateForm.get('project_name').enable();
      this.validateForm.get('project_days').enable();
      this.validateForm.get('plan_start_date').enable();
      this.validateForm.get('plan_finish_date').enable();
      this.validateForm.get('project_property').setValue('10'); // 项目性质
      this.validateForm.get('project_introduction').enable();
      this.validateForm.get('enter_scene_date').enable(); // 进场日期
      this.validateForm.get('contract_no').enable(); // 合同编号
      this.validateForm.get('sales_no').enable(); // 业务员
      // 项目集编号
      this.validateForm.get('customer_no').enable(); // 客户编号
      this.validateForm.get('customer_shortname').enable(); // 客户简称
      this.validateForm.get('project_contact_name').enable(); // 项目联系人
      this.validateForm.get('contact_tel_no').enable(); // 联系人电话
      this.validateForm.get('address').enable(); // 联系人地址
      this.validateForm.get('remarks').enable(); // 备注
      this.validateForm.get('key_date').enable(); // 预计出货日
      this.validateForm.get('remark').enable(); // 特别资讯
      this.validateForm.get('budget_planning').enable(); // 预算编制
      this.validateForm.get('control_type').disable(); // 预算编制 - 选项
      this.toBeFormalOption = 0;

      this.activeStatus = false;
      if (this.wbsTabsService.hasGroundEnd === 'N') {
        this.actionList = [
          {
            name: this.translateService.instant('dj-pcc-系统自动编码'),
            value: '1',
          },
        ];
      }
    }
    this.changeRef.markForCheck();
  }

  // 潜在转为正式项目
  transferToFormal(): void {
    const param = this.validateForm.getRawValue();
    param.plan_start_date = moment(param.plan_start_date).format('YYYY-MM-DD');
    param.plan_finish_date = moment(param.plan_finish_date).format('YYYY-MM-DD');
    // 潜在项目编号
    param.potential_project_no = this.copyProjectInfo.project_no;
    param.project_set_no = this.projectInfo.project_set_no;
    param.project_type_no = this.projectInfo.project_type_no;
    param.attachment = {
      data: this.fileList,
      row_data: this.validateForm.getRawValue().project_no + ';',
    };
    if (param.to_be_formal_option === '1') {
      param.potential_project_status = '60';
    } else {
      // 潜在项目状态
      param.potential_project_status = this.wbsService.projectInfo?.project_status;
    }
    param.sync_steady_state = this.wbsTabsService.hasGroundEnd;
    param.project_property = '20';
    param.project_status = '10';
    // 专案编号编码方式
    if (param.actionCode === '2') {
      delete param.coding_rule_no;
    }
    param.key_date = !!param.key_date ? moment(param.key_date).format('YYYY-MM-DD') : '';
    Reflect.deleteProperty(param, 'project_type_name');
    Reflect.deleteProperty(param, 'project_set_name');
    if (!param.actual_start_date) {
      Reflect.deleteProperty(param, 'actual_start_date');
    }
    Reflect.deleteProperty(param, 'actual_start_date_copy');
    Reflect.deleteProperty(param, 'actual_finish_date');
    Reflect.deleteProperty(param, 'pause_date');
    param.operation_no = this.userService.getUser('userId');
    param.operation_name = this.userService.getUser('userName');
    // 潜在转正式，功能 4
    if (param.to_be_formal_option && (param.actionCode === '1')) {
      param.project_no = param.project_no;
    }
    const params = {
      to_be_formal_option: param.to_be_formal_option,
      project_info: [param],
    };
    this.commonService
      .getInvData(
        'potential.project.transfer.formal.process',
        params,
        this.projectInfo.eoc_company_id
      )
      .subscribe(async (res: any): Promise<void> => {
        this.hasSubmit = true;
        this.changeRef.markForCheck();
        if (res.code === 0) {
          if (param.key_date) {
            const params2 = {
              query_mode: '2',
              sync_steady_state: this.wbsService.hasGroundEnd !== 'Y' ? null : 'Y', // 同步稳态	Y.同步；N.不同步 不传或传null，默认Y
              project_info: [{ project_no: param.project_no }]
            };
            this.commonService.getInvData('project.batch.shipment.info.get', params2)
              .subscribe(async (resProcess: any): Promise<void> => {
                // 入參.交付設計器.是否依賴地端、查詢模式=2.維護、專案編號，以產生專案分批資料
                console.log('產生專案分批資料：', resProcess);
              });
          }
          this.activeStatus = false;
          this.potentialStatus = 2; // 已转为正式专案
          this.successTransfer.emit(this.potentialStatus);
          this.projectCreationService.getProjectInfo();
          let value;
          if (param.to_be_formal_option === '1') {
            value = [{
              project_no: this.copyProjectInfo.project_no,
              new_project_no: res.data.project_info[0].project_no,
            }];
          } else {
            value = [{
              project_no: '',
              new_project_no: res.data.project_info[0].project_no,
            }];
          }
          // 呼叫结案api
          if (this.wbsService.modelType?.indexOf('DTD') !== -1) {
            const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
            const id = this.userService.getUser('userId');
            const processParam = [{ project_info: value }];
            this.projectCreationService.postProcessNew(DwUserInfo.acceptLanguage, id, processParam).subscribe(() => { });
          } else {
            const tenantId = this.userService.getUser('tenantId');
            this.projectCreationService.postProcess(tenantId, value).subscribe(() => { });
          }
        }
      });
  }

  actionChange() {
    if (this.potentialStatus !== 1) {
      return;
    }
    // 项目编号编码规则发生编号，清空【项目编号】
    this.validateForm.get('project_no').reset();
    this.projectNoFind = false;
    this.projectNoHasGroundEnd = '';
    if (this.validateForm.getRawValue().actionCode === '1') {
      this.validateForm.get('project_no').disable();
      this.validateForm.get('actual_start_date').setValue(this.copyProjectInfo.actual_start_date);
    } else {
      this.validateForm.controls['project_no'].enable();
      this.validateForm.get('coding_rule_no').reset();
      this.validateForm.get('coding_rule_name').reset();
    }
    this.activeStatus = false;
    this.changeRef.markForCheck();
  }

  chooseCompney() {
    if (this.validateForm.get('to_be_formal_option').value === '3') {
      return;
    }
    const paras = {};
    this.projectCreationService
      .getOpenWindowDefineSd('transfer_FindAllCompany', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          const operations = [
            {
              title: this.translateService.instant('dj-pcc-选择归属公司别'),
              description: this.translateService.instant('dj-default-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-pcc-选择编码规则'),
                selectedFirstRow: false,
                multipleSelect: false,
                rowSelection: 'single',
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: this.commonService.content?.executeContext,
                },
                buttons: [
                  {
                    title: this.translateService.instant('dj-default-确定'),
                    actions: [
                      {
                        category: 'UI',
                      },
                    ],
                  },
                ],
              },
            },
          ];
          const selectRow = this.fb.group({ project_no: [''] });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.validateForm.get('eoc_company_name').setValue(data[0].name);
              this.validateForm.get('eoc_company_id').setValue(data[0].id);
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  chooseCodingRule() {
    const paras = {
      coding_rule_info: [{}],
    };
    this.projectCreationService
      .getOpenWindowDefine('bm.pisc.coding.rule.get', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          const operations = [
            {
              title: this.translateService.instant('dj-pcc-选择编码规则'),
              description: this.translateService.instant('dj-default-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-pcc-选择编码规则'),
                selectedFirstRow: false,
                multipleSelect: false,
                rowSelection: 'single',
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: this.commonService.content?.executeContext,
                },
                buttons: [
                  {
                    title: this.translateService.instant('dj-default-确定'),
                    actions: [
                      {
                        category: 'UI',
                      },
                    ],
                  },
                ],
              },
            },
          ];
          const selectRow = this.fb.group({ project_no: [''] });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.validateForm.get('coding_rule_name').setValue(data[0].coding_rule_name);
              this.validateForm.get('coding_rule_no').setValue(data[0].coding_rule_no);
              this.auto_coding_mode = data[0].auto_coding_mode;
              if (data[0].auto_coding_mode === '7') {
                // 潜在转正式，功能 3.2
                if (this.validateForm.value.to_be_formal_option !== '3') {
                  this.validateForm.get('project_no').reset();
                }
                this.validateForm.get('project_no').enable();
              } else {
                // 潜在转正式，功能 1.2
                this.backfillProjectNoFn(data[0].coding_rule_no);
              }
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  chooseDisplayProjectNo() {
    const sync_steady_state =
      this.validateForm.getRawValue().actionCode === '1' ? 'N' : this.wbsTabsService.hasGroundEnd;
    const eoc_company_id = this.validateForm.getRawValue().actionCode === '1' ? '' : this.validateForm.getRawValue().eoc_company_id;
    const project_no = this.validateForm.getRawValue().project_no?.trim();
    const paras = {
      project_no: '',
      sync_steady_state: sync_steady_state,
    };
    const dataKeys = ['project_no', 'eoc_company_id'];
    // spring 3.0 更换api名称：'project.information.proces' ==> 'bm.pisc.steady.state.project.get'
    // spring 3.0 更换api，暂时不做
    // .getOpenWindowDefine('bm.pisc.steady.state.project.get', paras, dataKeys)
    this.projectCreationService
      .getOpenWindowDefine('project.information.proces', paras, dataKeys)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          this.commonService.content.executeContext.useHasNext = true;
          res.data.dataSourceSet.dataSourceList[0].action.businessUnit = {
            eoc_company_id: eoc_company_id,
          };
          res.data.dataSourceSet.dataSourceList[0].action.searchInfos = [
            {
              searchField: 'project_no',
              dataType: 'string',
            },
            {
              searchField: 'project_name',
              dataType: 'string',
            },
            {
              searchField: 'effective_date',
              dataType: 'date',
            },
            {
              searchField: 'expiration_date',
              dataType: 'date',
            },
          ];
          res.data.dataSourceSet.dataSourceList[0].action.actionParams = [
            {
              name: 'sync_steady_state',
              type: 'ACTIVE_ROW',
              value: 'sync_steady_state',
              required: false,
            },
            {
              name: 'search_value',
              type: 'ACTIVE_ROW_CONSTANT',
              value: '',
              required: false,
            },
            {
              name: 'use_has_next',
              type: 'ACTIVE_ROW_CONSTANT',
              value: 'true',
              required: false,
            },
            {
              name: 'page_size',
              type: 'ACTIVE_ROW_CONSTANT',
              value: '20',
              required: false,
            },
            {
              name: 'page_no',
              type: 'ACTIVE_ROW_CONSTANT',
              value: '1',
              required: false,
            },
          ];
          const operations = [
            {
              title: this.translateService.instant('dj-pcc-选择专案编号'),
              description: this.translateService.instant('dj-default-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-pcc-选择专案编号'),
                selectedFirstRow: false,
                multipleSelect: false,
                rowSelection: 'single',
                useHasNext: true,
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: this.commonService.content?.executeContext,
                },
                buttons: [
                  {
                    title: this.translateService.instant('dj-default-确定'),
                    actions: [
                      {
                        category: 'UI',
                      },
                    ],
                  },
                ],
              },
            },
          ];
          const selectRow = this.fb.group({
            project_no: [''],
            sync_steady_state: sync_steady_state,
          });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.validateForm.get('eoc_company_name').setValue(data[0].eoc_company_name);
              this.validateForm.get('eoc_company_id').setValue(data[0].eoc_company_id);
              this.validateForm.get('project_no').setValue(data[0].project_no);
              this.validateForm.get('project_name').setValue(data[0].project_name);
              this.validateForm.get('plan_start_date').setValue(data[0].effective_date);
              this.validateForm.get('plan_finish_date').setValue(data[0].expiration_date);
              // 开窗带回生效、失效日期 到 计划起止时间，倒退项目天数
              if (data[0].effective_date && data[0].expiration_date) {
                const startTime = moment(this.validateForm.getRawValue().plan_start_date).format('YYYY-MM-DD');
                const endTime = moment(this.validateForm.getRawValue().plan_finish_date).format('YYYY-MM-DD');
                this.changeEndTime(startTime, endTime);
              } else {
                this.validateForm.get('project_days').patchValue(null);
              }

              if (this.validateForm.getRawValue().actionCode === '2') {
                this.validateForm.get('actual_start_date').setValue(moment(data[0].effective_date).format('YYYY-MM-DD'));
                this.commonService.getInvData('project.info.get', { project_info: [{ project_no: data[0].project_no }] })
                  .subscribe((resInfo: any) => {
                    if (resInfo.data && resInfo.data.project_info && resInfo.data.project_info.length) {
                      this.projectNoFind = resInfo.data.project_info[0].project_no === data[0].project_no;
                      this.activeStatus = false;
                      this.changeRef.markForCheck();
                    } else {
                      this.projectNoFind = false;
                      this.changeRef.markForCheck();
                    }
                  });
              }
              if (project_no !== data[0].project_no) {
                this.projectNoHasGroundEndFn(project_no, eoc_company_id);
              }

              this.getSalesOrderRelatedData({
                project_no: data[0].project_no,
                eoc_company_id: data[0].eoc_company_id,
              });
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  // [702150]未启动项目的删除
  // 潜在转正式，功能1
  backfillProjectNoFn(coding_rule_no = '') {
    if ((this.validateForm.value.actionCode === '1') && (this.validateForm.value.to_be_formal_option !== '3') && coding_rule_no) {
      const params = {
        coding_type: '1',
        coding_rule_info: [{
          coding_rule_no: coding_rule_no,
          coding_count: 1,
          designation_date: new Date()
        }]
      };
      this.commonService.getInvData('bm.pisc.auto.generate.no.process', params)
        .subscribe((resInfo: any) => {
          this.validateForm.get('project_no').reset();
          if (resInfo.data && resInfo.data.coding_rule_info && resInfo.data.coding_rule_info.length) {
            const generate_no_info = resInfo.data.coding_rule_info[0].generate_no_info;
            if (generate_no_info && generate_no_info.length) {
              this.validateForm.get('project_no').setValue(generate_no_info[0].generate_no);
              const project_no = this.validateForm.get('project_no').value?.trim();
              const eoc_company_id = this.validateForm.get('eoc_company_id').value;
              this.projectNoHasGroundEndFn(project_no, eoc_company_id);
            }
            this.validateForm.get('project_no').disable();
            this.changeRef.markForCheck();
          }
        });
    }
  }

  // [702150]未启动项目的删除
  // 潜在转正式，功能2 --- 项目编号发生改变，校验项目编号是否存在稳态
  projectNoHasGroundEndFn(project_no: string = '', eoc_company_id: string = '') {
    this.commonService.getMechanismParameters('hasGroundEnd').toPromise().then(res => {
      // hasGroundEnd 同步稳态 Y.同步；N.不同步 不传或传null，默认Y
      const hasGroundEnd = res.data?.hasGroundEnd ? res.data?.hasGroundEnd : this.wbsService.hasGroundEnd;
      if ((this.validateForm.value.actionCode === '1') && (this.validateForm.value.to_be_formal_option !== '3')
        && project_no && (hasGroundEnd === 'Y')) {
        this.commonService.getInvData('project.exist.erp.check', { project_no, eoc_company_id })
          .subscribe((resInfo: any) => {
            // 校验项目编号是否存在稳态
            if (resInfo?.data?.project_info && (resInfo?.data?.project_info[0].is_pass === false)) {
              this.projectNoHasGroundEnd = resInfo?.data?.project_info[0].error_msg;
              this.activeStatus = false;
            } else {
              this.projectNoHasGroundEnd = '';
            }
            this.changeRef.markForCheck();
          });
      }
    });
  }

  handleProjectNo() {
    const project_no = this.validateForm.get('project_no').value?.trim();
    const eoc_company_id = this.validateForm.get('eoc_company_id').value;
    if (!project_no) {
      return;
    }
    this.projectNoHasGroundEnd = '';
    if (this.wbsService.project_no !== project_no) {
      this.projectNoHasGroundEndFn(project_no, eoc_company_id);
    }

    // 在【项目编号编码方式】为【1.系统自动编码】和【编码规则】为【7.手动录入】时，进行【项目编号】是否已存在的校验
    if ((this.validateForm.getRawValue().actionCode === '2')
      || ((this.validateForm.getRawValue().actionCode === '1') && (this.auto_coding_mode === '7'))) {
      this.commonService.getInvData('project.info.get', { project_info: [{ project_no: project_no }] })
        .subscribe((resInfo: any) => {
          if (resInfo.data && resInfo.data.project_info && resInfo.data.project_info.length) {
            this.projectNoFind = resInfo.data.project_info[0].project_no === project_no;
            this.activeStatus = false;
            this.changeRef.markForCheck();
          } else {
            this.projectNoFind = false;
            this.changeRef.markForCheck();
          }
        });
    }
    this.getSalesOrderRelatedData({ project_no, eoc_company_id });
  }

  getSalesOrderRelatedData({ project_no, eoc_company_id }) {
    if ((this.validateForm.getRawValue().actionCode !== '2') || !eoc_company_id || !project_no) {
      return;
    }
    const params = {
      query_type: 1,
      query_condition: [
        {
          project_no,
          date_field: '1', // 日期字段	1.到货日期
          date_value_type: '1' // 日期取值类型	1.最大日期；2.最小日期；3.最大日期+最小日期
        },
      ],
    };
    // 取得销售订单相关日期
    this.commonService
      .getInvData('bm.sosc.sales.order.related.date.get', params, eoc_company_id)
      .subscribe((res) => {
        const { customer_no = '', max_date = '', salesman_no = '', salesman_name = '', customer_name = '' } =
          res?.data?.sales_order_data[0] ?? {};
        // customer_no  客户编号
        this.validateForm.get('customer_no').setValue(customer_no);
        // sales_no	业务员编号
        this.validateForm.get('sales_no').setValue(salesman_no);
        // salesman_name 业务员名称
        this.validateForm.get('sales_name').setValue(salesman_name);
        // key_date 预计出货日
        if (!((max_date.indexOf('1900/01/01') > -1) || (max_date.indexOf('1900-01-01') > -1)
          || (max_date.indexOf('9998-12-31') > -1) || (max_date.indexOf('9998/12/31') > -1))) {
          this.validateForm.get('key_date').setValue(max_date);
        }
        if ((project_no !== this.backupsProjectInfo.project_no) && (this.validateForm.getRawValue().actionCode === '2')) {
          this.validateForm.get('customer_shortname').setValue(customer_name);
        }
        this.changeRef.markForCheck();
      });
  }

  chooseProjectNo() {
    if (this.validateForm.get('to_be_formal_option').value === '3') {
      return;
    }
    const paras = {
      project_set_info: [{}],
      search_info: [{ search_field: 'project_status', search_operator: 'exist', search_value: ['10', '30'] }]
    };
    this.projectCreationService
      .getOpenWindowDefine('bm.pisc.project.set.get', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          const operations = [
            {
              title: this.translateService.instant('dj-pcc-选择项目集编号'),
              description: this.translateService.instant('dj-default-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-pcc-选择项目集编号'),
                selectedFirstRow: false,
                multipleSelect: false,
                rowSelection: 'single',
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: this.commonService.content.executeContext,
                },
                buttons: [
                  {
                    title: this.translateService.instant('dj-default-确定'),
                    actions: [
                      {
                        category: 'UI',
                      },
                    ],
                  },
                ],
              },
            },
          ];
          const selectRow = this.fb.group({ project_template_no: [''] });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.projectInfo.project_set_no = data[0].project_set_no; // 專案集編號
              this.show_project_set_no = data[0].project_set_name + data[0].project_set_no;
              this.getProjectSetInfo();
              this.selectDirty();
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  // 删除获取到的项目集
  deleteFileForProject() {
    if (this.projectInfo.project_set_no) {
      this.projectInfo.project_set_no = '';
      this.show_project_set_no = '';
      this.projectInfo.project_set_plan_start_date = '';
      this.projectInfo.project_set_plan_finish_date = '';
    }
    if (this.toBeFormalOption !== 3) {
      this.selectDirty();
    }
    this.changeRef.markForCheck();
  }

  // 获取项目集计划起始时间
  getProjectSetInfo() {
    const project_set_no = this.projectInfo.project_set_no;
    if (project_set_no) {
      const paras = {
        project_set_info: [{ project_set_no: project_set_no }]
      };
      this.commonService.getInvData('bm.pisc.project.set.get', paras)
        .subscribe((res: any): void => {
          if (res.code === 0) {
            this.projectInfo.project_set_leader_name = res.data?.project_set_info[0]?.leader_name;
            this.projectInfo.project_set_leader_dept_name = res.data?.project_set_info[0]?.leader_dept_name;
            this.projectInfo.project_set_plan_start_date = res.data?.project_set_info[0]?.plan_start_date;
            this.projectInfo.project_set_plan_finish_date = res.data?.project_set_info[0]?.plan_finish_date;
            if (this.backupsProjectInfo) {
              this.backupsProjectInfo.project_set_leader_name = this.projectInfo.project_set_leader_name;
              this.backupsProjectInfo.project_set_leader_dept_name = this.projectInfo.project_set_leader_dept_name;
              // 项目集计划起讫时间
              this.backupsProjectInfo.project_set_plan_start_date = this.projectInfo.project_set_plan_start_date;
              this.backupsProjectInfo.project_set_plan_finish_date = this.projectInfo.project_set_plan_finish_date;
            }
            this.changeRef.markForCheck();
          }
        });
    }
  }

  monitorProjectTypeChange(): void {
    this.projectTypeChange$.pipe(debounceTime(1000)).subscribe((change: any) => {
      if (this.wbsService.projectInfo?.project_status !== '10') {
        return;
      }
      if (this.hasT100) {
        return;
      }
      if (this.validateForm.get('to_be_formal_option').value === '3') {
        return;
      }
      const paras = {
        project_type_info: [{}],
      };
      this.projectCreationService
        .getOpenWindowDefine('project.type.info.get', paras)
        .subscribe((res: any): void => {
          if (res.code === 0) {
            this.commonService.content.executeContext.pattern = 'com';
            this.commonService.content.executeContext.pageCode = 'task-detail';
            const operations = [
              {
                title: this.translateService.instant('dj-default-选择项目类型'),
                description: this.translateService.instant('dj-default-建议人工处理'),
                operate: 'openwindow',
                openWindowDefine: {
                  title: this.translateService.instant('dj-default-选择项目类型'),
                  selectedFirstRow: false,
                  multipleSelect: false,
                  rowSelection: 'single',
                  allAction: {
                    defaultShow: false,
                    dataSourceSet: res.data.dataSourceSet,
                    executeContext: this.commonService.content.executeContext,
                  },
                  buttons: [
                    {
                      title: this.translateService.instant('dj-default-确定'),
                      actions: [
                        {
                          category: 'UI',
                        },
                      ],
                    },
                  ],
                },
              },
            ];
            const selectRow = this.fb.group({ project_template_no: [''] });
            this.openWindowService.openWindow(
              selectRow,
              operations,
              [],
              '',
              '',
              (data: Array<any>) => {
                const formValue = this.validateForm.getRawValue();
                this.projectInfo.project_type_no = data[0].project_type_no;
                this.show_project_type_no = data[0].project_type_name + data[0].project_type_no;
                if (data[0].standard_days) {
                  this.isHasRerverse = false;
                  this.validateForm.get('project_days').patchValue(data[0].standard_days);
                }
                if (formValue.actionCode === '1' && this.potentialStatus === 1) {
                  this.validateForm.get('coding_rule_name').patchValue(data[0].coding_rule_name);
                  this.validateForm.get('coding_rule_no').patchValue(data[0].coding_rule_no);
                  this.auto_coding_mode = data[0].auto_coding_mode;
                  this.projectNoFind = false;
                  this.projectNoHasGroundEnd = '';
                  if (data[0].auto_coding_mode === '7') {
                    // 潜在转正式，功能 3.1
                    if (this.validateForm.value.to_be_formal_option !== '3') {
                      this.validateForm.get('project_no').reset();
                    }
                    this.validateForm.get('project_no').enable();
                  } else {
                    // 潜在转正式，功能 1.1
                    this.backfillProjectNoFn(data[0].coding_rule_no);
                  }
                }
                this.selectDirty();
                this.isChangeTypeNo = true;
                this.changeRef.markForCheck();
              }
            );
          }
        });
    });
  }

  chooseProjecttype() {
    this.projectTypeChange$.next();
  }

  checkBoxChange() {
    if (!this.validateForm.getRawValue().budget_planning) {
      this.validateForm.controls['control_type'].disable();
      this.validateForm.get('control_type').patchValue('');
    } else {
      this.validateForm.controls['control_type'].enable();
    }
  }

  importData(event): void {
    if (this.validateForm.get('to_be_formal_option').value === '3') {
      return;
    }
    const fileList: FileList = event.target.files;
    if (fileList.length > 0 && this.fileList.length < 3) {
      const file: File = fileList[0];
      if (this.addSubProjectCardService.filterSize(file.size) > 50) {
        this.messageService.error(
          this.translateService.instant(`dj-default-上传文件大小不超过50MB`)
        );
        return;
      }
      this.isSpinning = true;
      this.uploadService.upload(file, 'Athena').subscribe((res) => {
        if (res.status === 'success') {
          this.selectDirty();
          event.target.value = '';
          this.isSpinning = false;
          const info = {
            id: res.fileId,
            name: file.name,
            category: 'athena_LaunchSpecialProject_create',
            categoryId: 'athena_LaunchSpecialProject_create',
            upload_user_name: this.userService.getUser('userName'),
            upload_user_id: this.userService.getUser('userId'),
            size: file.size,
            create_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            row_data: this.validateForm.getRawValue().project_no + ';',
          };
          this.fileList.push(info);
          this.changeRef.markForCheck();
        }
      });
    }
  }
  previewFile(item) {
    if (this.validateForm.get('to_be_formal_option').value === '3') {
      return;
    }
    const index = item.name.lastIndexOf('.');
    const ext = item.name.substr(index + 1);
    if (this.addSubProjectCardService.isAssetTypeAnImage(ext)) {
      const params = [];
      params.push(item.id);
      this.uploadService.getFileUrl('Athena', params).subscribe((res) => {
        this.previewVisible = true;
        this.previewImage = res[0];
      });
    } else {
      const url = this.addSubProjectCardService.dmcUrl;
      const previewUrl = `${url}/api/dmc/v2/file/Athena/online/preview/${item.id}`;
      window.open(previewUrl);
    }
  }
  deleteFile(index) {
    this.fileList.splice(index, 1);
    this.selectDirty();
    this.changeRef.markForCheck();
  }
  downLoad(item): void {
    this.uploadService.download('Athena', item.id, item.name).subscribe((blobFile) => { });
  }

  enterDateChange($event) {
    const date = $event ? moment($event).format('YYYY/MM/DD') : '';
    this.validateForm.get('enter_scene_date').patchValue(date);
    this.selectDirty();
    this.changeRef.markForCheck();
  }
  keyDateChange($event) {
    const date = $event ? moment($event).format('YYYY/MM/DD') : '';
    this.validateForm.get('key_date').patchValue(date);
    this.selectDirty();
    this.changeRef.markForCheck();
  }

  /**
 * html 中文字翻译
 * @param val
 */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
