import {
  Component, OnInit, OnChanges,
  Input, Output, EventEmitter, ChangeDetectorRef, AfterViewInit, ViewChild, OnDestroy
} from '@angular/core';
import { Validators, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AddSubProjectCardService } from './add-subproject-card.service';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import * as moment from 'moment';
import { CommonService, Entry } from '../../service/common.service';
import { UploadAndDownloadService } from '../../service/upload.service';
import { DynamicWbsService } from '../wbs/wbs.service';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { cloneDeep } from '@ng-dynamic-forms/core';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject } from 'rxjs';
import { APIService } from 'app/customization/task-project-center-console/service/api.service';
import { DmcService } from 'ngx-ui-athena/src/components/upload';
import { TaskBaseInfo } from './add-subproject-card.interface';

import { LiablePersonService } from './services/liable-person.service';
import { LiablePersonAddRoleService } from './services/liable-person-add-role.service';

import { SubmitCardService } from './services/submit-card.service';
import { MoreControlComponent } from './components/more-control/more-control.component';
import { LevelService } from './services/level.service';
import {
  CONTROL_ITEM_LIST1,
  CONTROL_ITEM_LIST2,
  CONTROL_ITEM_LIST3,
  CONTROL_ITEM_LIST4,
  TASK_CATEGORY_LIST1,
  TASK_CATEGORY_LIST2
} from './components/more-control/more-control.service';
import { LiablePersonComponent } from './components/liable-person/liable-person.component';
import { LiablePersonAddRoleComponent } from './components/liable-person-add-role/liable-person-add-role.component';
import { NzTreeNode } from 'ng-zorro-antd/tree';
import { liablePersonName } from './utils/util';
import { DynamicCustomizedService } from '../../service/dynamic-customized.service';
import { TaskTemplateService } from './services/task-template.service';
import { WorkLoadService } from './services/work-load.service';
import { AdvancedOptionService } from './services/advanced-option.service';
import { PaymentStageService } from './components/payment-stage/payment-stage.service';
import { AthMessageService } from 'ngx-ui-athena/src/components/message';
/**
 * 任务卡片，子项开窗
 */
@Component({
  selector: 'app-add-subproject-card',
  templateUrl: './add-subproject-card.component.html',
  styleUrls: ['./add-subproject-card.component.less'],
  providers: [
    DmcService,
    DynamicCustomizedService,
    LevelService,
    LiablePersonService,
    LiablePersonAddRoleService,
    SubmitCardService,
    TaskTemplateService,
    AdvancedOptionService,
    WorkLoadService,
    PaymentStageService
  ]
})
export class AddSubprojectCardComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  /** wbs入口来源 */
  @Input() source: Entry = Entry.card;
  designStatus: string = '';

  @Output() currentTaskInfo = new EventEmitter();

  @ViewChild('changeReason') changeReason: any;
  @ViewChild('childMoreControl') childMoreControl: MoreControlComponent;
  @ViewChild('chilLliablePerson') chilLliablePerson: LiablePersonComponent;
  @ViewChild('chilLliablePersonRole') chilLliablePersonRole: LiablePersonAddRoleComponent;
  @ViewChild('advancedOption') advancedOptionComponent;

  // wbs入口
  public Entry = Entry;
  /** 任务分类 */
  public taskClassificationForm: FormGroup;
  /** 难度等级 */
  public difficultyLevelForm: FormGroup;
  /** 负责人下拉选择 */
  public personList: any[] = [];
  /** 执行人下拉选项 */
  public personList2: any[] = [];
  /** 负责人 & 执行人 原始数据备份 */
  public copyPersonList: any[] = [];
  /** 控制提交按钮的状态 1名称不能为空 或 level: 3 */
  public submitBtnStatus: boolean = false;
  /** 层级下拉列表 */
  public parentTaskSerialNumList: any;
  /** 前置任务列表 */
  public preTaskNumList: any;
  /** 当前任务卡信息 */
  public currentCardInfo: any;
  /** 负责人 */
  public liable_person_code_data: any;
  /** 负责人下拉列表 */
  public liable_person_code_dataList = [];
  /** 隐藏的执行人列表 */
  public task_member_infoList = [];
  /** 加载中 */
  public loading: boolean = false;
  /** 任务模版信息 */
  public taskTemplateInfo: any;
  /**  交付物樣板 */
  public attachmentData: any[] = [];
  /** 记录执行人的授权状态和错误信息 */
  public executor: { employee_info: any[]; error_msg: string } = { employee_info: [], error_msg: '' };
  /**  任务类型 */
  public taskCategoryType: string = '';
  /** 选择的执行人列表 */
  public task_member_info: any = [];
  /** 任务状态 */
  public taskStatus: Number = Number(this.addSubProjectCardService.currentCardInfo?.task_status);
  /** 记录原始的负责人数据 */
  private originPersonList: any;
  /**  任务卡的上阶任务的人任务状态 */
  private upper_level_task_status = '';
  /** 任务依赖关系列表 */
  taskDependencyInfoList: any[] = [];
  /** 任务卡表单信息 */
  private originValidateForm: any;
  /**  任务类型工单工时下单别、单号、类型条件值、次类型条件值非唯一性 */
  private valueNotUnique = true;
  /** 控制负责人是否可删除 */
  public nzAllowClear = true;
  /** type是否是mousedown */
  public mDown: string = '';
  /** 弹窗位置 */
  private maskPosition: any = { top: 100, left: (document.body.clientWidth - 550) / 2, width: 550 };
  /** 记录负责人的授权状态和错误信息 */
  private personLiable: { employee_info: any[]; error_msg: string } = { employee_info: [], error_msg: '' };
  /** plm任务类型未开始 */
  private plmNotStart_liablePerson: any = {};
  /** 负责人 */
  private personInChargeItem: any = {};
  private isClickSaveButton: boolean = false;
  /** 任务比重栏位单位显示% */
  formatterPercent = (value: number): string => `${value}%`;
  parserPercent = (value: string): string => value.replace('%', '');
  openWindowDefine: any = {}
  openPaymentWindowDefine: any;

  notTriggerChangs = false;
  upperLevelTaskNoForIssue: boolean = false; // 是否包含已下发任务
  private destroy$ = new Subject();

  constructor(
    private translateService: TranslateService,
    protected changeRef: ChangeDetectorRef,
    public addSubProjectCardService: AddSubProjectCardService,
    public wbsTabsService: WbsTabsService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService,
    public openWindowService: OpenWindowService,
    private messageService: NzMessageService,
    public uploadService: UploadAndDownloadService,
    private apiService: APIService,
    private liablePersonService: LiablePersonService,
    private liablePersonAddRoleService: LiablePersonAddRoleService,
    private submitCardService: SubmitCardService,
    public advancedOptionService: AdvancedOptionService,
    private levelService: LevelService,
    private athMessageService: AthMessageService
  ) {
  }

  /** 获取弹窗表单的值 */
  get validateForm(): FormGroup {
    return this.addSubProjectCardService.validateForm;
  }

  /** 获取任务卡列表中首阶任务卡信息 */
  get tempCurrentData() {
    return this.addSubProjectCardService.firstLevelTaskCard;
  }

  /**
   * 是否显示层级
   */
  get isShowTier() {
    return this.addSubProjectCardService.buttonType !== 'CREATE' && this.addSubProjectCardService.currentCardInfo?.level !== 0;
  }

  /**
   * 不禁用状态
   */
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  ngOnChanges(): void {
    if (this.addSubProjectCardService.taskTemplateName) {
      /** 主单位 次单位 */
      ['main_unit', 'second_unit'].forEach((key) => {
        this.validateForm.get(key).patchValue('0');
        this.validateForm.get(key).disable();
      });
      /** 预计值（主单位） 预计值（次单位） 标准工时 标准天数 */
      ['plan_main_unit_value', 'plan_second_unit_value', 'standard_work_hours', 'standard_days'].forEach((key) => {
        this.validateForm.get(key).patchValue(null);
        this.validateForm.get(key).disable();
      });
    }
    this.changeRef.markForCheck();
  }

  ngAfterViewInit(): void {
    this.changeHeight();
    this.changeHeightR();
  }

  /** *********** 初始化： 处理弹窗表单的默认值等 ***************** */
  async ngOnInit(): Promise<void> {
    if (!this.addSubProjectCardService.showAddTaskCard) {
      return;
    }
    this.taskCategoryType = this.addSubProjectCardService.taskCategory;
    this.setMoreControl();
    this.setDesignStatus();
    this.setMoreControlValueOfSft();
    this.resetDefaultBeforeTaskNo();
    this.setApproveAndAttachment();
    this.monitorFormChange();
    this.initCurrentCardInfo();
    this.setSomeEdit();
    this.getOpenWindowDefine('');
    // 获取款项阶段开窗定义
    const eocCompanyId = this.addSubProjectCardService.eocCompanyId?.id
      || this.commonService.content?.executeContext?.businessUnit?.eoc_company_id;
    this.getPaymentOpenDefine(eocCompanyId || '');
    this.getSelectPersonList();
    this.formatAttachmentData();
    this.originValidateForm = cloneDeep(this.validateForm.getRawValue());
    if (this.source !== Entry.maintain) {
      this.validateForm.controls['required_task'].disable();
    }
    this.monitorIsMilepost();
  }

  monitorIsMilepost(): void {

    this.validateForm.controls['is_milepost'].valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      if (!value) {
        this.validateForm.controls['milepost_desc'].setValue('');
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 任务模版编号存在时：弹窗设置loading状态、初始化任务模版对象信息taskTemplateInfo、查询更多选项中控件默认值，并控制更多选项禁用状态等
   */
  setMoreControl(): void {
    this.taskTemplateInfo = {
      task_category: this.addSubProjectCardService.taskCategory,
      complete_rate_method: this.addSubProjectCardService.currentCardInfo?.complete_rate_method
    };
    if (this.addSubProjectCardService.taskTemplateNo) {
      this.setMoreControlValues(this.addSubProjectCardService.currentCardInfo.task_category);
      this.taskCategoryForApc(this.addSubProjectCardService.currentCardInfo.task_category);
      this.taskCategoryForMOMA(this.addSubProjectCardService.currentCardInfo.task_category);
    }
  }

  /**
   * 控制负责人是否禁用：取得plm工作项数组后，判断是否全部为未启动，如果全部未启动，则禁用负责人
   */
  async setDesignStatus(): Promise<void> {
    const { task_status, task_category, project_no, task_no } = this.addSubProjectCardService.currentCardInfo;
    if (task_status === '20' && task_category === 'PLM') {
      const plmResult = await this.apiService.work_Item_Data_Get([{ project_no: project_no, task_no: task_no, }]);
      // // 若PLM状态（其中一笔） = 已完成（completed），子项开窗所有栏位只读
      const completed = plmResult.filter((item) => item.design_status === 'completed').length > 0 ? 'completed' : '';
      let notStart = '';
      if (!completed) {
        // 若PLM状态（多笔）全部 = 未启动（notStart） 则负责人、执行人可删除/新增；否则只能新增执行人，负责人不可修改
        notStart = plmResult.filter((item) => item.design_status === 'notStart').length === plmResult.length ? 'notStart' : '';
      }
      this.designStatus = completed ? completed : notStart;
      if ((this.source === Entry.card) && (this.designStatus === 'completed')) {
        Object.keys(this.validateForm.getRawValue()).forEach(
          (control: string): void => {
            this.validateForm.controls[control].disable();
          }
        );
      }
    }
  }

  /**
   * 设置更多选项中的控件值：SFT任务类型需要显示單別及單號，默認 true，且只讀。
   */
  setMoreControlValueOfSft(): void {
    if (['SFT'].includes(this.taskTemplateInfo?.task_category)) {
      this.validateForm.get('is_need_doc_no').patchValue(true);
      this.addSubProjectCardService.validateForm.get('is_need_doc_no').disable();
      const disableColumn = [
        'item_type',
        'item_type_value',
        'item_operator',
        'item_condition_value',
        'type_condition_value',
        'sub_type_condition_value',
        'outsourcing_condition_value',
      ];
      const enableColumn = ['doc_type_no', 'doc_no', 'seq'];
      this.validateForm.get('doc_type_info').patchValue([{ doc_condition_value: '' }]);
      this.validateForm.get('doc_type_info').disable();
      disableColumn.forEach((column) => {
        this.validateForm.get(column).patchValue('');
        this.validateForm.get(column).disable();
      });
      enableColumn.forEach((column) => { this.validateForm.get(column).enable(); });
    }
  }

  /**
   * 重制taskDependencyInfoList：将taskDependencyInfoList的default_before_task_no设置为before_task_no
   */
  resetDefaultBeforeTaskNo() {
    this.taskDependencyInfoList = this.validateForm.getRawValue()
      .task_dependency_info || [{ before_task_no: '', dependency_type: 'FS', advance_lag_type: -1, advance_lag_days: 0 }];
    this.taskDependencyInfoList.forEach((item: any): void => {
      item.default_before_task_no = item.before_task_no;
    });
  }

  // 设置任务是否是签核任务以及任务有交付物否
  setApproveAndAttachment() {
    if (this.addSubProjectCardService.buttonType !== 'EDIT' && this.wbsService.projectInfo?.project_type_no) {
      const params = {
        project_type_info: [
          {
            project_type_no: this.wbsService.projectInfo?.project_type_no,
          },
        ],
      };
      this.commonService
        .getInvData('bm.pisc.project.type.get', params)
        .subscribe((res: any): void => {
          const { is_approve, is_attachment } = res.data.project_type_info[0] ?? {};
          // is_approve: 任务签核否	true.需签核;false.无需签核
          if (is_approve) {
            this.addSubProjectCardService.validateForm.get('is_approve').setValue(is_approve);
          }
          // is_attachment:	任务有交付物否	true.是;false.否
          if (is_attachment) {
            this.addSubProjectCardService.validateForm.get('is_attachment').setValue(is_attachment);
          }
          this.changeRef.markForCheck();
        });
    }
  }

  /**
   * 监听表单控件值的改变：当弹窗表单值发生变化的时候，表单提交按钮、负责人、执行人、更多选项等联动改变
   */
  monitorFormChange(): void {
    this.validateForm?.valueChanges.subscribe((form) => {
      this.setSubmitBtnStatus(form);
      this.setNzAllowClear(form);
      this.setTaskDisabled(form);
      this.setMoreControlItem(form);
      this.setDateObject();
      this.changeRef.markForCheck();
    });
  }

  /**
   * 处理层级字段下拉相关内容：设置层级选项的数据和前置任务的数据
   */
  initCurrentCardInfo(): void {
    this.setCardLevelData();
    this.setPreTaskNumList();
  }

  /**
   * 获取任务卡层级信息树
   */
  setCardLevelData(): void {
    if (this.addSubProjectCardService.firstLevelTaskCard) {
      this.parentTaskSerialNumList = [cloneDeep(this.addSubProjectCardService.firstLevelTaskCard)];
      if (this.addSubProjectCardService.buttonType === 'EDIT') {
        this.parentTaskSerialNumList = this.levelService.removeLevels(this.parentTaskSerialNumList);
      }
    }
    if (this.parentTaskSerialNumList && (this.parentTaskSerialNumList.length > 0)) {
      let finder1 = {};
      for (let i = 0; i < this.wbsService.pageDatas.length; i++) {
        if (this.wbsService.pageDatas[i].task_no === this.parentTaskSerialNumList[0].task_no) {
          finder1 = this.wbsService.pageDatas[i];
          break;
        }
      }
      const finder2 = [];
      this.wbsService.getTaskChildrenAnyKey(finder1, 'is_issue_task_card', true, finder2);
      this.upperLevelTaskNoForIssue = finder2.length > 0;
    }
    const firstLevelTaskCardArr = this.addSubProjectCardService?.firstLevelTaskCard
      ? [this.addSubProjectCardService.firstLevelTaskCard] : [];
    let parentTaskNo = [];
    if (firstLevelTaskCardArr.length) {
      const taskCards = this.levelService.flattenFirstLevelTaskCard(firstLevelTaskCardArr);
      parentTaskNo = this.levelService.findParentItems(taskCards, this.addSubProjectCardService.validateForm.value);
    }
    this.levelService.setToTreeStructure(this.parentTaskSerialNumList, parentTaskNo);
  }

  /**
   * 获取任务前后置关系列表树
   */
  setPreTaskNumList(): void {
    if (this.wbsService.pageDatas) {
      this.preTaskNumList = cloneDeep(this.wbsService.pageDatas);
      if (this.addSubProjectCardService.buttonType === 'EDIT') {
        this.preTaskNumList = this.levelService.removeLevels(this.preTaskNumList);
      }
    }
    const firstLevelTaskCardArr = this.addSubProjectCardService?.firstLevelTaskCard
      ? [this.addSubProjectCardService.firstLevelTaskCard] : [];
    let parentTaskNo = [];
    if (firstLevelTaskCardArr.length) {
      const taskCards = this.levelService.flattenFirstLevelTaskCard(firstLevelTaskCardArr);
      parentTaskNo = this.levelService.findParentItems(taskCards, this.addSubProjectCardService.validateForm.value);
    }
    this.levelService.setToTreeStructure(this.preTaskNumList, parentTaskNo);
  }

  /**
   * 当任务状态>10时，处理表单是否可编辑
   */
  setSomeEdit() {
    if (this.addSubProjectCardService.currentCardInfo.someEdit) {
      const editList = [
        'task_member_info',
        'workload_qty',
        'task_classification_no',
        'difficulty_level_no',
        'workload_unit',
        'plan_work_hours',
        'plan_finish_date',
        'is_approve',
        'is_attachment',
        'task_proportion',
        'main_unit',
        'second_unit',
        'plan_main_unit_value',
        'plan_second_unit_value',
        'standard_work_hours',
        'standard_days',
      ];
      Object.keys(this.validateForm.getRawValue()).forEach(
        (control: string): void => {
          if (!editList.includes(control)) {
            this.validateForm.controls[control].disable();
          }
        }
      );
    }
  }

  /**
   * 获取任务模板开窗定义
   * @param flag
   */
  getOpenWindowDefine(flag: string): void {
    this.addSubProjectCardService.getTaskTemplate(flag || '', this.source).subscribe((res) => {
      this.openWindowDefine = res.data;
      this.openWindowDefine.executeContext =
        this.commonService.content.executeContext;
      this.openWindowDefine.executeContext.pattern = 'com';
      this.openWindowDefine.executeContext.pageCode = 'task-detail';
    });
  }

  /**
   * 获取参与人员:对执行人和负责人相关数据赋值
   */
  getSelectPersonList(): void {
    if (this.source === Entry.maintain) {
      this.liablePersonService.getSelectPersonList(this.wbsService.project_no, this.wbsTabsService.personList).subscribe(res => {
        this.liable_person_code_data = res.liable_person_code_data;
        this.liable_person_code_dataList = res.liable_person_code_dataList;
        this.wbsTabsService.personList = res.list;
        this.originPersonList = res.originPersonList;
        this.task_member_infoList = res.task_member_infoList;
        this.copyPersonList = this.addSubProjectCardService.mergeUserList(res.originPersonList);
        this.personList = this.addSubProjectCardService.mergeUserList(res.originPersonList);
        this.personList2 = this.addSubProjectCardService.mergeUserList(res.originPersonList);
        const bigIds = this.task_member_infoList.map(item => item.bigId);
        this.validateForm.get('task_member_info').patchValue(bigIds);
        this.changeRef.markForCheck();
      });
    } else {
      this.liablePersonAddRoleService.getSelectPersonList(this.wbsService.project_no, this.wbsTabsService.personList, this.source)
        .subscribe(res => {
          this.liable_person_code_data = res.liable_person_code_data;
          this.liable_person_code_dataList = res.liable_person_code_dataList;
          this.wbsTabsService.personList = res.list;
          this.originPersonList = res.originPersonList;
          this.task_member_infoList = res.task_member_infoList;
          this.copyPersonList = this.addSubProjectCardService.formatListToTree(res.originPersonList);
          this.personList = cloneDeep(this.copyPersonList);
          if (this.liable_person_code_dataList?.length) {
            this.personList.push(this.liable_person_code_dataList[0]);
          }
          this.personList2 = JSON.parse(JSON.stringify(this.copyPersonList));
          if (res.task_member_infoList_other?.length) {
            res.task_member_infoList_other.forEach(item => {
              this.personList2.push(item);
            });
          }
          this.liablePersonAddRoleService.changeTaskMemberInfoByLiable(this.liable_person_code_data?.key, this.personList2);
          this.validateForm.get('liable_person_code_data').patchValue(this.liable_person_code_data?.key);
          this.validateForm.get('task_member_info').patchValue(res.task_member_info);
          if (this.addSubProjectCardService.currentCardInfo?.task_status !== '10') {
            this.liablePersonAddRoleService.noChangeSelectedPersonList(this.task_member_infoList, this.personList2);
          }
          this.changeRef.markForCheck();
        });
    }
  }

  /**
   * 回显交付物文件的数据
   */
  formatAttachmentData(): void {
    this.attachmentData = this.validateForm.getRawValue().attachment?.data || [];
    this.attachmentData.forEach(item => {
      item.uid = item.id;
      item.status = 'done';
      this.uploadService.getFileUrl('Athena', [item.id]).subscribe((res) => {
        item.url = res[0];
      });
    });
  }

  /**
   * 设置表单提交按钮的置灰和激活状态
   * @param form 弹窗表单
   */
  setSubmitBtnStatus(form: any): void {
    this.submitBtnStatus = form.taskName !== '' || this.addSubProjectCardService.buttonType === 'EDIT' ? true : false;
  }

  /**
   * 设置负责人是否可删除：当nzAllowClear为true负责人可以删除
   * @param form 弹窗表单
   */
  setNzAllowClear(form: any): void {
    const { currentCardInfo } = this.addSubProjectCardService;
    if (currentCardInfo?.task_status === '20' && currentCardInfo?.task_category === 'PLM') {
      this.nzAllowClear = false; // 已选择负责人不可删除
    } else {
      this.nzAllowClear = !!(!form.task_member_info?.length && form.hasOwnProperty('task_member_info'));
    }
  }

  /**
   * 禁用执行人的选项列表中的已选负责人选择
   * @param form 弹窗表单
   */
  setTaskDisabled(form: any): void {
    const { validateForm, currentCardInfo } = this.addSubProjectCardService;
    if (form.liable_person_code) {
      this.originPersonList?.forEach((person: any): void => {
        const condition1 = person.id === form.liable_person_code && person.deptId === form.liable_person_department_code;
        const condition2 = currentCardInfo?.someEdit && this.designStatus !== 'notStart'
          && validateForm.value.task_member_info?.includes(person.bigId);
        person.isSelected = condition1 || condition2 ? true : false;
      });
    }
    if (
      !form.liable_person_code && this.plmNotStart_liablePerson.hasOwnProperty('liable_person_code')
    ) {
      this.originPersonList?.forEach((person: any): void => {
        const condition1 = person.id === this.plmNotStart_liablePerson?.liable_person_code
          && person.deptId === this.plmNotStart_liablePerson?.liable_person_department_code;
        const condition2 = currentCardInfo?.someEdit && this.designStatus !== 'notStart'
          && validateForm.value.task_member_info?.includes(person.bigId);
        person.isSelected = condition1 || condition2 ? true : false;
      });
    }
    if (form.hasOwnProperty('liable_person_code') && !form.liable_person_code) {
      this.originPersonList?.forEach((person: any): void => {
        person.isSelected = false;
      });
    }
  }

  /**
   * 设置更多选择中栏位控件值：设置或清空品号类别/群组（item_type） 、品号类别条件值（item_type_value）、料号运算符和料号条件值（item_condition_value）
   * @param form 弹窗表单
   */
  setMoreControlItem(form: any): void {
    const { validateForm } = this.addSubProjectCardService;
    // 品号类别和品号类别条件值
    // [品号类别/群组]栏位指 === （指定栏位：0）时，[品号类别条件值]栏位必填
    form.item_type === '0'
      ? this.setValidatorsManual(validateForm, 'item_type_value')
      : this.clearValidatorsManual(validateForm, 'item_type_value');
    // (form.item_type !== null) && !form.item_type_value
    //   ? this.setValidatorsManual(validateForm, 'item_type_value')
    //   : this.clearValidatorsManual(validateForm, 'item_type_value');
    // 料号运算符和料号条件值
    form.item_condition_value
      ? this.setValidatorsManual(validateForm, 'item_operator')
      : this.clearValidatorsManual(validateForm, 'item_operator');
  }

  /**
 * 设置人力资源负荷中日期控件的时间对象：开始时间 & 结束时间 用于人力资源负荷
 */
  setDateObject(): void {
    const { validateForm } = this.addSubProjectCardService;
    if (validateForm.getRawValue().plan_start_date && validateForm.getRawValue().plan_finish_date) {
      this.wbsService.dateObject = {
        startDate: this.validateForm.getRawValue().plan_start_date,
        endDate: this.validateForm.getRawValue().plan_finish_date,
      };
    }
  }
  /** *********** 初始化： 处理弹窗表单的默认值等 ***************** */

  /**
  * 获取款项阶段开窗定义
  */
  getPaymentOpenDefine(company: string): void {
    this.addSubProjectCardService
      .getPaymentPeriod(company || '', this.wbsService.project_no, this.source)
      .subscribe((res) => {
        this.openPaymentWindowDefine = res.data;
      });
  }


  /**  *************************提交任务卡操作*********************** */
  /** 取消 */
  cancel(): void {
    this.preTaskNumList = [];
    this.parentTaskSerialNumList = [];
    this.setIsClickSaveButton(false);
    this.resetTaskDependencyInfoList();
    const { addSubProjectCardService } = this;
    if (addSubProjectCardService.currentCardInfoBackups) {
      // 修改前后置任务，点击取消，数据还原
      this.wbsService.pageDatas.forEach((item) => {
        this.wbsService.getTaskForEdit(item, addSubProjectCardService.currentCardInfoBackups);
      });
    }
    this.validateForm.reset();
    addSubProjectCardService.showAddTaskCard = false;
  }
  /**
   * 点击提交按钮
   */
  async clickSubmit(): Promise<any> {
    if (this.isClickSaveButton) {
      return;
    }
    this.setIsClickSaveButton(true);
    if (this.source !== Entry.maintain) {
      const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
      this.wbsService.needRefresh = data.check_result;
    }
    if (this.wbsService.needRefresh) {
      this.addSubProjectCardService.showAddTaskCard = false;
      this.athMessageService.error(this.wbsService.needRefresh);
      this.wbsService.changeWbs$.next();
      return;
    }
    this.checkValue();
  }



  /**
   * 校验表单值
   * @returns
   */

  checkValue(): void {
    if (!this.validateForm.get('task_name').value?.trim()) {
      this.setIsClickSaveButton(false);
      return;
    }
    const plan_finish_date = this.validateForm.get('plan_finish_date').value;
    if (
      plan_finish_date &&
      [Entry.card, Entry.collaborate].includes(this.source) &&
      moment(plan_finish_date).format('YYYY-MM-DD') >
      moment(this.wbsService.projectInfo?.plan_finish_date).format('YYYY-MM-DD')
    ) {
      this.setIsClickSaveButton(false);
      return;
    }
    // 如果是协同计划排定任务卡并且负责人没有改变，则执行提交操作
    const condition1 =
      !this.validateForm.get('liable_person_code').dirty
      && this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
    if (condition1) {
      this.cancel();
      return;
    }
    const workload_qty = this.addSubProjectCardService.validateForm.get('workload_qty').value;
    if (!workload_qty || workload_qty < 0) {
      this.addSubProjectCardService.validateForm.get('workload_qty').patchValue(0);
    }
    const enterParams = {
      personLiable: this.personLiable,
      executor: this.executor,
      taskTemplateInfo: this.taskTemplateInfo,
      pageDatas: this.wbsService.pageDatas,
      valueNotUnique: this.valueNotUnique,
      changeReason: this.changeReason,
      source: this.source,
      projectInfo: this.wbsService.projectInfo
    };
    const res = this.submitCardService.checkValue(enterParams);
    if (res?.status !== 'success') {
      this.setIsClickSaveButton(false);
    }
    /** 校验成功 */
    if (res?.status === 'success') {
      const { condition2, status } = res.response;
      if (this.source === Entry.collaborate) {
        this.handelData({ status });
      } else {
        condition2 && this.addSubProjectCardService.buttonType === 'EDIT'
          ? this.changeReason.showModal()
          : this.handelData({ status });
      }
    }
    /** 如果需要设置回显变量 */
    if (res?.setData) {
      for (const key in res?.setData) {
        if (Object.prototype.hasOwnProperty.call(res?.setData, key)) {
          const element = res?.setData[key];
          this[key] = element;
        }
      }
    }
  }

  setIsClickSaveButton(value: boolean): void {
    this.isClickSaveButton = value;
  }

  /**
   * 点击提交：获取入参 提交内容
   * @param changeReason
   */
  handelData(changeReason: any): void {
    this.valueNotUnique = true;
    const enterParams = {
      taskTemplateInfo: this.taskTemplateInfo,
      taskClassificationForm: this.taskClassificationForm,
      project_no: this.wbsService.project_no,
      taskDependencyInfoList: this.taskDependencyInfoList,
      source: this.source,
      attachmentData: this.attachmentData,
      changeReason,
      hasGroundEnd: this.wbsService.hasGroundEnd,
      tempCurrentData: this.tempCurrentData,
      difficultyLevelForm: this.difficultyLevelForm,
      task_member_infoList: this.task_member_infoList,
      pageDatas: this.wbsService.pageDatas,
      personList: this.personList
    };
    const { params, temp_doc_condition_value } = this.submitCardService.handelData(enterParams);
    params.task_property = this.source === Entry.maintain ? '2' : '1';
    delete params.liable_person_code_data;
    params.item_type = params.item_type === null ? '' : params.item_type;
    if (this.addSubProjectCardService.buttonType === 'EDIT') {
      this.loading = true;
      this.setTaskMemberInfoIsChange();
      if (this.source === Entry.collaborate) {
        params.record_task_change = (Number(this.wbsService.projectInfo?.project_status) < 30) ? false : true;
      }
      this.saveEditInfo(params, temp_doc_condition_value);
    } else {
      this.handleUpperLevelTask(params);
      this.taskInfoCreate(params, temp_doc_condition_value);
      this.addSubProjectCardService.showAddTaskCard = false;
    }

  }

  /**
 * 判断执行人是否改改变
 */
  setTaskMemberInfoIsChange(): void {
    const task_member_info1 = JSON.stringify(this.addSubProjectCardService.validateForm.get('task_member_info').value);
    const task_member_info2 = JSON.stringify(this.originValidateForm.task_member_info);
    this.originValidateForm.TaskMemberInfoChange = task_member_info1 !== task_member_info2;
  }

  /**
   * 保存编辑任务卡
   * @param params 编辑的任务卡信息
   * @param temp_doc_condition_value 单别条件值
   */
  saveEditInfo(params: any, temp_doc_condition_value: any): void {
    params.is_update_upper_date = 'Y';
    this.addSubProjectCardService.taskBaseInfoUpdate(params).then((res) => {
      this.addSubProjectCardService.recordModified();
      if (this.addSubProjectCardService.currentCardInfo?.isCollaborationCard) {
        this.addSubProjectCardService.getServiceOrchestration(params);
      }
      if (this.mistakeMessage(res)) {
        this.changeOriginValidateForm(params);
        this.updateTaskFlow(params);
        this.taskProportionCheck();
        this.taskDependencyCheck(params, temp_doc_condition_value);
        this.updateWbsTasks('true');
        this.changeRef.markForCheck();
      }
      this.setIsClickSaveButton(false);
      this.addSubProjectCardService.showAddTaskCard = false;
    }, (err: any): void => {
      this.cancel();
      this.messageService.error(err);
    });
  }

  /**
   * 项目编号错误讯息mistakeMessage
   * @param task_info
   * @returns
   */
  mistakeMessage(task_info: TaskBaseInfo): boolean {
    if (task_info?.project_no_mistake_message) {
      this.messageService.error(task_info.project_no_mistake_message);
    }
    return !task_info?.project_no_mistake_message;
  }

  /**
  * 更改OriginValidateForm
  * @param params 当前任务卡
  */
  changeOriginValidateForm(params: any): void {
    if (this.originValidateForm.task_member_info && this.originValidateForm.task_member_info?.length) {
      this.originValidateForm.task_member_info =
        this.originValidateForm.task_member_info.map((number) => {
          if (number && (typeof number === 'string')) {
            if (number.indexOf(':') > 1) {
              const arr = number.split(';');
              const item = {};
              arr.forEach(v => {
                const temp = v.split(':');
                item[temp[0]] = temp[1];
              });

              return {
                project_no: params.project_no,
                task_no: this.originValidateForm.task_no,
                executor_no: item['id'] ? item['id'] : '',
                executor_department_no: item['deptId'] ? item['deptId'] : '',
                executor_role_no: item['roleNo'] ? item['roleNo'] : ''
              };
            } else {
              const arr = number.split(';');
              return {
                project_no: params.project_no,
                task_no: this.originValidateForm.task_no,
                executor_no: arr[1],
                executor_department_no: arr[0],
                executor_role_no: arr[2] ? arr[2] : ''
              };
            }
          } else {
            return {
              project_no: params.project_no,
              task_no: this.originValidateForm.task_no,
              executor_no: number['executor_no'] ? number['executor_no'] : '',
              executor_department_no: number['executor_department_no'] ? number['executor_department_no'] : '',
              executor_role_no: number['executor_role_no'] ? number['executor_role_no'] : ''
            };
          }
        });
    }
    this.originValidateForm.plan_start_date = moment(
      this.originValidateForm.plan_start_date
    ).format('YYYY-MM-DD');
    this.originValidateForm.plan_finish_date = moment(
      this.originValidateForm.plan_finish_date
    ).format('YYYY-MM-DD');
    if (this.originValidateForm.doc_type_info && this.originValidateForm.doc_type_info?.length) {
      this.originValidateForm.doc_type_info = this.originValidateForm.doc_type_info.map(
        (doc_type) => {
          return {
            doc_condition_value: doc_type,
          };
        }
      );
    }
  }

  /**
  * 更新任务流程
  * @param params 任务卡信息
  */
  updateTaskFlow(params: any): void {
    if ((this.source === Entry.card) || (this.source === Entry.collaborate)) {
      this.addSubProjectCardService.bmPiscProjectGet(this.wbsService.project_no).then((projectInfo) => {
        const status = projectInfo.project_status;
        this.wbsService.projectInfo.project_status = Number(status) > 10 ? status : this.wbsService.projectInfo.project_status;
        const isSynTaskCard = this.synchronizeTaskCard(params);
        const isEditNeedBtn = this.editNeedBtn(params);
        if (isSynTaskCard || isEditNeedBtn) {
          this.addSubProjectCardService.updateTaskFlow(params, this.wbsService.modelType, this.wbsService.project_no, this.source);
        }
      });
    }
  }

  editNeedBtn(params) {
    if (
      params.is_need_doc_no !== this.originValidateForm.is_need_doc_no &&
      this.addSubProjectCardService.currentCardInfo.is_issue_task_card
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
  * 判断wbs卡某些字段是否修改：修改任务卡信息，wbs任务卡同步
  * @param params
  * @returns
  */
  synchronizeTaskCard(params: any) {
    let doc_type_info = params.doc_type_info;
    let item_condition_value = params.item_condition_value;
    let item_operator = params.item_operator;
    let item_type_value = params.item_type_value;
    let item_type = params.item_type;
    let doc_type_no = params.doc_type_no;
    let doc_no = params.doc_no;
    let type_condition_value = params.type_condition_value;
    let sub_type_condition_value = params.sub_type_condition_value;
    let outsourcing_condition_value = params.outsourcing_condition_value;
    if ('REVIEW' === params.task_category) {
      doc_no = params.doc_no ? params.doc_no : '';
      doc_type_no = params.doc_type_no ? params.doc_type_no : '';
      type_condition_value = params.type_condition_value ? params.type_condition_value : '';
      outsourcing_condition_value = params.outsourcing_condition_value ? params.outsourcing_condition_value : '';
      sub_type_condition_value = params.sub_type_condition_value ? params.sub_type_condition_value : '';
    }
    if (['ODAR', 'REVIEW'].filter(item => { return item === params.task_category; })) {
      doc_type_info = params.doc_type_info ? params.doc_type_info : [{ doc_condition_value: '' }];
      item_condition_value = params.item_condition_value ? params.item_condition_value : '';
      item_operator = params.item_operator ? params.item_operator : '';
      if (!item_type && (this.originValidateForm.item_type === '1')) {
        item_type = '1';
      }
      item_type_value = params.item_type_value ? params.item_type_value : '';
    }
    if (
      (params.task_name !== this.originValidateForm.task_name ||
        this.originValidateForm.TaskMemberInfoChange ||
        params.liable_person_code !== this.originValidateForm.liable_person_code ||
        params.plan_start_date !== this.originValidateForm.plan_start_date ||
        params.plan_finish_date !== this.originValidateForm.plan_finish_date ||
        params.task_category !== this.addSubProjectCardService.taskCategory ||
        JSON.stringify(doc_type_info) !==
        JSON.stringify(this.originValidateForm.doc_type_info) ||
        item_type !== this.originValidateForm.item_type ||
        item_type_value !== this.originValidateForm.item_type_value ||
        params.item_type_name !== this.originValidateForm.item_type_name ||
        item_operator !== this.originValidateForm.item_operator ||
        item_condition_value !== this.originValidateForm.item_condition_value ||
        doc_type_no !== this.originValidateForm.doc_type_no ||
        doc_no !== this.originValidateForm.doc_no ||
        type_condition_value !== this.originValidateForm.type_condition_value ||
        sub_type_condition_value !== this.originValidateForm.sub_type_condition_value ||
        outsourcing_condition_value !==
        this.originValidateForm.outsourcing_condition_value) &&
      (this.wbsService.projectInfo?.project_status === '30' ||
        this.wbsService.projectInfo?.project_status === '50')
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
  * 任务比重校验
  * @param params
  */
  taskProportionCheck(): void {
    this.wbsService.$checkProportion.next(true);
  }

  /**
   * 调取依赖关系检查所配关系是否可用
   * @param createTask 是否是新建任务卡
   * @param params 任务卡信息
   * @param temp_doc_condition_value 单别条件值
   * @param taskInfo 创建任务卡后回参
   */
  taskDependencyCheck(params: any, temp_doc_condition_value: any): void {
    const taskProperty = this.source === Entry.maintain ? '2' : '1';
    this.addSubProjectCardService.taskDependencyCheck(params, taskProperty).then((res) => {
      // 经讨论, check是从依赖表做检核的但点确定才会写入依赖表, 无法先做到检核后再确认
      // 确定后, 调取依赖关系检查所配关系是否可用
      params.liable_person_name = liablePersonName(this.originPersonList, params);
      params.doc_condition_value = temp_doc_condition_value;
      this.validateForm.reset();
      this.parentTaskSerialNumList = [];
      this.preTaskNumList = [];
      this.addSubProjectCardService.isShowAutoSchedule = false;
    }, (err) => {
      this.messageService.error(err);
    });
  }

  /**
  * 更新wbs界面任务卡列表
  * @param params true ｜ taskInfo
  */
  updateWbsTasks(params): void {
    this.wbsService.pageChange.next(params);
  }

  /**
  * 处理任务卡的上阶任务
  * @param params 任务卡信息
  */
  handleUpperLevelTask(params: any): void {
    params.upper_level_task_status = '10';
    if (params.upper_level_task_no) {
      const { firstLevelTaskCard } = this.addSubProjectCardService;
      if (firstLevelTaskCard?.task_no === params.upper_level_task_no) {
        params.upper_level_task_status = String(firstLevelTaskCard?.task_status);
      } else {
        this.getUpperLevelStatus(firstLevelTaskCard?.children, params.upper_level_task_no);
        params.upper_level_task_status = this.upper_level_task_status;
      }
    }
  }

  /**
  * 获取上阶任务状态
  * @param data
  * @param upper_level_task_no
  */
  getUpperLevelStatus(data, upper_level_task_no) {
    for (const i in data) {
      if (data[i].task_no === upper_level_task_no) {
        this.upper_level_task_status = String(data[i].task_status);
      } else {
        if (data[i].children?.length) {
          this.getUpperLevelStatus(data[i].children, upper_level_task_no);
        }
      }
    }
  }

  /**
  * 创建任务卡
  * @param params 任务卡信息
  * @param temp_doc_condition_value 单别条件值
  */
  taskInfoCreate(params: any, temp_doc_condition_value: string): void {
    this.addSubProjectCardService.taskInfoCreate(params).then((taskInfo) => {
      this.setIsClickSaveButton(false);
      if (taskInfo?.project_no_mistake_message) {
        this.messageService.error(taskInfo.project_no_mistake_message);
        return;
      }
      // upper_level_task_no 上阶任务编号
      if (taskInfo?.upper_level_task_no && ((this.source === Entry.card) || (this.source === Entry.collaborate))) {
        this.addOrDeleteTaskFlow(taskInfo?.upper_level_task_no);
      }
      this.taskDependencyCheck(params, temp_doc_condition_value);
      this.updateWbsTasks('true');
      this.taskProportionCheck();
      this.changeRef.markForCheck();
    });
  }

  /**
  * 添加或删除任务流程
  * @param taskInfo
  */
  addOrDeleteTaskFlow(upper_level_task_no: string): void {
    this.addSubProjectCardService.addOrDeleteTaskFlow(
      this.wbsService.project_no,
      this.wbsService.modelType,
      upper_level_task_no,
      this.source
    );
  }

  /**
  * 确认录入变更原因
  * @param value 变更原因
  */
  changeReasonOk(value): void {
    this.handelData({ value: value, status: true });
  }
  /**  *************************提交任务卡操作*********************** */


  /**  *************************回调操作*********************** */
  /**
   * 难度等级值变化后回调
   * @param data
   */
  callDifficultyLevelForm(data: FormGroup) {
    this.difficultyLevelForm = data;
    const { difficulty_level_name, difficulty_level_no, difficulty_coefficient } = data.value.difficultyLevelObj ?? {};
    this.validateForm.patchValue({ difficulty_level_name, difficulty_level_no, difficulty_coefficient, });
  }

  /**
  * 删除任务模板地方的回调
  * @param e
  */
  callDeleteTaskTemplate(e: any): void {
    if (e) {
      e.stopPropagation();
    }
    const service = this.addSubProjectCardService;
    service.validateForm.controls['is_need_doc_no'].patchValue(null);
    service.validateForm.get('is_need_doc_no').enable();
    service.taskTemplateName = '';
    service.taskTemplateNo = null;
    service.arStageNo = '';
    service.arStageName = '';
    this.taskCategoryType = '';
    this.taskTemplateInfo = { task_category: 'ORD', changeTemplateInfo: true };
    if (this.source === Entry.maintain) {
      this.chilLliablePerson.taskCategoryType = '';
      // 是否禁用执行人
      this.chilLliablePerson.disableExecutorInput(this.taskCategoryType);
      this.liable_person_code_data = this.chilLliablePerson.liable_person_code_data;
      this.chilLliablePerson.taskTemplateInfo = { task_category: 'ORD' };
      if (this.liable_person_code_data) {
        // 删除任务时模板需要校验责任人
        this.chilLliablePerson.personInCharge(this.liable_person_code_data, true);
      }
      if (this.addSubProjectCardService.validateForm.value.task_member_info) {
        // 删除模板校验执行人
        this.chilLliablePerson.personChanges(this.addSubProjectCardService.validateForm.value.task_member_info);
      }
    } else {
      this.chilLliablePersonRole.taskCategoryType = '';
      // 是否禁用执行人
      this.chilLliablePersonRole.disableExecutorInput(this.taskCategoryType);
      this.liable_person_code_data = this.chilLliablePersonRole.liable_person_code_data;
      this.chilLliablePersonRole.taskTemplateInfo = { task_category: 'ORD' };
      if (this.liable_person_code_data) {
        // 删除任务时模板需要校验责任人
        this.chilLliablePersonRole.personInCharge(this.liable_person_code_data, true);
      }
      if (this.addSubProjectCardService.validateForm.value.task_member_info) {
        // 删除模板校验执行人
        this.chilLliablePersonRole.personChanges(this.addSubProjectCardService.validateForm.value.task_member_info);
      }
    }

    this.childMoreControl.resetBAreaData();
    if (!this.addSubProjectCardService.taskTemplateName) {
      this.advancedOptionComponent.validateForm.get('main_unit').enable(); // 主单位
      this.advancedOptionComponent.validateForm.controls['main_unit'].patchValue('0');
      this.advancedOptionComponent.validateForm.get('second_unit').enable(); // 次单位
      this.advancedOptionComponent.validateForm.get('second_unit').patchValue('0');
      this.advancedOptionComponent.validateForm.get('standard_work_hours').enable(); // 标准工时
      this.advancedOptionComponent.validateForm.get('standard_days').enable(); // 标准天数
      this.changeRef.markForCheck();
    }
  }

  /**
   * 选择任务模板开窗回调：切换了任务模板后，任务类型也会跟着变化，需要重新对弹窗逻辑进行初始化
   * @returns
   */
  callChooseTaskTemplate(selectOption): void {
    /** 当前选择的模板 */
    this.validateForm.get('is_need_doc_no').patchValue(false);
    this.childMoreControl.setDocTypeInfoList(selectOption);
    this.childMoreControl.setItemType(selectOption);
    this.taskTemplateInfo = selectOption;
    this.taskTemplateInfo.changeTemplateInfo = true;
    this.patchFormValue(this.taskTemplateInfo);
    this.childMoreControl.resetBRegionValue(selectOption.task_category); // 特定的任务类型时候需要清空
    this.setMoreControlValues(selectOption.task_category); // MO_H
    this.setMoreControlValueOfSft();
    this.taskCategoryForApc(selectOption.task_category); // APC / APC_O.APC
    this.taskCategoryForMOMA(selectOption.task_category); // MOMA
    this.taskCategoryForPO_KEY(selectOption.task_category); // PO_KEY
    this.addSubProjectCardService.taskTemplateName = selectOption.parameter_name;
    this.addSubProjectCardService.taskTemplateNo = selectOption.parameter_no;
    this.addSubProjectCardService.eocCompanyId = selectOption.eoc_company_id ? { id: selectOption.eoc_company_id } : '—';
    this.addSubProjectCardService.eocSiteId = selectOption.eoc_site_id ? { id: selectOption.eoc_site_id } : '—';
    this.addSubProjectCardService.eocRegionId = selectOption.eoc_region_id ? { id: selectOption.eoc_region_id } : '—';
    this.taskCategoryType = selectOption.task_category;
    if (this.source === Entry.maintain) {
      this.chilLliablePerson.taskCategoryType = selectOption.task_category;
    } else {
      this.chilLliablePersonRole.taskCategoryType = selectOption.task_category;
    }
    // 任务类型为账款分期
    if (selectOption.task_category === 'ODAR') {
      const salesCode = this.wbsService.projectInfo?.sales_no;
      if (!this.validateForm.get('liable_person_code').value) {
        this.getPaymentOpenDefine(selectOption.eoc_company_id || '');
      }
      if (this.source === Entry.maintain) {
        // 负责人回显并检查授权
        this.personList.forEach(({ list = [] }) => {
          list.forEach((c) => {
            if (c.id === salesCode) {
              this.liable_person_code_data = c;
              this.validateForm.get('liable_person_code').patchValue(salesCode);
              this.commonService.getInvData('auth.employee.info.check', {
                employee_info: [{ employee_no: c.id, employee_name: c.name }],
              })
                .subscribe(({ data }: any) => {
                  const { employee_info } = data;
                  if (employee_info.length) {
                    this.liable_person_code_data = '';
                    this.validateForm.get('liable_person_code').patchValue('');
                  }
                  this.changeRef.markForCheck();
                });
            }
          });
        });
      } else {
        this.personList.forEach(person => {
          person.children?.forEach((child) => {
            child.children.forEach(c => {
              if (c.id === salesCode) {
                this.liable_person_code_data = c;
                this.validateForm.get('liable_person_code').patchValue(salesCode);
                this.commonService.getInvData('auth.employee.info.check', {
                  employee_info: [{ employee_no: c.id, employee_name: c.name }],
                })
                  .subscribe(({ data }: any) => {
                    const { employee_info } = data;
                    if (employee_info.length) {
                      this.liable_person_code_data = '';
                      this.validateForm.get('liable_person_code').patchValue('');
                    }
                    this.changeRef.markForCheck();
                  });
              }
            });
          });
          if (!person.children || !person.children.length) {
            if (person.id === salesCode) {
              this.liable_person_code_data = person;
              this.validateForm.get('liable_person_code').patchValue(salesCode);
              this.commonService.getInvData('auth.employee.info.check', {
                employee_info: [{ employee_no: person.id, employee_name: person.name }],
              })
                .subscribe(({ data }: any) => {
                  const { employee_info } = data;
                  if (employee_info.length) {
                    this.liable_person_code_data = '';
                    this.validateForm.get('liable_person_code').patchValue('');
                  }
                  this.changeRef.markForCheck();
                });
            }
          }
        });
      }
    }
    if (this.source === Entry.maintain) {
      this.chilLliablePerson.checkLiablePersonCodeData(selectOption.task_category);
      this.chilLliablePerson.checkeExecutor(selectOption.task_category);
    } else {
      this.chilLliablePersonRole.checkLiablePersonCodeData(selectOption.task_category);
      this.chilLliablePersonRole.checkeExecutor(selectOption.task_category);
    }

    this.validateForm.get('task_member_info').enable();
    // 取消负责人和执行人的校验
    if (['PLM', 'PLM_PROJECT'].includes(this.taskCategoryType)) {
      this.executor.employee_info = [];
      this.executor.error_msg = '';
      setTimeout(() => {
        if (this.source === Entry.maintain) {
          this.chilLliablePerson.disableExecutorInput(this.taskCategoryType);
        } else {
          this.chilLliablePersonRole.disableExecutorInput(this.taskCategoryType);
        }
      }, 50);
    }
    if (this.addSubProjectCardService.taskTemplateName) {
      this.advancedOptionService.planMainUnitValue = false;
      this.advancedOptionService.planSecondUnitValue = false;
      /** 主单位 次单位 */
      ['main_unit', 'second_unit'].forEach((key) => {
        this.validateForm.get(key).disable();
        this.validateForm.get(key).patchValue('0');
      });
      /** 预计值（主单位） 预计值（次单位） 标准工时 标准天数 */
      ['plan_main_unit_value', 'plan_second_unit_value', 'standard_work_hours', 'standard_days'].forEach((key) => {
        this.validateForm.get(key).disable();
        this.validateForm.get(key).patchValue(null);
      });
    }
    this.changeRef.markForCheck();
  }


  /**
  * 选择任务模板开窗回调
  * @returns
  */
  callCoosePaymentStage(selectOption): void {
    this.addSubProjectCardService.arStageNo = selectOption.instalment_stage; // 款项阶段编号
    this.addSubProjectCardService.arStageName = selectOption.instalment_stage_name; // 款项阶段名称
    this.changeRef.markForCheck();
  }

  /**
 * 任务分类组件值变化后回调
 * @param data
 */
  callTaskClassificationForm(data: FormGroup) {
    this.taskClassificationForm = data;
    const { task_classification_no, task_classification_name } =
      data.value.classificationType ?? {};
    this.validateForm.patchValue({
      task_classification_no,
      task_classification_name,
    });
  }

  /** 前置任务回调 */
  callPreTaskChange(obj): void {
    this.taskDependencyInfoList = obj;
  }

  /**
 * 子组件回调设置父组件的变量
 * @param data 需要设置的数据
 */
  callSetData(data: { [key: string]: any }) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        this[key] = data[key];
      }
    }
  }

  /**
   * liable-person组件：负责人字段值修改
   */
  callChangePersonLiable(event) {
    this.personLiable = event;
  }

  /**
   * 整合数据，供 【参与部门人员】组件使用
   * liable-person组件：负责人 & 执行人 值改变之后会调用
   */
  callChangeMaskData(event) {
    if (this.source === Entry.maintain) {
      this.wbsService.peopleObject = this.liablePersonService.changeMaskData(event.task_member_infoList, event.personList);
    } else {
      this.wbsService.peopleObject = this.liablePersonAddRoleService.changeMaskData(event.task_member_infoList, event.personList);
    }
  }

  /**
 * more-control组件：公司修改回调
 */
  callMoreControlOnEocChange(event): void {
    this.getOpenWindowDefine('1');
  }

  /**
 * app-card-header回调
 * @param event
 * @returns
 */
  callChangStatus(event: any): void {
    if (event.type === 'loading') {
      this.setLoadingStatus(event);
      return;
    }
    if (event.type === 'valueNotUnique') {
      this.setValueNotUnique(event);
      return;
    }
    if (event.type === 'cancleUseTemplate') {
      this.cancleUseTemplate(event);
      return;
    }
  }

  /**
 * 设置当前弹窗是否是加载中
 * @param event
 */
  setLoadingStatus(event: any): void {
    this.loading = event.value;
  }

  /**
 * 设置任务类型工单工时下单别、单号、类型条件值、次类型条件值是否唯一
 * @param event
 */
  setValueNotUnique(event: any): void {
    this.valueNotUnique = event.value;
  }

  /**
 * 取消使用任务模版
 * @param event
 */
  cancleUseTemplate(event: any): void {
    this.preTaskNumList = [];
    this.parentTaskSerialNumList = [];
    this.resetTaskDependencyInfoList();
  }

  /**  ************************* 回调操作 *********************** */


  /**  ************************* 页面或ts中调用的的方法 *********************** */
  /**
  * 重置taskDependencyInfoList
  */
  resetTaskDependencyInfoList(): void {
    this.taskDependencyInfoList?.forEach((item: any) => {
      item.before_task_no = item.default_before_task_no;
    });
  }

  /**
  * 上传文件
  * @param data
  */
  getAttachmentDataForm(data: any) {
    this.attachmentData = data;
  }

  /**
  * 设置表单值
  * @param target
  * @param key
  */
  setValidatorsManual(target: any, key: string): void {
    target.controls[key].setValidators([Validators.required]);
  }

  /**
   * 清除表单值
   * @param target
   * @param key
   */
  clearValidatorsManual(target: any, key: string): void {
    target.controls[key]?.clearValidators();
  }
  /**
  * 【更多】内容的组件管控：设置更多选项中控件的值或者禁用状态
  * @param taskCategory 任务
  * @returns 组件管控
  */
  patchFormValue(taskCategory: any): void {
    const taskCategoryList = ['ODAR', 'REVIEW', 'PLM', 'MES', 'PLM_PROJECT'];
    if (taskCategoryList.includes(taskCategory.task_category)) {
      return;
    }
    taskCategory.doc_type_info = taskCategory.doc_condition_value.split(',');
    CONTROL_ITEM_LIST4.forEach((key: any): void => {
      if (key === 'doc_type_info') {
        this.validateForm.get(key).setValue(taskCategory[key] ? taskCategory[key] : [{ doc_condition_value: '' }]);
      } else {
        this.validateForm.get(key).setValue(taskCategory[key] ? taskCategory[key] : '');
      }
      this.validateForm.get(key).disable();
    });
  }

  /**
   * 根据不同任务类型设置更多选项控件值的禁用状态、默认值等
   * @param taskCategory 任务类型
   */
  setMoreControlValues(taskCategory: string): any {
    if (taskCategory === 'MO_H') {
      this.validateForm.get('doc_type_info').patchValue([{ doc_condition_value: '' }]);
      this.validateForm.get('doc_type_info').disable();
      CONTROL_ITEM_LIST1.forEach((key: string): void => {
        this.validateForm.get(key).patchValue(null);
        this.validateForm.get(key).disable();
      });
      CONTROL_ITEM_LIST2.forEach((key: string): void => {
        this.validateForm.get(key).enable();
      });
    } else {
      if (!TASK_CATEGORY_LIST1.includes(taskCategory)) {
        CONTROL_ITEM_LIST1.forEach((key: string): void => {
          this.validateForm.get(key).enable();
        });
      }
      CONTROL_ITEM_LIST2.forEach((key: string): void => {
        const { task_category } = this.taskTemplateInfo ?? '';
        if (['MOOP', 'SFT', 'APC', 'APC_O', 'PLM', 'PLM_PROJECT', 'REVIEW'].includes(taskCategory)) {
          return;
        }
        if (!(CONTROL_ITEM_LIST3.includes(key) && (task_category === 'PRSUM' || task_category === 'POSUM'))) {
          if (['doc_type_no', 'doc_no'].includes(key) && ['MOOP', 'SFT', 'APC', 'APC_O'].includes(taskCategory)) {
            this.validateForm.get(key).enable();
          } else {
            if (!TASK_CATEGORY_LIST2.includes(taskCategory)) {
              this.validateForm.get(key).patchValue(null);
              this.validateForm.get(key).disable();
            }
            // 【类型条件值】和【次类型条件值】可编辑
            this.validateForm.get(key).enable();
            if (TASK_CATEGORY_LIST2.includes(taskCategory) && !['type_condition_value', 'sub_type_condition_value'].includes(key)) {
              this.validateForm.get(key).patchValue(null);
              this.validateForm.get(key).disable();
            }
          }
        }
      });
    }
    if (['PRSUM', 'POSUM', 'MOOP', 'APC', 'APC_O'].includes(this.taskTemplateInfo?.task_category)) {
      if (taskCategory === 'MOOP') {
        this.validateForm.get('type_condition_value').enable();
        this.validateForm.get('sub_type_condition_value').enable();
      }
      if (this.validateForm.getRawValue().is_need_doc_no) {
        this.validateForm.get('doc_type_no').enable();
        this.validateForm.get('doc_no').enable();
      } else {
        this.validateForm.get('doc_no').patchValue(null);
        this.validateForm.get('doc_no').disable();
        this.validateForm.get('doc_type_no').patchValue(null);
        this.validateForm.get('doc_type_no').disable();
      }
    }
    if (!['PRSUM', 'POSUM', 'MOOP', 'MOOP', 'APC', 'APC_O'].includes(this.taskTemplateInfo?.task_category)) {
      this.validateForm.get('is_need_doc_no').patchValue(false);
    }
    this.validateForm.get('seq').disable();
    const { is_need_doc_no } = this.validateForm.getRawValue();
    if (['MOOP', 'APC_O'].includes(this.taskTemplateInfo?.task_category)) {
      if (is_need_doc_no) {
        this.validateForm.get('seq').enable();
      } else {
        this.validateForm.get('seq').patchValue(null);
      }
    }
    if (['PRSUM', 'POSUM', 'MOOP'].includes(this.taskTemplateInfo?.task_category)) {
      const list = ['doc_type_no', 'doc_no'];
      if (is_need_doc_no) {
        list.forEach((key) => {
          this.validateForm.get(key).enable();
        });
      } else {
        list.forEach((key) => {
          this.validateForm.get(key).patchValue(null);
          this.validateForm.get(key).disable();
        });
      }
    }
    if (taskCategory === 'PLM_PROJECT') {
      this.validateForm.get('task_member_info').patchValue([]);
    }
    if (taskCategory === 'ODAR') {
      this.validateForm.get('doc_type_no').disable();
      this.validateForm.get('doc_no').disable();
      this.validateForm.get('type_condition_value').disable();
      this.validateForm.get('sub_type_condition_value').disable();
      this.validateForm.get('outsourcing_condition_value').disable();
    }
  }

  /**
 * [S 3.0]
 * 1) APC.装配进度控制
 * 2) APC_O.APC单一制程
 * @param taskCategory APC / APC_O.APC
 */
  taskCategoryForApc(taskCategory: string): any {
    // [S 3.0]APC.装配进度控制，【需要单别及单号】默认true且只读
    // [S 3.0]APC_O.APC单一制程，【需要单别及单号及序号】默认true且只读
    if (!taskCategory || !['APC', 'APC_O'].includes(taskCategory)) { return; }
    const displayList = [
      'item_type', // 品号类别/群组
      'item_type_value', // 品号类别条件值
      'item_operator', // 料号运算符
      'item_condition_value', // 料号条件值
      'type_condition_value', // 类型条件值
      'sub_type_condition_value', // 次类型条件值
      'outsourcing_condition_value', // 托外条件值
    ];
    // is_need_doc_no：[需要单别及单号] 或 [需要单别及单号及序号]
    this.addSubProjectCardService.validateForm.get('is_need_doc_no').patchValue(true);
    this.addSubProjectCardService.validateForm.get('is_need_doc_no').disable();
    // 'doc_type_info' 单别条件值
    this.addSubProjectCardService.validateForm.get('doc_type_info').patchValue([{ doc_condition_value: '' }]);
    this.addSubProjectCardService.validateForm.get('doc_type_info').disable();
    displayList.forEach(element => {
      this.addSubProjectCardService.validateForm.get(element).patchValue('');
      this.addSubProjectCardService.validateForm.get(element).disable();
    });
    ['doc_type_no', 'doc_no'].forEach(element => {
      this.addSubProjectCardService.validateForm.get(element).enable();
    });
    if (taskCategory === 'APC_O') {
      this.addSubProjectCardService.validateForm.get('seq').enable();
    }
  }

  /**
   * [S 3.3] MOMA
   * @param taskCategory MOMA
  */
  taskCategoryForMOMA(taskCategory: string): any {
    if (!taskCategory || (taskCategory !== 'MOMA')) { return; }
    this.withTaskCategoryControlForMore();
  }

  /**
   * [S 3.3] MOMA
   * @param taskCategory MOMA
  */
  taskCategoryForPO_KEY(taskCategory: string): any {
    if (!taskCategory || (taskCategory !== 'PO_KEY')) { return; }
    this.withTaskCategoryControlForMore();
  }

  withTaskCategoryControlForMore(displayList?: Array<string>) {
    // 收合区【更多】内：
    // 可编辑：公司编号、单别条件值、品号类别/群组、品号类别条件值、料号运算符、料号条件值、类型条件值、次类型条件值
    // 不可编辑：单别、单号、序号、托外条件值
    displayList = displayList ? displayList : [
      'doc_type_no', // 单别
      'doc_no', // 单号
      'seq', // 序号
      'outsourcing_condition_value', // 托外条件值
    ];
    displayList.forEach(element => {
      this.addSubProjectCardService.validateForm.get(element).patchValue(null);
      this.addSubProjectCardService.validateForm.get(element).disable();
    });
  }

  /**
 * 动态设置弹窗样式
 * @returns
 */
  getMaskPosition(): any {
    return {
      top: `${this.maskPosition.top}px`,
      left: `${this.maskPosition.left}px`,
      width: `${this.maskPosition.width}px`,
      height: `${this.maskPosition.height}px`,
    };
  }

  /**
 * html 中文字翻译
 * @param val
 */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  /**
* html 中文字翻译
* @param val
*/
  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

  keyDown(event: any): boolean {
    if (event.keyCode === 13 && !event.target.className.split(' ').includes('textarea-input')) {
      return false;
    }
  }

  displayWith = (node: NzTreeNode) => node.title

  mousemove(ev: MouseEvent, type: string): void {
    if (this.mDown) {
      this.maskPosition.top += ev.movementY;
      this.maskPosition.left += ev.movementX;
      ev.stopPropagation();
    }
  }

  mousedown(ev: any, type: string): void {
    ev?.path?.forEach((res) => {
      if (
        res.localName === 'input' ||
        (typeof res.className === 'string' && res.className?.includes('ant-form-item'))
      ) {
        type = '';
      }
    });
    this.mDown = type;
    ev.stopPropagation();
  }

  mouseup(ev: MouseEvent): void {
    this.mDown = '';
    ev.stopPropagation();
  }

  changeHeight(): void {
    const activeobj = document.getElementById('attachmentRemark');
    const height = Number(activeobj?.style?.height?.substring(0, activeobj?.style.height.length - 2));
    if (height > activeobj?.scrollHeight) {
      return;
    }
    activeobj.style.height = activeobj?.scrollHeight + 2 + 'px';
  }

  changeHeightR() {
    const activeobj1 = document.getElementById('remark');
    const remarkHeight = Number(
      activeobj1?.style.height.substring(0, activeobj1?.style.height.length - 2)
    );
    if (remarkHeight > activeobj1?.scrollHeight) {
      return;
    }
    activeobj1.style.height = activeobj1?.scrollHeight + 2 + 'px';
  }
}


