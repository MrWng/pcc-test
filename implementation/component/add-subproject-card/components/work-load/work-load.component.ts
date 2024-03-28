import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { cloneDeep } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { Entry } from 'app/implementation/service/common.service';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { AddSubProjectCardService } from '../../add-subproject-card.service';
import { WorkLoadService } from '../../services/work-load.service';
import { CommonService } from '../../../../service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { DynamicWbsService } from '../../../wbs/wbs.service';

@Component({
  selector: 'app-work-load',
  templateUrl: './work-load.component.html',
  styleUrls: ['./work-load.component.less'],
})
export class WorkLoadComponent implements OnInit {
  @Input() validateForm: FormGroup;
  @Input() source: any;
  @Input() projectInfo: any;
  @Input() designStatus: string = '';
  @Input() project_no: string = '';

  /** 更新wbs界面任务卡列表 */
  @Output() updateWbsTasks = new EventEmitter();
  // 控制【子项开窗】loading
  @Output() setLoading = new EventEmitter();

  Entry = Entry;
  /** 工期单位 */
  listOfTime: any[] = [
    { label: this.translateService.instant('dj-default-小时'), value: '1' },
    { label: this.translateService.instant('dj-default-日'), value: '2' },
    { label: this.translateService.instant('dj-default-月'), value: '3' },
  ];
  /** 开始日期提示信息 */
  startNotice = '';
  startNoticeForlate = '';
  startNoticeErrorInfo = '';
  /** 结束日期提示信息 */
  endNotice = '';
  endNoticeForEarly = '';
  endNoticeErrorInfo = '';

  /** 是否完成结束日期反推天数 */
  isHasRerverse: boolean = false;
  /** 一级任务卡信息 */
  parentTime: any;

  private workloadQtyChange$ = new Subject<number>();

  // 自动重推日期及工期
  automatic_re_push: boolean = true;

  // 控制日期同值按钮的 可用 / 置灰
  // 1.新增置灰；2.编辑可用；3.任务状态不是未开始，都置灰
  isDisable: boolean = false;
  // 是否调用API进行推算
  isCallTaskWorkCalendar: boolean = true;
  // 是否格式化[工期]栏位
  isFormatterPercent: boolean = false;

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private messageService: NzMessageService,
    private translateService: TranslateService,
    private fb: FormBuilder,
    private workLoadService: WorkLoadService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
    public wbsService: DynamicWbsService
  ) {}

  ngOnInit(): void {
    this.setIsDisable();
    this.addSubProjectCardService.getDateCheck();
    this.monitorWorkloadQtyChange();
  }

  // 不禁用状态
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  onFocusForWorkLoadQty($event) {
    if (!this.validateForm.controls['workload_qty'].value) {
      if (this.validateForm.controls['workload_qty'].status === 'DISABLED') {
        return;
      }
      this.validateForm.get('workload_qty').reset();
    }
  }

  onFocusForWorkHours($event) {
    if (!this.validateForm.controls['plan_work_hours'].value) {
      if (this.validateForm.controls['plan_work_hours'].status === 'DISABLED') {
        return;
      }
      this.validateForm.get('plan_work_hours').reset();
    }
  }

  // 修改工期
  workloadQtyChange(workload_qty: number): void {
    this.workloadQtyChange$.next(workload_qty);
  }

  /**
   * 监听工期值改变:
   * 1: 工期改变,设置预计工时,
   * 2: 如果有开始时间和工期,设置结束时间
   */
  monitorWorkloadQtyChange(): void {
    let num: number = 0;
    this.workloadQtyChange$.pipe(debounceTime(500)).subscribe((workload_qty) => {
      num++;
      if (!(Number(workload_qty) > 0) || num === 1 || !this.isCallTaskWorkCalendar) {
        this.isFormatterPercent = true; // 初始化渲染，后，开启[工期]精度控制
        this.isCallTaskWorkCalendar = true;
        return;
      }
      this.setLoading.emit({ value: true });
      this.callTaskWorkCalendarFn('1', 'workload_qty', workload_qty);
    });
  }

  // 修改工期单位
  // workloadUnitChange(workload_unit: any): void {
  //   if (!this.getFormItem('workload_qty').value) {
  //     return;
  //   }
  //   this.callTaskWorkCalendar('1');
  // }

  // 修改开始时间
  startTimeChange(start_time: any): void {
    const plan_start_date = start_time ? moment(start_time).format('YYYY/MM/DD') : '';
    if (this.getFormItem('plan_start_date') === plan_start_date) {
      return;
    }
    this.setFormValue('plan_start_date', plan_start_date);
    // 预计开始时间，记录校验信息
    this.startNotice = '';
    this.startNoticeForlate = '';
    // 校验，预计开始时间，并进行提示
    if (plan_start_date) {
      const startTime = moment(start_time).format('YYYY-MM-DD');
      // 项目变更，任务卡，预计开始，校验信息
      if (this.source === Entry.projectChange) {
        this.checkPromptForStartDateByProjectChangeEntry(startTime);
      }

      // 协同排定，任务卡，预计开始，校验信息
      if (this.source === Entry.collaborate) {
        this.checkPromptForStartDateByCollaborateEntry(startTime);
      }

      // 项目计划维护、模板，任务卡，预计开始，校验信息
      if (this.source === Entry.card || this.source === Entry.maintain) {
        this.checkPromptForStartDateByCardOrMaintainEntry(startTime);
      }
    }
    if (
      (!this.getFormItem('workload_qty') && !this.getFormItem('plan_finish_date')) ||
      !this.getFormItem('plan_start_date') ||
      !this.isCallTaskWorkCalendar
    ) {
      this.isCallTaskWorkCalendar = true;
      return;
    }
    this.setLoading.emit({ value: true });
    this.callTaskWorkCalendarFn('1', 'plan_start_date', plan_start_date);
  }

  // 项目计划维护、模板，预计开始，校验信息
  checkPromptForStartDateByCardOrMaintainEntry(startTime: string): void {
    // 校验，和上阶任务卡（一级任务卡)
    const { firstLevelTaskCard, buttonType } = this.addSubProjectCardService;
    const task_no =
      this.getFormItem('task_no') ?? this.addSubProjectCardService.currentCardInfo?.task_no;
    if (
      ((firstLevelTaskCard?.children?.length && buttonType === 'EDIT') ||
        (firstLevelTaskCard?.task_no && buttonType !== 'EDIT')) &&
      task_no !== firstLevelTaskCard?.task_no
    ) {
      // 获取卡一级的内容
      this.getParentTime(firstLevelTaskCard); // this.parentTime
      if (
        this.parentTime?.plan_start_date &&
        startTime < moment(this.parentTime.plan_start_date).format('YYYY-MM-DD')
      ) {
        this.startNotice = this.translateService.instant(`dj-pcc-预计开始日早于上阶任务预计开始日`);
      } else if (
        this.parentTime?.plan_finish_date &&
        startTime > moment(this.parentTime.plan_finish_date).format('YYYY-MM-DD')
      ) {
        this.startNotice = this.translateService.instant(`dj-pcc-预计开始日晚于上阶任务预计完成日`);
      } else {
        this.startNotice = '';
      }
      this.changeRef.markForCheck();
    }

    // 校验，和下阶任务卡
    const paras = {
      query_condition: 'M1',
      task_info: [
        {
          project_no: this.project_no,
          upper_level_task_no: task_no,
          task_property: this.source === Entry.maintain ? '2' : '1',
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
          this.startNoticeForlate = this.translateService.instant(
            `dj-pcc-预计开始日已晚于下阶任务的最小预计开始日！`
          );
        } else {
          this.startNoticeForlate = '';
        }
        this.changeRef.markForCheck();
      },
      (err) => {
        this.setLoading.emit({ value: false });
      }
    );
  }

  // 项目变更，任务卡，预计开始，校验信息
  checkPromptForStartDateByProjectChangeEntry(startTime: string): void {
    const firstLevelTaskCard = this.addSubProjectCardService.firstLevelTaskCard;

    // 校验，和上阶任务卡（一级任务卡)
    const task_no =
      this.getFormItem('task_no') ?? this.addSubProjectCardService?.currentCardInfo?.task_no;
    if (
      task_no &&
      firstLevelTaskCard.task_no !== task_no &&
      firstLevelTaskCard?.plan_start_date &&
      startTime < moment(firstLevelTaskCard?.plan_start_date).format('YYYY-MM-DD')
    ) {
      this.messageService.error(
        this.translateService.instant(`dj-default-任务开始日期不可小于一级计划的开始日期，请核查！`)
      );
    }
    if (
      task_no &&
      firstLevelTaskCard.task_no !== task_no &&
      firstLevelTaskCard?.plan_start_date &&
      startTime > moment(firstLevelTaskCard?.plan_finish_date).format('YYYY-MM-DD')
    ) {
      this.messageService.error(
        this.translateService.instant(`dj-default-任务开始日期不可大于一级计划的结束日期，请核查！`)
      );
    }

    // 校验，和下阶任务卡
    const params = {
      excluded_already_deleted_task: true,
      project_change_task_detail_info: [
        {
          project_no: this.project_no, // 项目编号
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
          this.startNoticeForlate = this.translateService.instant(
            `dj-pcc-预计开始日已晚于下阶任务的最小预计开始日！`
          );
        } else {
          this.startNoticeForlate = '';
        }
        this.changeRef.markForCheck();
      },
      (err) => {
        this.setLoading.emit({ value: false });
      }
    );
  }

  // 协同排定，预计开始，校验信息
  checkPromptForStartDateByCollaborateEntry(startTime: string): void {
    // 校验，和上阶任务卡（一级任务卡)
    const task_no =
      this.getFormItem('task_no') ?? this.addSubProjectCardService.currentCardInfo?.task_no;
    // if (startTime < moment(plan_start_date).format('YYYY-MM-DD')) {
    //   this.messageService.error(this.translateService.instant(`dj-default-任务开始日期小于一级计划的开始日期！`));
    // }
    // if (startTime > moment(plan_finish_date).format('YYYY-MM-DD')) {
    //   this.messageService.error(this.translateService.instant(`dj-default-任务开始日期不可大于一级计划的结束日期，请核查！`));
    // }
    if (this.addSubProjectCardService.firstLevelTaskCard) {
      const {
        root_task_plan_start_date: plan_start_date,
        root_task_plan_finish_date: plan_finish_date,
      } = this.addSubProjectCardService.firstLevelTaskCard;
      // s17: 交付设计器日期管控
      if (
        startTime &&
        plan_start_date &&
        this.addSubProjectCardService.dateCheck === '1' &&
        startTime < moment(plan_start_date).format('YYYY-MM-DD')
      ) {
        this.setLoading.emit({ value: false });
        this.startNoticeErrorInfo =
          this.translateService.instant(
            `dj-pcc-开始日期不可早于任务内一级计划的开始日期(API-95的原根任务预计开始日期)`
          ) + `(${plan_start_date})！`;
        return;
      } else {
        this.startNoticeErrorInfo = '';
      }
    }

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
          project_no: this.project_no, // 项目编号
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
          this.startNoticeForlate = this.translateService.instant(
            `dj-pcc-预计开始日已晚于下阶任务的最小预计开始日！`
          );
        } else {
          this.startNoticeForlate = '';
        }
        this.changeRef.markForCheck();
      },
      (err) => {
        this.setLoading.emit({ value: false });
      }
    );
  }

  // 修改结束日期
  endTimeChange(end_time: any): void {
    const plan_finish_date = end_time ? moment(end_time).format('YYYY/MM/DD') : '';
    if (this.getFormItem('plan_finish_date') === plan_finish_date) {
      return;
    }
    this.setFormValue('plan_finish_date', plan_finish_date);

    // 校验结束日期
    this.endNoticeForEarly = '';
    this.endNotice = '';
    if (plan_finish_date) {
      this.checkPromptForFinishDate(plan_finish_date);
    }

    if (
      (!this.getFormItem('workload_qty') && !this.getFormItem('plan_start_date')) ||
      !this.getFormItem('plan_finish_date') ||
      !this.isCallTaskWorkCalendar
    ) {
      this.isCallTaskWorkCalendar = true;
      return;
    }
    this.setLoading.emit({ value: true });
    this.callTaskWorkCalendarFn('2', 'plan_finish_date', plan_finish_date);
  }

  // 校验结束日期
  checkPromptForFinishDate(plan_finish_date: any): void {
    const endTime = moment(plan_finish_date).format('YYYY-MM-DD');
    if (this.source === Entry.projectChange) {
      // 项目变更，任务卡，预计结束日期，校验信息
      this.checkPromptForFinishDateByProjectChangeEntry(endTime);
    } else if (this.source === Entry.collaborate) {
      // 协同排定，任务卡，预计结束日期，校验信息
      this.checkPromptForFinishDateByCollaborateEntry(endTime);
    } else {
      // 项目计划维护、模板，任务卡，预计结束日期，校验信息
      this.checkPromptForFinishDateByCardOrMaintainEntry(endTime);
    }

    // 校验，和项目结束日期
    if (
      [Entry.card, Entry.collaborate].includes(this.source) &&
      endTime > moment(this.wbsService.projectInfo?.plan_finish_date).format('YYYY-MM-DD')
    ) {
      this.messageService.error(
        this.translateService.instant(`dj-default-任务结束日期不可超过项目结束日期,请核查！`)
      );
    }
  }

  // 项目变更，任务卡，预计结束日期，校验信息
  checkPromptForFinishDateByProjectChangeEntry(endTime: string): void {
    const { firstLevelTaskCard, buttonType } = this.addSubProjectCardService;
    const entryCondition = this.source === Entry.maintain || this.source === Entry.card; // 项目、协同任务卡
    const editCondition = firstLevelTaskCard?.children?.length && buttonType === 'EDIT';
    const addCondition = firstLevelTaskCard?.task_no && buttonType !== 'EDIT';
    const task_no =
      this.getFormItem('task_no') ?? this.addSubProjectCardService.currentCardInfo?.task_no;
    const taskNoCondition = task_no !== firstLevelTaskCard?.task_no;
    const endNoticeCondition = (editCondition || addCondition) && taskNoCondition;
    if (entryCondition && endNoticeCondition) {
      // 校验，和上阶任务卡（一级任务卡)
      if (
        firstLevelTaskCard?.plan_finish_date &&
        endTime > moment(firstLevelTaskCard?.plan_finish_date).format('YYYY-MM-DD')
      ) {
        this.setLoading.emit({ value: false });
        this.messageService.error(
          this.translateService.instant(
            `dj-default-任务结束日期不可大于一级计划的结束日期，请核查！`
          )
        );
        return;
      }
    }
    // 校验，和下阶任务卡
    const params = {
      excluded_already_deleted_task: true,
      project_change_task_detail_info: [
        {
          project_no: this.project_no, // 项目编号
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
          this.endNoticeForEarly = this.translateService.instant(
            `dj-pcc-预计结束日已早于下阶任务的最大预计结束日！`
          );
        } else {
          this.endNoticeForEarly = '';
        }
        this.changeRef.markForCheck();
      },
      (err) => {
        this.setLoading.emit({ value: false });
      }
    );
  }

  // 协同排定，任务卡，预计结束日期，校验信息
  checkPromptForFinishDateByCollaborateEntry(endTime: string): void {
    // 校验，和上阶任务卡（一级任务卡)
    // if (endTime > moment(this.addSubProjectCardService.firstLevelTaskCard?.plan_finish_date).format('YYYY-MM-DD')) {
    //   this.messageService.error(this.translateService.instant(`dj-default-任务结束日期大于一级计划的结束日期！`));
    // }
    if (this.addSubProjectCardService.firstLevelTaskCard) {
      const {
        root_task_plan_start_date: plan_start_date,
        root_task_plan_finish_date: plan_finish_date,
      } = this.addSubProjectCardService.firstLevelTaskCard;
      // s17: 交付设计器日期管控
      if (
        endTime &&
        plan_finish_date &&
        this.addSubProjectCardService.dateCheck === '1' &&
        endTime > moment(plan_finish_date).format('YYYY-MM-DD')
      ) {
        this.setLoading.emit({ value: false });
        this.endNoticeErrorInfo =
          this.translateService.instant(
            `dj-pcc-结束日期不可晚于任务内一级计划的结束日期(API-95的原根任务预计结束日期)`
          ) + `(${plan_finish_date})！`;
        return;
      } else {
        this.endNoticeErrorInfo = '';
      }
    }
    // 校验，和下阶任务卡
    const bpmData = this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData;
    const taskInfo = bpmData?.assist_schedule_info
      ? bpmData?.assist_schedule_info[0]
      : bpmData?.task_info[0];
    const assist_schedule_seq = taskInfo['assist_schedule_seq']
      ? taskInfo['assist_schedule_seq']
      : taskInfo['teamwork_plan_seq'];
    const task_no =
      this.getFormItem('task_no') ?? this.addSubProjectCardService.currentCardInfo?.task_no;
    const params = {
      query_condition: 'M1', // 查询范围
      level_type: '1', // 阶层类型
      assist_task_detail_info: [
        {
          project_no: this.project_no, // 项目编号
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
          this.endNoticeForEarly = this.translateService.instant(
            `dj-pcc-预计结束日已早于下阶任务的最大预计结束日！`
          );
        } else {
          this.endNoticeForEarly = '';
        }
        this.changeRef.markForCheck();
      },
      (err) => {
        this.setLoading.emit({ value: false });
      }
    );
  }

  // 项目计划维护、模板，预计结束日期，校验信息
  checkPromptForFinishDateByCardOrMaintainEntry(endTime: any): void {
    // 校验，和上阶任务卡（一级任务卡)
    const { firstLevelTaskCard, buttonType } = this.addSubProjectCardService;
    const entryCondition = this.source === Entry.maintain || this.source === Entry.card; // 项目、协同任务卡
    const editCondition = firstLevelTaskCard?.children?.length && buttonType === 'EDIT';
    const addCondition = firstLevelTaskCard?.task_no && buttonType !== 'EDIT';
    const task_no =
      this.getFormItem('task_no') ?? this.addSubProjectCardService.currentCardInfo?.task_no;
    const taskNoCondition = task_no !== firstLevelTaskCard?.task_no;
    const endNoticeCondition = (editCondition || addCondition) && taskNoCondition;
    if (entryCondition && endNoticeCondition) {
      this.getParentTime(firstLevelTaskCard); // this.parentTime
      const { plan_start_date, plan_finish_date } = this.parentTime ?? {};
      if (plan_start_date && endTime < moment(plan_start_date).format('YYYY-MM-DD')) {
        this.endNotice = this.translateService.instant(`dj-pcc-预计完成日早于上阶任务预计开始日`);
      } else if (
        plan_finish_date &&
        endTime > moment(this.parentTime.plan_finish_date).format('YYYY-MM-DD')
      ) {
        this.endNotice = this.translateService.instant(`dj-pcc-预计完成日晚于上阶任务预计完成日`);
      } else {
        this.endNotice = '';
      }
    }

    // 校验，和下阶任务卡
    const paras = {
      query_condition: 'M1',
      task_info: [
        {
          project_no: this.project_no,
          upper_level_task_no: task_no,
          task_property: this.source === Entry.maintain ? '2' : '1',
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
          this.endNoticeForEarly = this.translateService.instant(
            `dj-pcc-预计结束日已早于下阶任务的最大预计结束日！`
          );
        } else {
          this.endNoticeForEarly = '';
        }
        this.changeRef.markForCheck();
      },
      (err) => {
        this.setLoading.emit({ value: false });
      }
    );
  }

  // 日期同值
  setSameValue(event) {
    if (
      event.target.className.includes('dis-btn-event') ||
      event.target.className.includes('dis-btn')
    ) {
      return;
    }
    this.setIsDisable(true);

    let project_no = this.wbsService.projectInfo.project_no
      ? this.wbsService.projectInfo.project_no
      : this.wbsService.projectInfo.project_template_no;
    if (!project_no) {
      project_no = this.project_no;
    }
    this.workLoadService
      .setSameValue(project_no, this.source, this.wbsService.change_version)
      .pipe(debounceTime(1000))
      .subscribe(
        (res) => {
          if (!res) {
            // 调用失败，按钮，仍然可用
            this.setIsDisable(false);
            return;
          }
          const info = this.translateService.instant('dj-default-更新成功');
          this.athMessageService.success(info);

          this.updateWbsTasks.emit(this.addSubProjectCardService.currentCardInfo);
        },
        (err) => {
          this.setIsDisable(true);
        }
      );
  }

  /**
   * 开始时间：是否可选
   * @param startValue
   * @returns
   */
  disabledStartDate = (startValue: Date): boolean => {
    if (!startValue) {
      return false;
    }
    if (
      this.wbsService.projectInfo?.plan_finish_date &&
      [Entry.collaborate, Entry.card, Entry.projectChange].includes(this.source)
    ) {
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
   * @returns
   */
  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue) {
      return false;
    }
    const { plan_start_date } = this.addSubProjectCardService.validateForm.getRawValue();
    if (
      this.source === Entry.card ||
      this.source === Entry.collaborate ||
      this.source === Entry.projectChange
    ) {
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
    } else {
      if (plan_start_date) {
        return moment(endValue).format('YYYY-MM-DD') < moment(plan_start_date).format('YYYY-MM-DD');
      } else {
        return false;
      }
    }
  };

  // 获取一级任务卡信息
  getParentTime(data) {
    const parentId = this.addSubProjectCardService.validateForm.getRawValue().upper_level_task_no;
    if (data.task_no === parentId) {
      this.parentTime = data;
    }
    for (const i in data.children) {
      if (data.children[i].task_no === parentId) {
        this.parentTime = data.children[i];
      } else {
        if (data.children[i].children?.length) {
          this.getParentTime(data.children[i]);
        }
      }
    }
  }

  translateWord(val: string, type?: string): String {
    const info = type === 'pcc' ? `dj-pcc-${val}` : `dj-default-${val}`;
    return this.translateService.instant(info);
  }

  translateForAutomaticTip(): String {
    const tip =
      '勾选此栏位，在当前界面维护日期、工期，将依据系统标准规则自动互推，若不勾选，则系统不进行互推，以用户手填信息为准。';
    return this.translateWord(tip, 'pcc');
  }

  getFormItem(key: string): any {
    let value = this.validateForm.value[key];
    // 为了兼容 setSomeEdit()
    // this.validateForm.controls[control].disable();
    // 导致的数据丢失问题
    const { task_status, plan_start_date, old_task_status } =
      this.addSubProjectCardService.currentCardInfo;
    if (Number(old_task_status || task_status) > 10 && key === 'plan_start_date') {
      value = plan_start_date;
    }
    return value;
  }

  setFormValue(key: string, value: any): any {
    this.addSubProjectCardService.validateForm.get(key).patchValue(value);
  }

  /**
   * 控制日期同值按钮的 可用 / 置灰
   * @param value = true，置灰
   */
  setIsDisable(value?: boolean): void {
    const { buttonType, currentCardInfo } = this.addSubProjectCardService;
    // 控制日期同值按钮的 可用 / 置灰
    // 1.新增置灰；2.编辑可用；3.点击后置灰，再编辑又可用；4.任务状态不是未开始，都置灰
    if (
      buttonType === 'EDIT' &&
      (currentCardInfo?.old_task_status
        ? currentCardInfo?.old_task_status === '10'
        : currentCardInfo?.task_status === '10')
    ) {
      this.isDisable = false;
    } else {
      this.isDisable = true;
    }
    if (value !== undefined) {
      this.isDisable = value;
    }
  }

  /**
   * 调用推算栏位值的API
   * @param calculation_method 计算方式
   * @param callName 调用的栏位名称
   * @param callVale 调用的栏位值
   */
  callTaskWorkCalendarFn(calculation_method: string, callName: string, callVale: any) {
    const task_no =
      this.getFormItem('task_no') ?? this.addSubProjectCardService.currentCardInfo?.task_no;
    const params = {
      is_repush_workload_qty_and_date: this.automatic_re_push, // 是否重推工作量及日期
      calculation_method, // 计算方式
      task_info: [
        {
          project_no: this.project_no,
          task_no: task_no,
          workload_qty: Number(this.getFormItem('workload_qty') ?? 0),
          workload_unit: this.getFormItem('workload_unit'), // 日期单位：1.小时；2.日；3.月
          plan_work_hours: Number(this.getFormItem('plan_work_hours') ?? 0),
          plan_start_date: this.getFormItem('plan_start_date'),
          plan_finish_date: this.getFormItem('plan_finish_date'),
        },
      ],
    };

    this.commonService
      .taskWorkCalendar(params)
      .pipe(debounceTime(1000))
      .subscribe(
        (res: any): void => {
          if (res && res.data && res.data.task_info && res.data.task_info.length > 0) {
            // （编辑，修改栏位）成功后 -- 改变 日期同值按钮 状态
            this.setIsDisable();

            // 预计工时
            const return_plan_work_hours = res.data.task_info[0].plan_work_hours;
            if (this.getFormItem('plan_work_hours') !== return_plan_work_hours) {
              this.setFormValue('plan_work_hours', return_plan_work_hours);
            }
            if (calculation_method === '1') {
              // 计划结束日期
              const return_plan_finish_date = res.data.task_info[0].plan_finish_date;
              const date = return_plan_finish_date
                ? moment(return_plan_finish_date).format('YYYY/MM/DD')
                : '';
              if (this.getFormItem('plan_finish_date') !== date) {
                this.setFormValue('plan_finish_date', date);
              }

              if (this.getFormItem('plan_finish_date')) {
                // 校验结束日期
                this.checkPromptForFinishDate(this.getFormItem('plan_finish_date'));
              }
            } else {
              // 工作量
              const return_workload_qty = res.data.task_info[0].workload_qty;
              // if (this.getFormItem('workload_qty') !== return_workload_qty) {
              this.isCallTaskWorkCalendar = false;
              this.setFormValue('workload_qty', return_workload_qty);
              // }

              // 工作单位
              const return_workload_unit = res.data.task_info[0].workload_unit;
              if (this.getFormItem('workload_unit') !== return_workload_unit) {
                this.setFormValue('workload_unit', return_workload_unit);
              }
            }
          }
          setTimeout(() => {
            this.setLoading.emit({ value: false });
          }, 80);
          this.changeRef.markForCheck();
        },
        (err) => {
          this.setLoading.emit({ value: false });
        }
      );
  }
}
