import { ThrowStmt } from '@angular/compiler';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { cloneDeep } from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { Entry } from 'app/customization/task-project-center-console/service/common.service';
import { DynamicCustomizedService } from 'app/customization/task-project-center-console/service/dynamic-customized.service';
import * as moment from 'moment';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTreeNode } from 'ng-zorro-antd/tree';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { AddSubProjectCardService } from '../../add-subproject-card.service';
// import { LiablePersonService } from '../../services/liable-person.service';
// import { LiablePersonAddRoleService } from '../../services/liable-person-add-role.service';
import { TaskTemplateService } from '../../services/task-template.service';
import { WorkLoadService } from '../../services/work-load.service';
import { CommonService } from '../../../../service/common.service';
import { AthMessageService } from 'ngx-ui-athena/src/components/message';

@Component({
  selector: 'app-work-load',
  templateUrl: './work-load.component.html',
  styleUrls: ['./work-load.component.less']
})
export class WorkLoadComponent implements OnInit {

  @Input() validateForm: FormGroup = this.fb.group({
    /** 工期 */
    workload_qty: [null],
    /** 工期单位	1.小时 2.日 3.月 */
    workload_unit: ['2'],
    /** 预计工时 */
    plan_work_hours: [null],

  });

  @Input() source: any
  /** 隐藏的执行人列表 */
  @Input() task_member_infoList = [];

  @Input() projectInfo: any

  @Input() designStatus: string = '';
  @Input() project_no: string = '';

  /** 更新wbs界面任务卡列表 */
  @Output() onUpdateWbsTasks = new EventEmitter()

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
  /** 结束日期提示信息 */
  endNotice = '';
  endNoticeForEarly = '';
  /** 是否完成结束日期反推天数 */
  isHasRerverse: boolean = false;
  /** 一级任务卡信息 */
  parentTime: any;

  plan_finish_date: string = null;
  private workloadQtyChange$ = new Subject<number>();
  maxWorkloadQty: number
  isDisable: boolean = false

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private messageService: NzMessageService,
    private translateService: TranslateService,
    private taskTemplateService: TaskTemplateService,
    private dynamicCustomizedService: DynamicCustomizedService,
    private fb: FormBuilder,
    // private liablePersonService: LiablePersonService,
    private workLoadService: WorkLoadService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
  ) { }

  ngOnInit(): void {
    this.monitorWorkloadQtyChange();
  }

  /**
* 不禁用状态
*/
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  /**
  * 修改工期
  * @param workload_qty 工期
  * @returns
  */
  workloadQtyChange(workload_qty: number): void {
    this.workloadQtyChange$.next(workload_qty);
  }

  /**
   * 监听工期值改变:
   * 1: 工期改变,设置预计工时,
   * 2: 如果有开始时间和工期,设置结束时间
   */
  monitorWorkloadQtyChange(): void {
    this.workloadQtyChange$.pipe(debounceTime(500)).subscribe(workload_qty => {
      if (this.isHasRerverse || isNaN(workload_qty) || !this.addSubProjectCardService.validateForm.get('workload_qty').dirty) {
        return;
      }
      if (workload_qty < 0) {
        this.messageService.error(
          this.translateService.instant(`dj-default-工期不可以为负数，请调整工期！`)
        );
        this.addSubProjectCardService.validateForm.get('plan_work_hours').patchValue(null);
        this.changeRef.markForCheck();
        return;
      }
      const workHours = workload_qty ? workload_qty : 0;
      this.setPlanWorkHours(workHours);
      const start_time = this.getFormItem('plan_start_date').value;
      if (this.getFormItem('workload_qty').dirty && start_time) {
        this.setPlanFinishDateFromWorkloadQty(workload_qty);
      }
      this.changeRef.markForCheck();
    });
  }
  /**
   *  工期改变, 如果开始时间和工期有值,设置结束时间并校验结束日期
   * @param workload_qty
   * @returns
   */
  setPlanFinishDateFromWorkloadQty(workload_qty: number): void {
    workload_qty = Number(workload_qty);
    if (isNaN(workload_qty) || Number(workload_qty) <= 0) {
      return;
    }
    const { workload_unit, plan_start_date } = this.addSubProjectCardService.validateForm.getRawValue();
    const plan_finish_date = this.workLoadService.calculatePlanFinishDate(workload_unit, workload_qty, plan_start_date);
    const date = plan_finish_date ? moment(plan_finish_date).format('YYYY/MM/DD') : '';
    this.getFormItem('plan_finish_date').patchValue(date);
    this.setIsDisable(false);
    this.checkPlanFinishDate(plan_finish_date);
  }

  /**
   * 校验结束日期
   */
  checkPlanFinishDate(plan_finish_date: any): void {
    if (moment(plan_finish_date).format('YYYY-MM-DD') >
      moment(this.addSubProjectCardService.firstLevelTaskCard?.plan_finish_date).format('YYYY-MM-DD')
      && this.source === Entry.collaborate) {
      this.messageService.error(this.translateService.instant(`dj-default-任务结束日期不可大于一级计划的结束日期，请核查！`));
    } else {
      this.getEndTimeNotice(plan_finish_date);
    }
  }

  /**
   * 设置预计工时
   * @param workload_qty 工期
   */
  setPlanWorkHours(workload_qty: number): void {
    workload_qty = Number(workload_qty);
    const workload_unit = this.getFormItem('workload_unit').value;
    const plan_work_hours = this.workLoadService.calculatePlanWorkHours(workload_unit, workload_qty);
    this.getFormItem('plan_work_hours').patchValue(plan_work_hours);
  }

  /**
   * 结束日期变更
   * @param $event
   * @returns
   */
  endTimeChange(end_time: any): void {
    this.setIsDisable(false);
    if (!moment(end_time).isValid()) {
      if (!end_time) {
        this.getFormItem('plan_finish_date').patchValue('');
      }
      return;
    }
    this.getFormItem('plan_finish_date').patchValue(moment(end_time).format('YYYY/MM/DD'));
    if (this.source === Entry.collaborate && moment(end_time).format('YYYY-MM-DD')
      > moment(this.addSubProjectCardService?.firstLevelTaskCard?.plan_finish_date).format('YYYY-MM-DD')
    ) {
      this.messageService.error(this.translateService.instant(`dj-default-任务结束日期不可大于一级计划的结束日期，请核查！`));
    } else {
      this.getEndTimeNotice(end_time);
    }
    this.setEndTimeAndWorkloadUnit(end_time);
  }

  /**
   *  结束时间提示消息
   * @param end_time 结束时间
   */
  getEndTimeNotice(end_time: any): void {
    const showTime = moment(end_time).format('YYYY-MM-DD');
    this.endNotice = '';
    this.endNoticeForEarly = '';

    if (end_time) {
      const endTime = moment(end_time).format('YYYY-MM-DD');
      const paras = {
        query_condition: 'M1',
        task_info: [{
          project_no: this.project_no,
          upper_level_task_no: this.getFormItem('task_no').value,
          task_property: this.source === Entry.maintain ? '2' : '1'
        }],
        search_info: [{
          order: 1,
          search_field: 'plan_finish_date',
          search_operator: 'greater',
          search_value: [endTime],
          logic: 'and'
        }, {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [this.getFormItem('task_no').value]
        }]
      };
      this.commonService.getInvData('bm.pisc.task.get', paras)
        .subscribe((res: any): void => {
          if (res && res.data && res.data.task_info && (res.data.task_info.length > 0)) {
            this.endNoticeForEarly = this.translateService.instant(`dj-pcc-预计结束日已早于下阶任务的最大预计结束日！`);
          } else {
            this.endNoticeForEarly = '';
          }
          this.changeRef.markForCheck();
        }, (err) => { });
    }


    if (
      [Entry.card, Entry.collaborate].includes(this.source) &&
      moment(end_time).format('YYYY-MM-DD') >
      moment(this.projectInfo?.plan_finish_date).format('YYYY-MM-DD')
    ) {
      this.messageService.error(this.translateService.instant(`dj-default-任务结束日期不可超过项目结束日期,请核查！`));
    }
    const { firstLevelTaskCard, buttonType } = this.addSubProjectCardService;
    const entryCondition = this.source === Entry.maintain || this.source === Entry.card;
    const editCondition = firstLevelTaskCard?.children?.length && buttonType === 'EDIT';
    const addCondition = firstLevelTaskCard?.task_no && buttonType !== 'EDIT';
    const taskNoCondition = this.getFormItem('task_no').value !== firstLevelTaskCard?.task_no;
    const endNoticeCondition = (editCondition || addCondition) && taskNoCondition;
    if (showTime && entryCondition && endNoticeCondition) {
      this.getParentTime(this.addSubProjectCardService.firstLevelTaskCard);
      const { plan_start_date, plan_finish_date } = this.parentTime ?? {};
      if (plan_start_date && moment(showTime).format('YYYY-MM-DD') < moment(plan_start_date).format('YYYY-MM-DD')) {
        this.endNotice = this.translateService.instant(`dj-pcc-预计完成日早于上阶任务预计开始日`);
      } else if (
        plan_finish_date &&
        moment(showTime).format('YYYY-MM-DD') > moment(this.parentTime.plan_finish_date).format('YYYY-MM-DD')) {
        this.endNotice = this.translateService.instant(`dj-pcc-预计完成日晚于上阶任务预计完成日`);
      } else {
        this.endNotice = '';
      }
    }
  }

  /**
 * 设置工期单位和预计工时
 * @param end_time 结束日期
 * @returns
 */
  setEndTimeAndWorkloadUnit(end_time): void {
    const changeQty = moment(end_time).format('YYYY-MM-DD') > moment(this.projectInfo?.plan_finish_date).format('YYYY-MM-DD');
    if (!this.isHasRerverse && !changeQty) {
      return;
    }
    const startTime = moment(this.getFormItem('plan_start_date').value).format('YYYY-MM-DD');
    const endTime = moment(this.getFormItem('plan_finish_date').value).format('YYYY-MM-DD');
    this.addSubProjectCardService.validateForm.get('workload_unit').patchValue('2');
    if (end_time && this.addSubProjectCardService.validateForm.getRawValue().plan_start_date) {
      this.changeWorkloadQtyAndPlanWorkHours(startTime, endTime);
    }
  }


  /**
   * 改变工期和预计工时
   * @param startTime
   * @param endTime
   */
  changeWorkloadQtyAndPlanWorkHours(startTime, endTime): void {
    const start = moment(startTime);
    const end = moment(endTime);
    const day = end.diff(start, 'day');
    this.addSubProjectCardService.validateForm.get('plan_work_hours').patchValue((day + 1) * 8);
    this.addSubProjectCardService.validateForm.get('workload_qty').patchValue(day + 1);
  }

  /**
   * 修改工期单位
   * 修改工期单位，修改预计工时
   * 如果有开始时间，设置结束时间
   * @returns
   */
  workloadUnitChange(): void {
    const workload_unit = this.getFormItem('workload_unit');
    if (!workload_unit.dirty || this.isHasRerverse) {
      return;
    }
    this.setPlanWorkHours(this.getFormItem('workload_qty').value);
    const start_time = this.getFormItem('plan_start_date').value;
    if (workload_unit.dirty && start_time) {
      this.setPlanFinishDateFromWorkloadUnit();
    }
    this.changeRef.markForCheck();
  }

  /**
   * 修改工期单位，如果有开始时间，设置结束时间
   * @returns
   */
  setPlanFinishDateFromWorkloadUnit() {
    const workload_qty = Number(this.getFormItem('workload_qty').value);
    if (isNaN(workload_qty) || workload_qty <= 0) {
      return;
    }
    const { workload_unit, plan_start_date } = this.addSubProjectCardService.validateForm.getRawValue();
    const plan_finish_date = this.workLoadService.calculatePlanFinishDate(workload_unit, workload_qty, plan_start_date);
    const date = plan_finish_date ? moment(plan_finish_date).format('YYYY/MM/DD') : '';
    this.getFormItem('plan_finish_date').patchValue(date);
    this.checkPlanFinishDate(plan_finish_date);
  }

  rerverseClick(): void {
    this.isHasRerverse = false;
  }


  /**
 * 结束时间
 */
  endTimeClick(): void {
    this.isHasRerverse = true;
  }

  /**
 * 修改开始时间
 * @param start_time
 * @returns
 */
  startTimeChange(start_time: any): void {
    this.setIsDisable(false);
    if (this.isHasRerverse || !moment(start_time).isValid()) {
      if (!start_time) {
        this.getFormItem('plan_start_date').patchValue('');
      }
      return;
    }

    const plan_start_date = start_time ? moment(start_time).format('YYYY/MM/DD') : '';
    this.getFormItem('plan_start_date').patchValue(plan_start_date);
    this.getStartTimeNotice(start_time);
    if (this.projectInfo?.plan_finish_date) {
      this.setMaxWorkloadQty(start_time, this.projectInfo?.plan_finish_date);
    }
    this.setTime(start_time);
  }

  /**
   *  预计开始时间提示消息
   * @param start_time 预计开始时间
   */
  getStartTimeNotice(start_time: any): void {
    this.startNotice = '';
    this.startNoticeForlate = '';
    this.collaborateEntry(start_time);
    this.cardAndMaintainEntry(start_time);
  }

  /**
 * 设置结束日期、工期和预计工时
 * 如果workload_qty > 0 则推算结束时间
 * 如果workload_qty <= 0 ,并且有结束时间，则推算出工期
 */
  setTime(start_time: any): void {
    if (!start_time) {
      return;
    }
    const { workload_qty, plan_start_date, plan_finish_date } = this.addSubProjectCardService.validateForm.getRawValue();
    if (workload_qty > 0) {
      this.setPlanFinishDateFromStartTime();
    } else if (plan_finish_date) {
      this.setWorkQtyAndHours(moment(plan_start_date).format('YYYY-MM-DD'), moment(plan_finish_date).format('YYYY-MM-DD'));
    }
  }

  setMaxWorkloadQty(startTime, endTime): void {
    const start = moment(startTime);
    const end = moment(endTime);
    const day = end.diff(start, 'day');
    this.maxWorkloadQty = day + 1;
  }

  /**
   * 设置结束时间和提示消息
   */
  setPlanFinishDateFromStartTime(): void {
    const { workload_qty, workload_unit, plan_start_date } = this.addSubProjectCardService.validateForm.getRawValue();
    const plan_finish_date = this.workLoadService.calculatePlanFinishDate(workload_unit, workload_qty, plan_start_date);
    const date = plan_finish_date ? moment(plan_finish_date).format('YYYY/MM/DD') : '';
    this.getFormItem('plan_finish_date').patchValue(date);
    this.checkPlanFinishDate(plan_finish_date);
  }


  /**
   * 设置工期和工时
   * @param startTime
   * @param endTime
   */
  setWorkQtyAndHours(startTime, endTime): void {
    let day = moment(endTime).diff(moment(startTime), 'day');
    day = day > 0 ? day : 0;
    this.addSubProjectCardService.validateForm.get('plan_work_hours').patchValue((day + 1) * 8);
    this.addSubProjectCardService.validateForm.get('workload_qty').patchValue(day + 1);
  }

  /**
   * 日期同值
   * @param type personnel:人员同值 date：日期同值
   * @returns
   */
  setSameValue(type, event) {
    if (event.target.className.includes('dis-btn-event') || event.target.className.includes('dis-btn')) {
      return;
    }
    this.setIsDisable(true);
    const project_no = this.projectInfo.project_no ? this.projectInfo.project_no : this.projectInfo.project_template_no;
    this.workLoadService.setSameValue(project_no, this.source)
      .pipe(debounceTime(1000))
      .subscribe(res => {
        if (!res) {
          this.setIsDisable(false);
          return;
        }
        const info = this.translateService.instant('dj-default-更新成功');
        this.athMessageService.success(info);

        res && (this.onUpdateWbsTasks.emit(this.addSubProjectCardService.currentCardInfo));
      }, er => {
        console.log('setSameValue----err');
        this.setIsDisable(true);
      });
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
    if (this.projectInfo?.plan_finish_date && ([Entry.collaborate, Entry.card].includes(this.source))) {
      return (
        moment(startValue).format('YYYY-MM-DD') >
        moment(this.projectInfo?.plan_finish_date).format('YYYY-MM-DD')
      );
    } else {
      return false;
    }
  }

  /**
   * 结束时间是否可选
   * @param endValue
   * @returns
   */
  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue) {
      return false;
    }
    if (this.source === Entry.card || this.source === Entry.collaborate) {
      if (!this.addSubProjectCardService.validateForm.getRawValue().plan_start_date) {
        return (
          moment(this.projectInfo?.plan_finish_date).format('YYYY-MM-DD') <
          moment(endValue).format('YYYY-MM-DD')
        );
      } else {
        return (
          moment(endValue).format('YYYY-MM-DD') <
          moment(this.addSubProjectCardService.validateForm.getRawValue().plan_start_date).format(
            'YYYY-MM-DD'
          ) ||
          moment(this.projectInfo?.plan_finish_date).format('YYYY-MM-DD') <
          moment(endValue).format('YYYY-MM-DD')
        );
      }
    } else {
      if (this.addSubProjectCardService.validateForm.getRawValue().plan_start_date) {
        return (
          moment(endValue).format('YYYY-MM-DD') <
          moment(this.addSubProjectCardService.validateForm.getRawValue().plan_start_date).format(
            'YYYY-MM-DD'
          )
        );
      } else {
        return false;
      }
    }
  }

  /**
   * 协同任务卡入口时
   * @param start_time 预计开始时间
   * @returns
   */
  collaborateEntry(start_time: string): void {
    if (this.source !== Entry.collaborate || !start_time) {
      return;
    }
    if (
      moment(start_time).format('YYYY-MM-DD') <
      moment(this.addSubProjectCardService.firstLevelTaskCard?.plan_start_date).format(
        'YYYY-MM-DD'
      )) {
      this.messageService.error(this.translateService.instant(`dj-default-任务开始日期不可小于一级计划的开始日期，请核查！`));
    }
    if (
      moment(start_time).format('YYYY-MM-DD') >
      moment(this.addSubProjectCardService.firstLevelTaskCard?.plan_finish_date).format(
        'YYYY-MM-DD'
      )) {
      this.messageService.error(this.translateService.instant(`dj-default-任务开始日期不可大于一级计划的结束日期，请核查！`));
    }
  }

  /**
  * 项目卡和基础资料维护入口时
  * @param start_time 预计开始时间
  * @returns
  */
  cardAndMaintainEntry(start_time: string): void {
    if (start_time) {
      const startTime = moment(start_time).format('YYYY-MM-DD');
      const paras = {
        query_condition: 'M1',
        task_info: [{
          project_no: this.project_no,
          upper_level_task_no: this.getFormItem('task_no').value,
          task_property: this.source === Entry.maintain ? '2' : '1'
        }],
        search_info: [{
          order: 1,
          search_field: 'plan_start_date',
          search_operator: 'less',
          search_value: [startTime],
          logic: 'and'
        }, {
          order: 2,
          search_field: 'task_no',
          search_operator: 'not_equal',
          search_value: [this.getFormItem('task_no').value]
        }]
      };
      this.commonService.getInvData('bm.pisc.task.get', paras)
        .subscribe((res: any): void => {
          if (res && res.data && res.data.task_info && (res.data.task_info.length > 0)) {
            this.startNoticeForlate = this.translateService.instant(`dj-pcc-预计开始日已晚于下阶任务的最小预计开始日！`);
          } else {
            this.startNoticeForlate = '';
          }
          this.changeRef.markForCheck();
        }, (err) => { });
    }
    if (this.source !== Entry.card && this.source !== Entry.maintain) {
      return;
    }
    if (!start_time) {
      return;
    }
    const { firstLevelTaskCard, buttonType } = this.addSubProjectCardService;
    if (
      ((firstLevelTaskCard?.children?.length && buttonType === 'EDIT')
        || (firstLevelTaskCard?.task_no && buttonType !== 'EDIT'))
      && this.getFormItem('task_no').value !== firstLevelTaskCard?.task_no
    ) {
      // 获取卡一级的内容
      this.getParentTime(firstLevelTaskCard);
      if (
        this.parentTime?.plan_start_date &&
        moment(start_time).format('YYYY-MM-DD') < moment(this.parentTime.plan_start_date).format('YYYY-MM-DD')) {
        this.startNotice = this.translateService.instant(`dj-pcc-预计开始日早于上阶任务预计开始日`);
      } else if (this.parentTime?.plan_finish_date &&
        moment(start_time).format('YYYY-MM-DD') > moment(this.parentTime.plan_finish_date).format('YYYY-MM-DD')) {
        this.startNotice = this.translateService.instant(`dj-pcc-预计开始日晚于上阶任务预计完成日`);
      } else {
        this.startNotice = '';
      }
      this.changeRef.markForCheck();
    }
  }

  /**
   * 获取一级任务卡信息
   * @param data
   */
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


  getFormItem(key: string): any {
    return this.addSubProjectCardService.validateForm.get(key);
  }

  setFormValue(key: string, value: any): any {
    this.addSubProjectCardService.validateForm.get(key).patchValue(value);
  }


  /**
   * 控制日期同值的显示和隐藏
   * @param value 是否禁用
   */
  setIsDisable(value: boolean): void {
    this.isDisable = value;
  }

}
