import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AddSubProjectCardService } from '../../../add-subproject-card/add-subproject-card.service';
import { CommonService, Entry } from '../../../../service/common.service';
import * as moment from 'moment';
import { OpenWindowService } from '@athena/dynamic-ui';
import { ProjectCreationService } from './project-creation.service';
import { DwFormControl, cloneDeep, dayjs, isDate, isDateStr, isEmpty } from '@athena/dynamic-core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DwUserService } from '@webdpt/framework/user';
import { WbsTabsService } from '../../wbs-tabs.service';
import { UploadAndDownloadService } from '../../../../service/upload.service';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { initCollapsePanels } from './collapsePanelConfig';

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
  projectChangeFileList: any[] = []; // s10项目变更附件
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
  enumEntry = Entry;
  @Input() potentialStatus: number; // 是否点击潜在按钮 0: 潜在 1: 取消 2:已转正式
  @Input() tabIndex: any;
  @Input() tabName: String;
  @Input() hasAuth: boolean = true;
  @Input() source: Entry = Entry.card;
  @Input() sourceRealy: String;

  @Input() btnCustTemplatel?: TemplateRef<any>;
  @Output() successTransfer = new EventEmitter();
  @Output() changeConfig = new EventEmitter();
  @Input() signOff: boolean = false;

  hasSubmit = true;
  private projectTypeChange$ = new Subject<any>();
  private callProjectLevel$ = new Subject<void>();
  collapsePanels = initCollapsePanels(this.source);
  get projectStatus() {
    return this.source === Entry.projectChange || this.source === Entry.projectChangeSignOff
      ? this.wbsService.projectInfo?.old_project_status
      : this.wbsService.projectInfo?.project_status;
  }

  get planDateIsDisabled() {
    return (
      !this.hasAuth ||
      this.source === this.enumEntry.projectChangeSignOff ||
      this.validateForm.value.to_be_formal_option === '3' ||
      !this.wbsService.projectChangeStatus['check_type_creation'] ||
      !this.wbsService.projectChangeStatus['check_type_creation_for_projectType']
    );
  }
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
    public wbsService: DynamicWbsService
  ) {}

  ngOnInit(): void {
    console.log('project-creation-sourceRealy: ', this.sourceRealy);
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
    this.wbsService.projectInfo.control_type = this.wbsService.projectInfo.control_type || '';
    this.wbsService.projectInfo.budget_planning =
      this.wbsService.projectInfo.budget_planning || false;
    // s10: 从WBS发起初版预算 --更名-- 发起预算任务
    this.wbsService.projectInfo.wbs_first_budget = !!this.wbsService.projectInfo.wbs_first_budget;
    this.fileList = this.wbsService.projectInfo.attachment?.data || [];
    // s10: 新增项目变更附件
    if (
      this.source === this.enumEntry.projectChange ||
      this.source === this.enumEntry.projectChangeSignOff
    ) {
      this.projectChangeFileList = this.wbsService.projectInfo.change_attachment?.data || [];
    }
    this.projectInfo = cloneDeep(this.wbsService.projectInfo);
    this.show_project_set_no =
      cloneDeep(this.projectInfo.project_set_name ? this.projectInfo.project_set_name : '') +
      cloneDeep(this.projectInfo.project_set_no ? this.projectInfo.project_set_no : '');
    this.show_project_type_no =
      cloneDeep(this.projectInfo.project_type_name ? this.projectInfo.project_type_name : '') +
      cloneDeep(this.projectInfo.project_type_no ? this.projectInfo.project_type_no : '');
    this.copyProjectInfo = cloneDeep(this.projectInfo);
    this.getKeyDate(this.copyProjectInfo);
    this.projectInfo.to_be_formal_option = '2';
    this.projectInfo.actual_start_date_copy = null;
    const required = ['project_name', 'plan_start_date', 'plan_finish_date', 'project_days'];
    // 项目变更变更原因必填
    if (
      this.source === this.enumEntry.projectChange ||
      this.source === this.enumEntry.projectChangeSignOff
    ) {
      required.push('change_reason');
    }
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
    this.getProjectSetInfo();
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
    if (!this.projectInfo.products_no) {
      const v = (ctr) => {
        console.log(ctr);
      };
      validateForm.addControl('products_no', new FormControl('')); // 成品编号
    }
    validateForm.addControl('project_level_name', new FormControl('')); // 项目等级
    validateForm.addControl('project_level_no', new FormControl(''));
    validateForm.addControl('change_version', new FormControl(''));
    // 开始向表单塞值
    this.validateForm = validateForm;
    this.validateForm.controls['project_no'].disable();
    this.validateForm.controls['change_version'].disable(); // 该栏位永远只读
    // this.validateForm.controls['project_template_no'].disable();
    this.validateForm.controls['potential_project_no'].disable();
    this.validateForm.controls['actual_start_date'].disable();
    this.validateForm.controls['actual_start_date_copy'].disable();
    this.validateForm.controls['actual_finish_date'].disable();
    this.getPlanSummaryQty();
    this.validateForm.controls['plan_summary_qty'].disable();
    if (!this.wbsService.projectInfo.budget_planning) {
      this.validateForm.controls['control_type'].disable();
    }
    if (['60', '40'].includes(this.projectStatus)) {
      this.validateForm.controls['customer_shortname'].disable();
    }
    // if (this.projectStatus === '50') {
    //   this.validateForm.disable();
    // }
    // s10: 项目变更签核不可编辑
    if (this.source === this.enumEntry.projectChangeSignOff || !this.hasAuth) {
      this.validateForm.disable();
      // 屏蔽原型上的enable方法
      this.validateForm.enable = () => {};
      this.rewriteValidateFormEnableFn();
    }
    this.querySalePersonList();
    this.changeFormValue();
    this.getTenantProductOperationList();
    this.monitorProjectTypeChange();
    this.initCallProjectLevelFn();
    this.addValidateFormValidators();
    if (this.source === Entry.projectChange) {
      this.validateForm.controls['change_version'].patchValue(this.wbsService.change_version);
    }
  }
  private addValidateFormValidators() {
    const dateFormat = ($event) => moment($event).format('YYYY-MM-DD');
    this.validateForm?.get('plan_start_date')?.addValidators((ctr: DwFormControl) => {
      if (
        !this.projectInfo.project_set_plan_start_date ||
        !this.projectInfo.project_set_plan_finish_date
      ) {
        ctr['_tempWarningMessage'] = '';
        return null;
      }

      const plan_start_date = dateFormat(ctr.value),
        project_set_plan_start_date = dateFormat(this.projectInfo.project_set_plan_start_date);
      ctr['_tempWarningMessage'] =
        plan_start_date < project_set_plan_start_date
          ? this.translatePccWord('项目开始日期早于项目集开始日期！')
          : '';
      return null;
    });
    this.validateForm?.get('plan_finish_date')?.addValidators((ctr: DwFormControl) => {
      if (
        !this.projectInfo.project_set_plan_start_date ||
        !this.projectInfo.project_set_plan_finish_date
      ) {
        ctr['_tempWarningMessage'] = '';
        return null;
      }
      const plan_finish_date = dateFormat(ctr.value),
        project_set_plan_start_date = dateFormat(this.projectInfo.project_set_plan_start_date);
      ctr['_tempWarningMessage'] =
        plan_finish_date < project_set_plan_start_date
          ? this.translatePccWord('项目结束日期早于项目集开始日期！')
          : '';
      return null;
    });
    this.validateForm?.get('products_no')?.addValidators((ctr: DwFormControl) => {
      if (ctr.value && ctr.value.length > 40) {
        return {
          customError: this.translatePccWord('不能超过40个字符'),
        };
      }
      return null;
    });
  }
  private triggerValidateFormValidators(keys) {
    keys.forEach((key) => {
      this.validateForm.get(key).markAsDirty();
      this.validateForm.get(key).updateValueAndValidity();
    });
  }
  private rewriteValidateFormEnableFn() {
    const ctrs = this.validateForm.controls;
    for (const [key, value] of Object.entries(ctrs)) {
      // 屏蔽原型上的enable方法
      value.enable = () => {};
    }
  }
  ngOnDestroy(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.showProjectNo = false;
    this.projectNoFind = false;
    this.projectNoHasGroundEnd = '';
    if (this.updateSubmitSuccess) {
      // 修改项目信息后，重新获取项目信息
      this.projectInfo = cloneDeep(this.wbsService.projectInfo);
      this.getKeyDate(this.projectInfo);
      this.copyProjectInfo = cloneDeep(this.projectInfo);
      this.backupsProjectInfo = cloneDeep(this.projectInfo);
      this.getProjectSetInfo();
      this.updateSubmitSuccess = false;
      this.show_project_type_no =
        (this.projectInfo.project_type_name ? this.projectInfo.project_type_name : '') +
        (this.projectInfo.project_type_no ? this.projectInfo.project_type_no : '');
      this.show_project_set_no =
        (this.projectInfo.project_set_name ? this.projectInfo.project_set_name : '') +
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
          this.validateForm
            .get('plan_start_date')
            .setValue(this.backupsProjectInfo.plan_start_date);
          this.validateForm
            .get('plan_finish_date')
            .patchValue(this.backupsProjectInfo.plan_finish_date);
          this.validateForm.get('customer_no').patchValue(this.backupsProjectInfo.customer_no); // 客户编码回填
          this.validateForm
            .get('customer_shortname')
            .setValue(this.backupsProjectInfo.customer_shortname); // 客户简称
          this.validateForm
            .get('project_level_name')
            .setValue(this.backupsProjectInfo.project_level_name);
          this.validateForm
            .get('project_level_no')
            .setValue(this.backupsProjectInfo.project_level_no);
        }
        this.activeStatus = false;
      }
      // 清理项目集的代码，未完成
      // if ((changes.potentialStatus?.currentValue === 0) && (changes.potentialStatus?.previousValue === 1)) {
      //   const { project_set_no,
      //     project_set_plan_start_date,
      //     project_set_plan_finish_date,
      //     show_project_set_no,
      //     project_set_leader_name,
      //     project_set_leader_dept_name
      //   } = this.backupsProjectInfo;

      //   // 点击取消时，项目集相关栏位的处理
      //   if (!project_set_no && this.show_project_set_no) {
      //     // 原来是空，清空页面
      //     this.deleteFileForProject();
      //   }
      //   if (show_project_set_no !== this.show_project_set_no) {
      //     // 页面数据和库不一样，还原
      //     this.show_project_set_no = show_project_set_no;
      //     this.projectInfo.project_set_no = project_set_no; // 專案集編號
      //     this.projectInfo.project_set_leader_name = project_set_leader_name;
      //     this.projectInfo.project_set_leader_dept_name = project_set_leader_dept_name;
      //     this.projectInfo.project_set_plan_start_date = project_set_plan_start_date;
      //     this.projectInfo.project_set_plan_finish_date = project_set_plan_finish_date;
      //   }
      //   this.triggerValidateFormValidators(['plan_start_date', 'plan_finish_date']);
      //   this.changeRef.markForCheck();
      // }
    }
    this.changeRef.markForCheck();
    if (this.tabName === 'app-project-creation' && this.source === Entry.card) {
      this.commonService
        .getProjectChangeStatus(this.wbsService.project_no, ['1', '5'], '2')
        .subscribe(
          (res: any): void => {
            const check_result = res.data?.project_info[0]?.check_result;
            this.wbsService.projectChangeStatus['check_type_creation'] = check_result;
            this.wbsService.$projectChangeStatusSubscribe.next({
              type: 'check_type_creation',
              check_type_creation: check_result,
            });
            this.changeRef.markForCheck();
            if (check_result === false) {
              this.formDisable(); // 表单禁用
            }
            this.changeRef.markForCheck();
          },
          (error) => {
            this.wbsService.projectChangeStatus['check_type_creation'] = true;
            this.wbsService.$projectChangeStatusSubscribe.next({
              type: 'check_type_creation',
              check_type_creation: true,
            });
            this.changeRef.markForCheck();
          }
        );
    }
    if (
      this.wbsService.projectChangeStatus['check_type_creation'] &&
      this.wbsService?.projectInfo?.project_status === '30' &&
      this.source === Entry.card
    ) {
      this.commonService.getProjectChangeStatus(this.wbsService.project_no, ['2'], '2').subscribe(
        (res1: any): void => {
          const check_result1 = res1.data?.project_info[0]?.check_result;
          // 检查项目类型是否为“启用项目变更” --> 是
          if (check_result1 === false && this.wbsTabsService.potentialStatus !== 1) {
            this.wbsService.projectChangeStatus['check_type_creation_for_projectType'] = false;
            // 项目类型有启用项目变更管理，则【计划起讫日期】和【项目天数】不可编辑
            this.validateForm.get('project_days').disable();
            this.changeRef.markForCheck();
          }
          // 潜在转正式，默认是先放开【计划起讫日期】和【项目天数】
          if (this.wbsTabsService.potentialStatus === 1) {
            this.wbsService.projectChangeStatus['check_type_creation_for_projectType'] = true;
            this.validateForm.get('project_days').enable();
            this.changeRef.markForCheck();
          }
        },
        (error) => {
          this.wbsService.projectChangeStatus['check_type_creation_for_projectType'] = true;
          this.wbsService.$projectChangeStatusSubscribe.next({
            type: 'check_type_creation_for_projectType',
            check_type_creation_for_projectType: true,
          });
          this.changeRef.markForCheck();
        }
      );
    }
  }

  /**
   * 接口返回不正确的日期，前端做处理，不展示
   * @param param 表单对象
   */
  getKeyDate(param: any): void {
    if (param.key_date) {
      if (
        param.key_date.indexOf('1900/01/01') > -1 ||
        param.key_date.indexOf('1900-01-01') > -1 ||
        param.key_date.indexOf('9998-12-31') > -1 ||
        param.key_date.indexOf('9998/12/31') > -1
      ) {
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
      project_info: [{ project_no: this.wbsService.projectInfo.project_no }],
    };
    this.commonService
      .getInvData('project.batch.shipment.info.get', params)
      .subscribe(async (resProcess: any): Promise<void> => {
        // 入參.查詢模式=1.查詢、專案編號取得回參.預計總數量
        if (resProcess.data && resProcess.data.project_info) {
          this.plan_summary_qty = resProcess.data.project_info.plan_summary_qty;
          this.shippingInfoListLength = resProcess.data.project_info.shipping_info
            ? resProcess.data.project_info.shipping_info.length
            : 0;
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
    this.commonService.getInvData('employee.info.process', params).subscribe((res: any): void => {
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
    if (this.planDateIsDisabled) {
      return;
    }
    this.triggerValidateFormValidators(['plan_start_date']);
    this.isHasRerverse = true;
  }
  rerverseClick(): void {
    if (this.planDateIsDisabled) {
      return;
    }
    this.triggerValidateFormValidators(['plan_finish_date']);
    this.isHasRerverse = false;
  }

  endTimeChange($event: any): void {
    const date = $event ? moment($event).format('YYYY-MM-DD') : '';
    this.validateForm.get('plan_finish_date').patchValue(date);
    if (!this.isHasRerverse) {
      return;
    }
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
    const end_time = moment(start_time)
      .add(day - 1, 'days')
      .format('YYYY-MM-DD');
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
      this.projectNoFind ||
      this.projectNoHasGroundEnd !== '' ||
      (!this.show_project_type_no && this.projectStatus === '10')
    ) {
      this.hasSubmit = true;
      this.changeRef.markForCheck();
      return;
    }
    const param = this.validateForm.getRawValue();
    if (this.potentialStatus === 1) {
      param.actual_start_date = param.actual_start_date
        ? param.actual_start_date
        : this.validateForm.get('actual_start_date')['init_effective_date'];
      param.actual_start_date = isDateStr(param.actual_start_date)
        ? moment(param.actual_start_date).format('YYYY-MM-DD')
        : param.actual_start_date;
    }
    if (param.to_be_formal_option !== '3' && this.toBeFormalOption !== 3) {
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
      if (
        this.projectInfo.hasOwnProperty('project_set_plan_finish_date') &&
        this.projectInfo.project_set_plan_finish_date !== undefined &&
        this.projectInfo.project_set_plan_finish_date !== '' &&
        moment(param.plan_finish_date).format('YYYY-MM-DD') >
          moment(this.projectInfo.project_set_plan_finish_date).format('YYYY-MM-DD')
      ) {
        this.modalService.info({
          nzTitle: this.translateService.instant('dj-c-提示'),
          nzContent: this.translateService.instant('dj-default-项目结束日期不可大于项目集结束日期'),
          nzOkText: this.translateService.instant('dj-default-我知道了'),
          nzClassName: 'confirm-modal-center-sty',
          nzOnOk: (): void => {},
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
    this.getProjectInfo().subscribe(
      async (res: any): Promise<void> => {
        const _res =
          this.source !== Entry.projectChange
            ? res.data.project_info[0] ?? []
            : res?.data?.project_change_doc_info[0] ?? [];
        this.wbsService.projectInfo = _res;
        param.project_status = this.projectStatus;
        this.changeRef.markForCheck();
        let eoc_company_id = this.projectInfo.eoc_company_id;
        if (this.potentialStatus === 1 && this.toBeFormalOption !== 3) {
          if (param.actionCode === '1') {
            const params_info = {
              sync_steady_state: this.wbsTabsService.hasGroundEnd,
              project_info: [
                {
                  project_no: this.validateForm.getRawValue().project_no ?? '',
                  coding_rule_no: param.coding_rule_no,
                  eoc_company_id,
                },
              ],
            };
            this.commonService
              .getInvData('bm.pisc.initiates.project.process', params_info, eoc_company_id)
              .subscribe(
                (resInfo) => {
                  if (
                    resInfo.data &&
                    resInfo.data?.project_info &&
                    resInfo.data?.project_info.length
                  ) {
                    const project_no = resInfo.data.project_info[0].project_no;
                    this.validateForm.get('project_no').setValue(project_no);
                    this.transferToFormal();
                  }
                },
                (error) => {
                  this.hasSubmit = true;
                  this.changeRef.markForCheck();
                  return;
                }
              );
          } else {
            this.transferToFormal();
          }
        } else {
          let params = {};
          if (param.to_be_formal_option === '3' && this.toBeFormalOption === 3) {
            const opton3Param = this.wbsService.projectInfo || param;
            opton3Param.sync_steady_state = this.wbsTabsService.hasGroundEnd;
            opton3Param.operation_no = this.userService.getUser('userId');
            opton3Param.operation_name = this.userService.getUser('userName');
            opton3Param.to_be_formal_option = '3';
            opton3Param.control_mode = '3'; // 0.无 3.潜在项目直接转正式项目
            opton3Param.project_property = '20'; // 项目性质
            opton3Param.project_type_name = this.projectInfo.project_type_name;
            opton3Param.project_type_no = this.projectInfo.project_type_no;
            eoc_company_id = this.wbsService.projectInfo.eoc_company_id;
            params = {
              is_sync_document: this.wbsService.is_sync_document,
              project_info: [opton3Param],
            };
          } else {
            this.findLiablePersonName(param);
            param.plan_start_date = moment(param.plan_start_date).format('YYYY-MM-DD');
            param.plan_finish_date = moment(param.plan_finish_date).format('YYYY-MM-DD');
            // param.project_template_no = this.projectInfo.project_template_no;
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
            // 正式项目，可以选择【潜在项目编号】并保存
            // Reflect.deleteProperty(param, 'potential_project_no');
            Reflect.deleteProperty(param, 'actual_start_date');
            Reflect.deleteProperty(param, 'actual_start_date_copy');
            Reflect.deleteProperty(param, 'actual_finish_date');
            Reflect.deleteProperty(param, 'project_template_no');
            params = {
              is_sync_document: this.wbsService.is_sync_document,
              project_info: [param],
            };
          }
          // s10: 项目变更更新保存
          let apiName = 'project.info.update';
          if (this.source === this.enumEntry.projectChange) {
            apiName = 'bm.pisc.project.change.doc.update';
            Reflect.deleteProperty(param, 'potential_project_no');
            const needDelAttr = [
              'change_remark',
              'project_address',
              'bid_date',
              'base_date',
              'project_budget_amount',
              'project_value',
              'belong_stage',
            ];
            needDelAttr.forEach((key) => Reflect.deleteProperty(param, key));
            param.change_attachment = {
              data: this.projectChangeFileList,
              row_data: this.validateForm.getRawValue().project_no + ';',
            };
            param.attachment = {
              data: this.fileList,
              row_data: this.validateForm.getRawValue().project_no + ';',
            };
            params = {
              project_change_doc_info: [param],
            };
          }
          this.commonService.getInvData(apiName, params, eoc_company_id).subscribe(
            async (res3: any): Promise<void> => {
              if (res3.code === 0) {
                this.activeStatus = false;
                this.wbsService.projectInfo.remark = param.remark;
                this.projectCreationService.getProjectInfo(this.source);
                this.getProjectSetInfo();
                if (param.to_be_formal_option === '3' && this.toBeFormalOption === 3) {
                  this.potentialStatus = 2; // 潜在直接转为正式项目
                  this.successTransfer.emit(this.potentialStatus);
                } else {
                  this.isChangeProjectNo(param);
                }
                this.updateSubmitSuccess = true;
                this.wbsService.changeWbs$.next();
                // s10: 保存成功增加提示信息
                // eslint-disable-next-line no-unused-expressions
                this.source === this.enumEntry.projectChange &&
                  this.messageService.success(this.translateService.instant('dj-保存成功'));
              }
              if (apiName === 'project.info.update') {
                this.copyProjectInfo.potential_project_no = param.potential_project_no;
              }
              this.hasSubmit = true;
              this.changeRef.markForCheck();
            },
            (err: any): any => {
              this.hasSubmit = true;
              this.changeRef.markForCheck();
            }
          );
        }
      },
      (err: any): any => {
        this.hasSubmit = true;
        this.changeRef.markForCheck();
      }
    );
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
    let apiName = 'bm.pisc.project.get',
      params: any = { project_info };
    if (this.source === Entry.projectChange) {
      apiName = 'bm.pisc.project.change.doc.get';
      params = {
        project_change_doc_info: [
          {
            project_no: this.wbsService.project_no,
            change_version: this.wbsService.change_version,
          },
        ],
      };
    }
    return this.commonService.getInvData(apiName, params);
  }

  /**
   * 存在T100的任务，hasT100=true
   */
  getTenantProductOperationList(): void {
    const tenantId = this.userService.getUser('tenantId');
    this.wbsService.getTenantProductOperationList(tenantId).subscribe(
      (res: any) => {
        // prod_name：产品别
        this.hasT100 =
          res.prod_eoc_mapping.filter((item) => {
            return item.prod_name === 'T100';
          }).length > 0;
      },
      (error) => {}
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
    if (this.projectStatus === '10') {
      return (
        this.activeStatus &&
        !this.validateForm.invalid &&
        !!this.show_project_type_no &&
        !this.projectNoFind &&
        this.projectNoHasGroundEnd === ''
      );
    } else {
      return (
        this.activeStatus &&
        !this.validateForm.invalid &&
        !this.projectNoFind &&
        !this.projectNoHasGroundEnd
      );
    }
  }

  // 切换，转正式选项
  potentialStatusChange(event?: any) {
    // 潜在转为正式项目
    // 切换【转正式选项】--> 3.一号到底
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
        this.validateForm
          .get('eoc_company_name')
          .setValue(this.backupsProjectInfo.eoc_company_name); // 归属公司别
        this.validateForm.get('eoc_company_id').setValue(this.backupsProjectInfo.eoc_company_id);
        this.validateForm.get('actionCode').patchValue('1'); // 项目编号编码方式
        this.validateForm.get('coding_rule_no').reset();
        this.validateForm.get('coding_rule_name').reset(); // 编码规则
        // const temp_project_no = this.validateForm.get('project_no').value?.trim();
        this.validateForm.get('project_no').setValue(this.backupsProjectInfo.project_no); // 项目编号
        // if ((temp_project_no !== '') && (temp_project_no === this.validateForm.get('project_no').value)) {
        //   this.validateForm.get('project_level_name').setValue('');
        // }
        this.validateForm
          .get('project_level_name')
          .setValue(this.backupsProjectInfo.project_level_name);
        this.validateForm
          .get('project_level_no')
          .setValue(this.backupsProjectInfo.project_level_no);
        this.validateForm.get('project_no').disable();
        this.validateForm.get('project_name').setValue(this.backupsProjectInfo.project_name);
        this.validateForm.get('project_name').disable();
        this.validateForm.get('project_days').setValue(this.backupsProjectInfo.project_days); // 项目天数
        this.validateForm.get('project_days').disable();
        // this.validateForm.get('to_be_formal_option').enable();
        this.validateForm.get('plan_start_date').setValue(this.backupsProjectInfo.plan_start_date);
        this.validateForm
          .get('plan_finish_date')
          .patchValue(this.backupsProjectInfo.plan_finish_date);
        this.validateForm.get('project_property').setValue('20'); // 项目性质
        this.validateForm
          .get('project_introduction')
          .setValue(this.backupsProjectInfo.project_introduction); // 项目简介
        this.validateForm.get('project_introduction').disable();
        this.validateForm
          .get('enter_scene_date')
          .patchValue(this.backupsProjectInfo.enter_scene_date); // 进场日期
        // this.validateForm.get('enter_scene_date').disable();
        this.validateForm.get('contract_no').setValue(this.backupsProjectInfo.contract_no); // 合同编号
        this.validateForm.get('contract_no').disable();
        this.validateForm.get('sales_no').setValue(this.backupsProjectInfo.sales_no); // 业务员
        this.validateForm.get('sales_no').disable();
        this.validateForm.get('sales_name').setValue(this.backupsProjectInfo.sales_name);

        // 项目集编号
        this.show_project_set_no = this.backupsProjectInfo.show_project_set_no;
        // this.deleteFileForProject();
        // this.getProjectSetInfo();
        // 还原项目集内容，未完成
        // this.projectInfo.project_set_leader_name = this.backupsProjectInfo.project_set_leader_name;
        // this.projectInfo.project_set_leader_dept_name = this.backupsProjectInfo.project_set_leader_dept_name;
        this.projectInfo.project_set_plan_start_date =
          this.backupsProjectInfo.project_set_plan_start_date;
        this.projectInfo.project_set_plan_finish_date =
          this.backupsProjectInfo.project_set_plan_finish_date;
        // this.triggerValidateFormValidators(['plan_start_date', 'plan_finish_date']);

        this.validateForm.get('customer_no').setValue(this.backupsProjectInfo.customer_no); // 客户编号
        this.validateForm.get('customer_no').disable();
        this.validateForm
          .get('customer_shortname')
          .setValue(this.backupsProjectInfo.customer_shortname); // 客户简称
        this.validateForm.get('customer_shortname').disable();
        this.validateForm
          .get('project_contact_name')
          .setValue(this.backupsProjectInfo.project_contact_name); // 项目联系人
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
        this.validateForm
          .get('project_level_name')
          .setValue(this.backupsProjectInfo.project_level_name);
        this.validateForm
          .get('project_level_no')
          .setValue(this.backupsProjectInfo.project_level_no);

        this.activeStatus = true;
        this.changeRef.markForCheck();
      }
    }
    // 切换【转正式选项】 由 3  --切换--> 1 或 2 或 【取消】
    if (
      this.validateForm?.get('to_be_formal_option').value !== '3' &&
      this.toBeFormalOption === 3
    ) {
      const temp_project_no = this.validateForm.get('project_no').value?.trim();
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
      if (!this.backupsProjectInfo.budget_planning) {
        this.validateForm.controls['control_type'].disable();
      } else {
        this.validateForm.get('control_type').enable(); // 预算编制 - 选项
      }
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
    if (this.potentialStatus === 1) {
      param.actual_start_date = param.actual_start_date
        ? param.actual_start_date
        : this.validateForm.get('actual_start_date')['init_effective_date'];
      param.actual_start_date = isDateStr(param.actual_start_date)
        ? moment(param.actual_start_date).format('YYYY-MM-DD')
        : param.actual_start_date;
    }
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
    Reflect.deleteProperty(param, 'project_template_no');
    param.operation_no = this.userService.getUser('userId');
    param.operation_name = this.userService.getUser('userName');
    param.project_source = '1';
    // 潜在转正式，功能 4
    if (param.to_be_formal_option && param.actionCode === '1') {
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
        // this.projectInfo.eoc_company_id
        param.eoc_company_id || this.projectInfo.eoc_company_id
      )
      .subscribe(async (res: any): Promise<void> => {
        this.hasSubmit = true;
        this.changeRef.markForCheck();
        if (res.code === 0) {
          if (param.key_date) {
            // 86959 【s4.9】脱稳租户-潜在项目维护了分批资料后，再点击转正式-手动编码，报错
            // 操作步骤：1、发起潜在项目  2、去基础资料-项目分批出货资料维护维护资料  3、潜在项目转正式
            const hasGroundEnd = await this.commonService
              .hasDependsGround()
              .toPromise()
              .then((result) => result.data.hasGroundEnd);
            const params2 = {
              query_mode: '2',
              sync_steady_state: hasGroundEnd === 'N' ? 'N' : null, // 同步稳态	Y.同步；N.不同步
              project_info: [{ project_no: param.project_no }],
            };
            this.commonService
              .getInvData('project.batch.shipment.info.get', params2)
              .subscribe(async (resProcess: any): Promise<void> => {
                // 入參.交付設計器.是否依賴地端、查詢模式=2.維護、專案編號，以產生專案分批資料
                // console.log('產生專案分批資料：', resProcess);
              });
          }
          this.activeStatus = false;
          this.potentialStatus = 2; // 已转为正式专案
          this.successTransfer.emit(this.potentialStatus);
          this.projectCreationService.getProjectInfo();
          let value;
          if (param.to_be_formal_option === '1') {
            value = [
              {
                project_no: this.copyProjectInfo.project_no,
                new_project_no: res.data.project_info[0].project_no,
              },
            ];
          } else {
            value = [
              {
                project_no: '',
                new_project_no: res.data.project_info[0].project_no,
              },
            ];
          }
          // 呼叫结案api
          if (this.wbsService.modelType?.indexOf('DTD') !== -1) {
            const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
            const id = this.userService.getUser('userId');
            const processParam = [{ project_info: value }];
            this.projectCreationService
              .postProcessNew(DwUserInfo.acceptLanguage, id, processParam)
              .subscribe(() => {});
          } else {
            const tenantId = this.userService.getUser('tenantId');
            this.projectCreationService.postProcess(tenantId, value).subscribe(() => {});
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
    const executeContext = cloneDeep(this.commonService.content.executeContext);
    const paras = {
      coding_rule_info: [{}],
    };
    const dataKeys = ['coding_rule_no'];
    executeContext.openWindow = true;
    this.projectCreationService
      .getOpenWindowDefine('bm.pisc.coding.rule.get', paras, dataKeys)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          executeContext.pattern = 'com';
          executeContext.pageCode = 'task-detail';
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
                  executeContext: executeContext,
                },
                useHasNext: false,
                roleAttention: [
                  'coding_rule_no',
                  'coding_rule_name',
                  'prefix_value',
                  'prefix_connector',
                  'suffix_value',
                  'suffix_connector',
                  'auto_coding_mode',
                ],
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
                // } else {
                //   // 潜在转正式，功能 1.2
                //   this.backfillProjectNoFn(data[0].coding_rule_no);
              } else {
                this.validateForm.get('project_no').reset();
                this.validateForm.get('project_no').disable();
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
    const eoc_company_id =
      this.validateForm.getRawValue().actionCode === '1'
        ? ''
        : this.validateForm.getRawValue().eoc_company_id;
    const project_no = this.validateForm.getRawValue().project_no?.trim();
    const paras = {
      project_no: '',
      sync_steady_state: sync_steady_state,
    };
    const dataKeys = ['project_no', 'eoc_company_id'];
    // spring 3.0 更换api名称：'project.information.proces' ==> 'bm.pisc.steady.state.project.get'
    // spring 3.0 更换api，暂时不做
    // spring 4.5 更换api名称：'project.information.proces' ==> 'bm.pisc.project.information.proces'
    this.projectCreationService
      .getOpenWindowDefine('bm.pisc.project.information.proces', paras, dataKeys)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          this.commonService.content.executeContext.useHasNext = true;
          this.commonService.content.executeContext.openWindow = true; // 可控制列表展示列，roleAttention
          res.data.dataSourceSet.dataSourceList[0].action.businessUnit = {
            eoc_company_id: eoc_company_id,
          };
          // res.data.dataSourceSet.dataSourceList[0].action.searchInfos = [
          //   {
          //     searchField: 'project_no',
          //     dataType: 'string',
          //   },
          //   {
          //     searchField: 'project_name',
          //     dataType: 'string',
          //   },
          //   {
          //     searchField: 'effective_date',
          //     dataType: 'date',
          //   },
          //   {
          //     searchField: 'expiration_date',
          //     dataType: 'date',
          //   },
          // ];
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
                roleAttention: [
                  'project_no',
                  'project_name',
                  'effective_date',
                  'expiration_date',
                  'project_leader_name',
                  'project_leader_no',
                ],
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
              const temp_project_no = this.validateForm.get('project_no').value?.trim();
              this.validateForm.get('project_no').setValue(data[0].project_no);
              this.validateForm.get('project_name').setValue(data[0].project_name);
              this.validateForm
                .get('plan_start_date')
                .setValue(this.setDateEmptyByMinDateOrMaxDate(data[0].effective_date));
              this.validateForm
                .get('plan_finish_date')
                .setValue(this.setDateEmptyByMinDateOrMaxDate(data[0].expiration_date));
              this.validateForm.get('contract_no').setValue(data[0]?.contract_no);
              this.validateForm.get('customer_no').setValue(data[0]?.customer_no);
              this.validateForm.get('customer_shortname').setValue(data[0]?.customer_name);
              // 开窗带回生效、失效日期 到 计划起止时间，倒退项目天数
              const validateFormValue = this.validateForm.getRawValue(),
                effectiveDate = data[0].effective_date;
              let startTime, endTime;
              if (effectiveDate && data[0].expiration_date) {
                startTime = isDateStr(validateFormValue.plan_start_date)
                  ? moment(validateFormValue.plan_start_date).format('YYYY-MM-DD')
                  : validateFormValue.plan_start_date;
                endTime = isDateStr(validateFormValue.plan_finish_date)
                  ? moment(validateFormValue.plan_finish_date).format('YYYY-MM-DD')
                  : validateFormValue.plan_finish_date;
                this.changeEndTime(startTime, endTime);
              } else {
                this.validateForm.get('project_days').patchValue(null);
              }
              if (validateFormValue.actionCode === '2') {
                this.validateForm.get('actual_start_date')['init_effective_date'] =
                  data[0].effective_date;
                this.validateForm
                  .get('actual_start_date')
                  .setValue(
                    isDateStr(validateFormValue.plan_start_date)
                      ? moment(validateFormValue.plan_start_date).format('YYYY-MM-DD')
                      : validateFormValue.plan_start_date
                  );
                this.validateForm.get('remarks').setValue(data[0].remark);
                this.commonService
                  .getInvData('project.info.get', {
                    project_info: [{ project_no: data[0].project_no }],
                  })
                  .subscribe((resInfo: any) => {
                    if (
                      resInfo.data &&
                      resInfo.data.project_info &&
                      resInfo.data.project_info.length
                    ) {
                      this.projectNoFind =
                        resInfo.data.project_info[0].project_no === data[0].project_no;
                      this.activeStatus = false;
                      this.validateForm
                        .get('remarks')
                        .setValue(resInfo.data.project_info[0].remark);
                      this.changeRef.markForCheck();
                    } else {
                      this.projectNoFind = false;
                      this.changeRef.markForCheck();
                    }
                  });
              }
              // if (project_no !== data[0].project_no) {
              //   this.projectNoHasGroundEndFn(project_no, eoc_company_id);
              // }

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
  /**
   * 根据最小日期或最大日期设置日期为空字符串
   *
   * @param date 日期字符串
   * @returns 返回空字符串或原日期字符串
   */
  private setDateEmptyByMinDateOrMaxDate(date): string {
    const temp = {
      '1900-01-01': true,
      '9998-12-31': true,
      '1900/01/01': true,
      '9998/12/31': true,
    };
    const needSetDateEmpty = temp[date];
    if (needSetDateEmpty) {
      return '';
    }
    return date;
  }
  /**
   * 选择潜在项目编号：项目性质是正式，
   * 1.潜在专案编号为空时，潜在专案编号可以使用开窗选择方式，可以进行选择。
   * 2.潜在专案编号不为空时，栏位只读。
   */
  choosePotentialProjectNo() {
    if (
      this.validateForm.value.project_property !== '20' ||
      this.copyProjectInfo.potential_project_no ||
      !this.wbsService.projectChangeStatus['check_type_creation']
    ) {
      return;
    }

    const paras = {
      search_info: [
        {
          search_field: 'project_source',
          search_operator: 'exist',
          search_value: ['1', '4'],
        },
      ],
      project_info: [{ project_property: '10' }],
      // 10.未开始；20.签核中；30.进行中；40.已结案 ；50 暂停 ；60.指定结案；00.未发起
      project_status_info: [
        { project_status: '10' },
        { project_status: '20' },
        { project_status: '30' },
        { project_status: '40' },
        { project_status: '60' },
      ],
    };
    const dataKeys = ['project_no', 'eoc_company_id'];
    this.projectCreationService
      .getOpenWindowDefine('bm.pisc.project.get', paras, dataKeys)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          const executeContext = cloneDeep(this.commonService.content.executeContext);
          executeContext.pattern = 'com';
          executeContext.pageCode = 'task-detail';
          executeContext.useHasNext = true;
          executeContext.openWindow = true; // 可控制列表展示列，roleAttention
          res.data.dataSourceSet.dataSourceList[0].action.businessUnit = { eoc_company_id: '' };
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
                roleAttention: [
                  'project_no',
                  'project_name',
                  'plan_start_date',
                  'plan_finish_date',
                  'project_leader_name',
                  'project_leader_no',
                ],
                useHasNext: true,
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: executeContext,
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
          const selectRow = this.fb.group({ project_no: [''], sync_steady_state: 'N' });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.validateForm.get('potential_project_no').setValue(data[0].project_no);
              this.hasSubmit = true;
              this.activeStatus = true;
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  // 客户编码选择
  chooseDisplayCustomerNo() {
    if (this.toBeFormalOption === 3) {
      return;
    }
    const sync_steady_state =
      this.validateForm.getRawValue().actionCode === '1' ? 'N' : this.wbsTabsService.hasGroundEnd;
    const eoc_company_id =
      this.validateForm.getRawValue().actionCode === '1'
        ? ''
        : this.validateForm.getRawValue().eoc_company_id;
    const paras = {
      use_has_next: true,
      query_condition: 'M1',
      customer: [
        {
          customer_property: '2',
          manage_status: 'Y',
        },
      ],
    };
    this.projectCreationService
      .getOpenWindowDefine('bm.csc.customer.get', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          this.commonService.content.executeContext.useHasNext = true;
          this.commonService.content.executeContext.openWindow = true; // 可控制列表展示列，roleAttention
          res.data.dataSourceSet.dataSourceList[0].action.businessUnit = {
            eoc_company_id: eoc_company_id,
          };
          res.data.dataSourceSet.dataSourceList[0].action.searchInfos = [
            {
              searchField: 'customer_no',
              dataType: 'string',
            },
            {
              searchField: 'customer_shortname',
              dataType: 'string',
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
              value: '50',
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
              title: this.translateService.instant('dj-default-选择客户'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-default-选择客户'),
                selectedFirstRow: false,
                multipleSelect: false,
                rowSelection: 'single',
                useHasNext: true,
                roleAttention: ['customer_no', 'customer_name', 'customer_shortname'],
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
            customer_no: [''],
            sync_steady_state: sync_steady_state,
          });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.validateForm.get('customer_no').setValue(data[0].customer_no);
              this.validateForm.get('customer_shortname').setValue(data[0].customer_shortname);
              this.selectDirty();
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  /**
   * 该方法用于产生项目编号 20231023 mark for 19502
   * 用到API-57的场景有两种： 选择编码规则 和 选择项目类型
   */
  backfillProjectNoFn(coding_rule_no = '') {
    if (
      this.validateForm.value.actionCode === '1' &&
      this.validateForm.value.to_be_formal_option !== '3' &&
      coding_rule_no
    ) {
      const params = {
        coding_type: '1',
        coding_rule_info: [
          {
            coding_rule_no: coding_rule_no,
            coding_count: 1,
            designation_date: new Date(),
          },
        ],
      };
      this.commonService
        .getInvData('bm.pisc.auto.generate.no.process', params)
        .subscribe((resInfo: any) => {
          this.validateForm.get('project_no').reset();
          if (
            resInfo.data &&
            resInfo.data.coding_rule_info &&
            resInfo.data.coding_rule_info.length
          ) {
            const generate_no_info = resInfo.data.coding_rule_info[0].generate_no_info;
            if (generate_no_info && generate_no_info.length) {
              this.validateForm.get('project_no').setValue(generate_no_info[0].generate_no);
              const project_no = this.validateForm.get('project_no').value?.trim();
              const eoc_company_id = this.validateForm.get('eoc_company_id').value;
              this.projectNoHasGroundEndFn(project_no, eoc_company_id);
              this.commonService
                .getInvData('project.info.get', { project_info: [{ project_no: project_no }] })
                .subscribe((res: any) => {
                  if (res.data && res.data.project_info && res.data.project_info.length) {
                    this.projectNoFind = res.data.project_info[0].project_no === project_no;
                    this.activeStatus = false;
                    this.changeRef.markForCheck();
                  } else {
                    this.projectNoFind = false;
                    this.changeRef.markForCheck();
                  }
                });
            }
            this.validateForm.get('project_no').disable();
            this.changeRef.markForCheck();
          }
        });
    }
  }

  /**
   * 该方法用于校验项目编号 20231023 mark for 19502
   * 两种场景： 手动录入校验 和  选择专案编号后会触发
   */
  projectNoHasGroundEndFn(project_no: string = '', eoc_company_id: string = '') {
    this.commonService
      .getMechanismParameters('hasGroundEnd')
      .toPromise()
      .then((res) => {
        // hasGroundEnd 同步稳态 Y.同步；N.不同步 不传或传null，默认Y
        const hasGroundEnd = res.data?.hasGroundEnd
          ? res.data?.hasGroundEnd
          : this.wbsService.hasGroundEnd;
        if (
          this.validateForm.value.actionCode === '1' &&
          this.validateForm.value.to_be_formal_option !== '3' &&
          project_no &&
          hasGroundEnd === 'Y'
        ) {
          // sprint4.5 project.exist.erp.check==>bm.pisc.project.exist.erp.check
          this.commonService
            .getInvData('bm.pisc.project.exist.erp.check', { project_no, eoc_company_id })
            .subscribe((resInfo: any) => {
              // 校验项目编号是否存在稳态
              if (resInfo?.data?.project_info && resInfo?.data?.project_info[0].is_pass === false) {
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

  // 输入专案编号，校验是否已存在
  handleProjectNo() {
    const project_no = this.validateForm.get('project_no').value?.replace(/(^\s*)|(\s*$)/g, '');
    const eoc_company_id = this.validateForm.get('eoc_company_id').value;
    if (!project_no) {
      return;
    }
    this.projectNoHasGroundEnd = '';
    // if (this.wbsService.project_no !== project_no) {
    //   this.projectNoHasGroundEndFn(project_no, eoc_company_id);
    // }

    // 在【项目编号编码方式】为【1.系统自动编码】和【编码规则】为【7.手动录入】时，进行【项目编号】是否已存在的校验
    //  (this.validateForm.getRawValue().actionCode === '1' && this.auto_coding_mode === '7')
    if (this.validateForm.getRawValue().actionCode === '2') {
      this.commonService
        .getInvData('project.info.get', { project_info: [{ project_no: project_no }] })
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

  // 用获取到的项目编号，获取该
  getSalesOrderRelatedData({ project_no, eoc_company_id }) {
    if (this.validateForm.getRawValue().actionCode !== '2' || !eoc_company_id || !project_no) {
      return;
    }
    const params = {
      query_type: 1,
      query_condition: [
        {
          project_no,
          date_field: '1', // 日期字段	1.到货日期
          date_value_type: '1', // 日期取值类型	1.最大日期；2.最小日期；3.最大日期+最小日期
        },
      ],
    };
    // 这个API，要返回业务员的部门信息，供 任务类型为账款分期task_category=ODAR，赋值给负责人使用
    // 取得销售订单相关日期
    this.commonService
      .getInvData('bm.sosc.sales.order.related.date.get', params, eoc_company_id)
      .subscribe((res) => {
        const {
          customer_no = '',
          max_date = '',
          salesman_no = '',
          salesman_name = '',
          customer_name = '',
        } = res?.data?.sales_order_data[0] ?? {};
        if (customer_no) {
          // customer_no  客户编号
          this.validateForm.get('customer_no').setValue(customer_no);
        }
        // sales_no	业务员编号
        this.validateForm.get('sales_no').setValue(salesman_no);
        // salesman_name 业务员名称
        this.validateForm.get('sales_name').setValue(salesman_name);
        // key_date 预计出货日
        if (
          !(
            max_date.indexOf('1900/01/01') > -1 ||
            max_date.indexOf('1900-01-01') > -1 ||
            max_date.indexOf('9998-12-31') > -1 ||
            max_date.indexOf('9998/12/31') > -1
          )
        ) {
          this.validateForm.get('key_date').setValue(max_date);
        }
        if (
          project_no !== this.backupsProjectInfo.project_no &&
          this.validateForm.getRawValue().actionCode === '2'
        ) {
          if (customer_no) {
            this.validateForm.get('customer_shortname').setValue(customer_name);
          }
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
      search_info: [
        { search_field: 'project_status', search_operator: 'exist', search_value: ['10', '30'] },
      ],
    };
    this.projectCreationService
      .getOpenWindowDefine('bm.pisc.project.set.get', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          this.commonService.content.executeContext.openWindow = true;
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
                roleAttention: [
                  'project_set_name',
                  'project_set_no',
                  'plan_start_date',
                  'plan_finish_date',
                ],
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
              this.getProjectSetInfo(() => {
                this.triggerValidateFormValidators(['plan_start_date', 'plan_finish_date']);
              });
              this.selectDirty();
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  // 删除获取到的项目集
  deleteFileForProject() {
    if (this.projectInfo.project_set_no || this.show_project_set_no) {
      this.projectInfo.project_set_no = '';
      this.show_project_set_no = '';
      this.projectInfo.project_set_plan_start_date = '';
      this.projectInfo.project_set_plan_finish_date = '';
    }
    if (this.toBeFormalOption !== 3) {
      this.selectDirty();
    }
    this.triggerValidateFormValidators(['plan_start_date', 'plan_finish_date']);
    this.changeRef.markForCheck();
  }

  // 删除项目等级
  deleteProjectLevel() {
    if (this.validateForm.value?.project_level_name && this.validateForm.value?.project_level_no) {
      this.validateForm.get('project_level_name').setValue('');
      this.validateForm.get('project_level_no').setValue('');
      this.selectDirty();
    }
    this.changeRef.markForCheck();
  }

  // 获取项目集计划起始时间
  getProjectSetInfo(callback = () => {}) {
    const project_set_no = this.projectInfo.project_set_no;
    if (project_set_no) {
      const paras = {
        project_set_info: [{ project_set_no: project_set_no }],
      };
      this.commonService
        .getInvData('bm.pisc.project.set.get', paras)
        .subscribe((res: any): void => {
          if (res.code === 0) {
            this.projectInfo.project_set_leader_name = res.data?.project_set_info[0]?.leader_name;
            this.projectInfo.project_set_leader_dept_name =
              res.data?.project_set_info[0]?.leader_dept_name;
            this.projectInfo.project_set_plan_start_date =
              res.data?.project_set_info[0]?.plan_start_date;
            this.projectInfo.project_set_plan_finish_date =
              res.data?.project_set_info[0]?.plan_finish_date;
            if (this.backupsProjectInfo) {
              // 清楚项目集，未完成
              // if (this.backupsProjectInfo.project_set_no === this.projectInfo.project_set_no) {
              // 页面初始化、保存表单后
              this.backupsProjectInfo.project_set_leader_name =
                this.projectInfo.project_set_leader_name;
              this.backupsProjectInfo.project_set_leader_dept_name =
                this.projectInfo.project_set_leader_dept_name;
              // 项目集计划起讫时间
              this.backupsProjectInfo.project_set_plan_start_date =
                this.projectInfo.project_set_plan_start_date;
              this.backupsProjectInfo.project_set_plan_finish_date =
                this.projectInfo.project_set_plan_finish_date;
              this.changeRef.markForCheck();
            }
            callback();
            this.changeRef.markForCheck();
          }
        });
    }
  }

  get isDisPlayProjectType() {
    const condition1 =
      this.source === Entry.card &&
      (this.wbsService?.projectInfo?.project_status === '10' ||
        this.wbsTabsService?.potentialStatus === 1); // true可用
    const condition2 = this.hasT100 || !this.wbsService.projectChangeStatus['check_type_creation']; // true不可用
    return !condition1 || condition2 ? true : false;
  }

  monitorProjectTypeChange(): void {
    const executeContext = cloneDeep(this.commonService.content.executeContext);
    this.projectTypeChange$.pipe(debounceTime(1000)).subscribe((change: any) => {
      const $el = change?.el;
      // s18:如果点击的dom是禁用状态直接退出
      if ($el) {
        if ($el.classList.contains('disbaledChoose')) {
          return;
        }
      } else {
        if (
          !(
            this.source === Entry.card &&
            (this.wbsService?.projectInfo?.project_status === '10' ||
              this.wbsTabsService?.potentialStatus === 1)
          )
        ) {
          return;
        }
        if (this.hasT100) {
          return;
        }
        if (!this.wbsService.projectChangeStatus['check_type_creation']) {
          return;
        }
      }
      const paras = {
        project_type_info: [{}],
      };
      this.projectCreationService
        .getOpenWindowDefine('project.type.info.get', paras)
        .subscribe((res: any): void => {
          if (res.code === 0) {
            executeContext.pattern = 'com';
            executeContext.pageCode = 'task-detail';
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
                    executeContext: executeContext,
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
                this.projectInfo.project_type_name = data[0].project_type_name;
                this.projectInfo.project_type_no = data[0].project_type_no;
                this.show_project_type_no = data[0].project_type_name + data[0].project_type_no;
                if (this.validateForm.value.to_be_formal_option !== '3') {
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
                      // } else {
                      //   // 潜在转正式，功能 1.1
                      //   this.backfillProjectNoFn(data[0].coding_rule_no);
                    } else {
                      this.validateForm.get('project_no').reset();
                      this.validateForm.get('project_no').disable();
                    }
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

  chooseProjecttype($boxChoose) {
    this.projectTypeChange$.next({
      el: $boxChoose,
    });
  }

  checkBoxChange() {
    if (!this.validateForm.getRawValue().budget_planning) {
      this.validateForm.controls['control_type'].disable();
      this.validateForm.get('control_type').patchValue('');
    } else {
      this.validateForm.controls['control_type'].enable();
      this.validateForm.get('control_type').patchValue('20');
    }
  }
  /**
   * 导入附件
   * @param event
   * @param targetType 1 - 项目附件 0 - 项目变更附件
   */
  importData(event, targetType = 1): void {
    if (this.validateForm.get('to_be_formal_option').value === '3') {
      return;
    }
    if (!this.wbsService.projectChangeStatus['check_type_creation']) {
      return;
    }

    const fileList: FileList = event.target.files,
      originFileList = targetType ? this.fileList : this.projectChangeFileList;

    if (fileList.length > 0 && originFileList.length < 3) {
      const file: File = fileList[0];
      if (originFileList.some((item) => item.name === file.name)) {
        this.messageService.error(
          this.translateService.instant(`dj-pcc-已存在相同附件名的附件，请修改后重新上传`)
        );
        event.target.value = '';
        return;
      }

      if (this.addSubProjectCardService.filterSize(file.size) > 50) {
        this.messageService.error(
          this.translateService.instant(`dj-default-上传文件大小不超过50MB`)
        );
        event.target.value = '';
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
            category:
              targetType !== 0 ? 'athena_LaunchSpecialProject_create' : 'pcc_project_change_task',
            categoryId:
              targetType !== 0 ? 'athena_LaunchSpecialProject_create' : 'pcc_project_change_task',
            upload_user_name: this.userService.getUser('userName'),
            upload_user_id: this.userService.getUser('userId'),
            size: file.size,
            create_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            row_data: this.validateForm.getRawValue().project_no + ';',
          };
          originFileList.push(info);
          this.changeRef.markForCheck();
        }
      });
    }
  }

  // 附件预览
  previewFile(item) {
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
  deleteFile(index, fileSchema) {
    if (!this.wbsService.projectChangeStatus['check_type_creation']) {
      return;
    }
    this[fileSchema].splice(index, 1);
    this.selectDirty();
    this.changeRef.markForCheck();
  }
  downLoad(item): void {
    this.uploadService.download('Athena', item.id, item.name).subscribe((blobFile) => {});
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

  // 初始化
  initCallProjectLevelFn(): void {
    this.callProjectLevel$.pipe(debounceTime(300)).subscribe((change: any) => {
      this.chooseProjectLevel();
    });
  }

  // 调用
  callChooseProjectLevel(): void {
    this.callProjectLevel$.next();
  }

  chooseProjectLevel() {
    if (this.validateForm.value.to_be_formal_option === '3') {
      return;
    }
    const paras = {
      risk_user_defined_info: [
        {
          type: '5',
          manage_status: 'Y',
        },
      ],
    };
    this.projectCreationService
      .getOpenWindowDefine('bm.pisc.risk.user.defined.get', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          this.commonService.content.executeContext.openWindow = true; // 可控制列表展示列，roleAttention
          res.data.dataSourceSet.dataSourceList[0].dataKeys = ['no'];
          const operations = [
            {
              title: this.translateService.instant('dj-pcc-选择项目等级'),
              description: this.translateService.instant('dj-default-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-pcc-选择项目等级'),
                selectedFirstRow: false,
                multipleSelect: false,
                rowSelection: 'single',
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: this.commonService.content?.executeContext,
                },
                roleAttention: ['no', 'name', 'remarks'],
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
              this.validateForm.get('project_level_no').setValue(data[0].no);
              this.validateForm.get('project_level_name').setValue(data[0].name);
              this.selectDirty();
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  /**
   * 表单禁用
   * 适用范围：项目变更中
   */
  formDisable() {
    if (this.validateForm && !this.wbsService.projectChangeStatus['check_type_creation']) {
      this.validateForm.get('to_be_formal_option').disable();
      this.validateForm.get('project_no').disable();
      this.validateForm.get('project_name').disable();
      this.validateForm.get('project_days').disable();
      this.validateForm.get('project_introduction').disable();
      this.validateForm.get('contract_no').disable();
      this.validateForm.get('sales_no').disable();
      this.validateForm.get('customer_no').disable();
      this.validateForm.get('customer_shortname').disable();
      this.validateForm.get('project_contact_name').disable();
      this.validateForm.get('contact_tel_no').disable();
      this.validateForm.get('address').disable();
      this.validateForm.get('remarks').disable();
      this.validateForm.get('remark').disable();
      this.validateForm.get('budget_planning').disable();
      this.validateForm.get('control_type').disable();

      this.activeStatus = false;
    }
  }
}
