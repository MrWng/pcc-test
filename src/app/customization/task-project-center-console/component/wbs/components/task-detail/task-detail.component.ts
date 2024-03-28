import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, SkipSelf } from '@angular/core';
import { DynamicWbsService } from '../../wbs.service';
import { APIService } from '../../../../service/api.service';

import {
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
  DynamicTableModel,
  multiple,
} from '@ng-dynamic-forms/core';
import { TaskDetailService } from './task-detail.service';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/customization/task-project-center-console/service/common.service';
import * as moment from 'moment';
import { cloneDeep } from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { AthModalService } from 'ngx-ui-athena/src/components/modal';
import { ApprovalProgressComponent } from './components/approval-progress/approval-progress.component';
import { forkJoin, of } from 'rxjs';
import { PosumService } from '../../../add-subproject-card/services/posum.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.less'],
  providers: [TaskDetailService, PosumService],
})
export class TaskDetailComponent implements OnInit {

  state: string = '1';
  baseData: Array<any> = [];
  list: Array<any>;

  Unit = {
    '0': this.translateService.instant('dj-default-无'),
    '1': this.translateService.instant('dj-default-工时'),
    '2': this.translateService.instant('dj-default-重量'),
    '3': this.translateService.instant('dj-default-张数'),
    '4': this.translateService.instant('dj-default-数量'),
    '5': this.translateService.instant('dj-default-项数'),
  }

  tabList: Array<any> = [
    {
      label: 'dj-default-待处理n项',
      sum: 0,
      code: '1',
    },
    {
      label: 'dj-default-已完成n项',
      sum: 0,
      code: '2',
    },
  ];
  reviewTabList: Array<any> = [
    {
      label: 'dj-pcc-剩余资源检讨',
      code: '1',
      reportCode: 'remainResourceReviewQuery',
      isShow: false,
    },
    {
      label: 'dj-pcc-异常明细检讨',
      code: '2',
      reportCode: 'abnormalReviewReviewQuery',
      isShow: false,
    },
    {
      label: 'dj-pcc-进度检讨',
      code: '3',
      reportCode: 'scheduleReviewQuery',
      isShow: false,
    },
  ];


  isShowSpin: boolean = true;
  fullScreenStatus = false;

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];

  qianyeTenantId = []; // 乾冶租户id
  approvalInfo: any;
  taskId: any;
  waittingData = { isCalculated: false, data: [] };
  completedData = { isCalculated: false, data: [] };

  constructor(
    @SkipSelf()
    public wbsService: DynamicWbsService,
    private posumService: PosumService,
    public apiService: APIService,
    protected changeRef: ChangeDetectorRef,
    private formService: DynamicFormService,
    public taskDetailService: TaskDetailService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    protected translateService: TranslateService,
    private userService: DwUserService,
    private configService: DwSystemConfigService,
    public commonService: CommonService,
    private modalService: AthModalService,
  ) {
    this.configService.get('qianyeTenantId').subscribe((url: string) => {
      const id = url || '72007522,72007522_001';
      this.qianyeTenantId = id.split(',');
    });
  }

  ngOnInit() {
    this.getTaskId();
    this.loadData();
  }


  /**
   * 查询任务卡id
   */
  getTaskId(): void {
    if (!this.wbsService.taskDetail?.is_approve) {
      return;
    }
    const params = {
      eocId: {},
      tenantId: this.userService.getUser('tenantId'),
      bkInfo: [
        {
          entityName: 'task_d',
          bk: {
            project_no: this.wbsService.taskDetail.project_no,
            task_no: this.wbsService.taskDetail.task_no
          }
        }
      ],
      taskStates: [1, 2, 3, 4, 5],
      activityStates: [1, 2, 3, 4, 5, 6],
    };
    this.taskDetailService.getTaskId(params).subscribe((res: any) => {
      const taskInfo = res.data[0]?.subTasks[0]?.activities;
      taskInfo?.forEach(element => {
        if (['moh_DTD_AssignmentApproval2', 'manual_DTD_AssignmentApproval2'].includes(element.actTmpId)) {
          this.taskId = element.actId;
        }
      });
    });
  }


  async loadData(): Promise<any> {
    const taskDetail = cloneDeep(this.wbsService.taskDetail);
    if (taskDetail.children) {
      Reflect.deleteProperty(taskDetail, 'children');
    }
    this.taskDetailService.taskDetail = taskDetail;
    if (['ODAR'].includes(this.wbsService.taskDetail.task_category)) {
      taskDetail.receive_rate =
        this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData?.receive_rate ||
        0.8;
      taskDetail.instalment_stage = cloneDeep(taskDetail.ar_stage_no);
      Reflect.deleteProperty(taskDetail, 'ar_stage_no');
      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '2' })
      }).toPromise();
      this.baseData = waitting.concat(completed);
    } else if (['ORD', 'MO_H'].includes(this.wbsService.taskDetail.task_category)) {

      const apiName =
        ['ORD'].includes(this.wbsService.taskDetail.task_category)
          && this.qianyeTenantId.indexOf(this.userService.getUser('tenantId')) >= 0
          ? 'uc.task.info.get' : 'task.info.get';

      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.getTaskInfo({ taskDetail, process_status: '1', apiName }),
        completed: this.taskDetailService.getTaskInfo({ taskDetail, process_status: '2', apiName })
      }).toPromise();
      this.baseData = waitting.concat(completed);

    } else if (['PR', 'MOOP', 'PO', 'PO_KEY', 'OD', 'MO', 'MOMA',
      'EXPORT', 'SHIPMENT', 'POPUR'].includes(this.wbsService.taskDetail.task_category)) {
      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '2' })
      }).toPromise();
      this.baseData = waitting.concat(completed);
    } else if (['PLM'].includes(this.wbsService.taskDetail.task_category)) {
      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.work_Item_Data_Get({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.work_Item_Data_Get({ taskDetail, process_status: '2' })
      }).toPromise();
      this.baseData = waitting.concat(completed);
    } else if (['MES'].includes(this.wbsService.taskDetail.task_category)) {
      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.project_Wo_Production_Info_Process({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.project_Wo_Production_Info_Process({ taskDetail, process_status: '2' })
      }).toPromise();
      this.baseData = waitting.concat(completed);
    } else if (['PLM_PROJECT'].includes(this.wbsService.taskDetail.task_category)) {
      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.project_Task_complete_rate_data_Get({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.project_Task_complete_rate_data_Get({ taskDetail, process_status: '2' })
      }).toPromise();
      this.baseData = waitting.concat(completed);
    } else if (['REVIEW'].includes(this.wbsService.taskDetail.task_category)) {
      this.initReviewTabList();
      const { bpmData } = this.commonService.content?.executeContext?.taskWithBacklogData || {};
      const result = await this.getHasGroundEnd();
      const acceptanceOfOverdueDays = result?.acceptanceOfOverdueDays + '';
      bpmData.hasGroundEnd = result.hasGroundEnd;
      const {
        specialMaterialNum,
        materialNumSwitch,
        commonMaterialNum,
      } = this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData;
      const remainingPromise = bpmData?.hasGroundEnd === 'N' ? of([]) : this.taskDetailService.getRemainingResourceData({
        doc_info: [{
          ...taskDetail,
          special_material_times: specialMaterialNum,
          public_material_times: commonMaterialNum,
          enable_material_picking_count: materialNumSwitch
        }],
        eocMap: taskDetail.eoc_company_id
      });
      const abnormalPromise = this.taskDetailService.getAbnormalReviewInfo({
        doc_info: [{
          project_no: taskDetail.project_no,
          project_info: [{ project_no: taskDetail.project_no, task_no: taskDetail.task_no }]
        }],
        eocMap: taskDetail.eoc_company_id
      });
      const schedulePromise = this.taskDetailService.getScheduleReviewInfo({
        doc_info: [{
          calculation_method: acceptanceOfOverdueDays,
          ...taskDetail,
          project_info: [{ project_no: taskDetail.project_no }]
        }],
        eocMap: taskDetail.eoc_company_id
      });
      const { remaining, abnormal, schedule } = await forkJoin({
        remaining: remainingPromise,
        abnormal: abnormalPromise,
        schedule: schedulePromise
      }).toPromise();
      this.baseData = remaining?.length ? abnormal.concat(remaining).concat(schedule) : abnormal.concat(schedule);
    } else if (['PRSUM', 'POSUM'].includes(this.wbsService.taskDetail.task_category)) {
      if (
        (taskDetail.is_need_doc_no && taskDetail.doc_type_no && taskDetail.doc_no) ||
        !taskDetail.is_need_doc_no
      ) {
        const { waitting, completed } = await forkJoin({
          waitting: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '1' }),
          completed: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '2' })
        }).toPromise();
        this.baseData = waitting.concat(completed);
      } else {
        this.baseData = [];
      }
    } else if (['SFT'].includes(this.wbsService.taskDetail.task_category)) {
      taskDetail.wo_type_no = taskDetail.doc_type_no; // 单别
      taskDetail.wo_no = taskDetail.doc_no; // 单号
      taskDetail.op_no = taskDetail.seq; // 序号
      taskDetail.plan_complete_date = taskDetail.plan_finish_date;

      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.progress_data_get({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.progress_data_get({ taskDetail, process_status: '2' })
      }).toPromise();
      this.baseData = waitting.concat(completed);

    } else if (['APC', 'APC_O'].includes(this.wbsService.taskDetail.task_category)) {
      taskDetail.wo_type_no = taskDetail.doc_type_no; // 单别
      taskDetail.wo_no = taskDetail.doc_no; // 单号
      if ('APC_O' === this.wbsService.taskDetail.task_category) {
        taskDetail.op_no = taskDetail.seq; // 序号
      }
      if ('APC' === this.wbsService.taskDetail.task_category) {
        delete taskDetail.seq;
      }
      taskDetail.plan_complete_date = taskDetail.plan_finish_date;

      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.project_Doc_Data_Get({ taskDetail, process_status: '2' })
      }).toPromise();
      this.baseData = waitting.concat(completed);
    }
    this.buildPageInfo();
    this.buildListData();
    this.isShowSpin = false;
    this.changeRef.markForCheck();
  }


  // 设置MOOP类型的表格数据是否展示
  setMoopTableStatus() {
    if (!['MOOP'].includes(this.wbsService.taskDetail.task_category)) {
      return false;
    }
    const { is_need_doc_no, doc_type_no, doc_no, seq } = this.wbsService.taskDetail;
    if (!is_need_doc_no) {
      this.changeRef.markForCheck();
      return false;
    } else if (is_need_doc_no && doc_type_no && doc_no && seq) {
      this.changeRef.markForCheck();
      return false;
    } else if ((is_need_doc_no && !doc_type_no) || !doc_no || !seq) {
      // 不展示表格
      this.dynamicGroup = undefined;
      this.tabList.forEach((o) => {
        o.sum = 0;
      });
    }
    this.changeRef.markForCheck();
  }

  /**
   * 待处理和已完成数量
   */
  buildPageInfo(): void {
    this.baseData.forEach((o, i) => {
      this.statisticsSum(o);
      this.specialHandel(o, i);
    });
  }

  /**
   * 统计待处理和已完成的总数量
   * @param o
   */
  statisticsSum(o): void {
    if (o.process_status === '1') {
      this.tabList[0].sum++;
    } else {
      this.tabList[1].sum++;
    }
  }

  /**
 * 针对某些任务类型,数据做特殊处理
 * @param o
 * @param i
 * @returns
 */
  specialHandel(o: any, i: number): void {
    // 任务完成率处理
    o.complete_rate = o.complete_rate <= 1 ? o.complete_rate * 100 : o.complete_rate;
    if (!['POSUM', 'PRSUM'].includes(this.wbsService.taskDetail.task_category)) {
      o.complete_rate = String(o.complete_rate).length > 4 ? Number(o.complete_rate).toFixed(2) : Number(o.complete_rate);
      o.complete_rate = o.complete_rate + '%';
    }
    o.out_plan_time = o.out_plan_time === 'Y' ? '*' : '';
  }

  initTemplateJson(category: string, data: Array<any>): void {
    const result = this.taskDetailService.setTemplateJson(
      category,
      data,
      this.state,
      this.commonService.content?.executeContext
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
    this.setMoopTableStatus();
    this.changeRef.markForCheck();
  }


  /**
   * 初始化reviewTabList
   */
  initReviewTabList(): void {
    this.taskDetailService
      .getReportslist()
      .subscribe((resData: any): void => {
        const { bpmData } = this.commonService.content?.executeContext?.taskWithBacklogData || {};
        const list = resData?.data.map((resDataItem): void => {
          return resDataItem.reportCode;
        });
        this.reviewTabList.forEach((reviewTabListItem: any): any => {
          reviewTabListItem.isShow = list.includes(reviewTabListItem.reportCode) ? true : false;
          if (bpmData?.hasGroundEnd === 'N' && reviewTabListItem.code === '1') {
            reviewTabListItem.isShow = false;
          }
        });
      });
  }

  /**
   * 是否依赖地端
   * hasGroundEnd:是否依赖地端
   */
  getHasGroundEnd(): Promise<any> {
    return this.commonService.isDependsGround().toPromise().then(res => res.data);
  }

  buildListData(): void {
    if ('MOMA' === this.wbsService.taskDetail.task_category) {
      this.list = this.baseData.filter((o) => o.process_status === this.state);
      let str = '';
      this.list.forEach((item, index) => {
        const temp = item.status + item.production_control_name + item.wo_no + item.production_item_no
          + item.production_item_spec + item.wo_production_qty + item.plan_date_e;
        if ((index > 0) && (temp === str)) {
          item.status = item.production_control_name = item.wo_no = item.production_item_no
            = item.production_item_spec = item.wo_production_qty = item.plan_date_e = '';
        } else {
          str = temp;
        }

        if ((typeof item.complete_rate === 'string' && !item.complete_rate.includes('%') && item.complete_rate !== '__')
          || typeof item.complete_rate === 'number') {
          item.complete_rate = Number(item.complete_rate) ? Number(item.complete_rate) : 0;
          if (item.complete_rate === -1) {
            item.complete_rate = '';
          } else if (item.complete_rate <= 100) {
            item.complete_rate = `${multiple(item.complete_rate.toFixed(4), 1)}%`;
          }
          item.out_plan_time === 'Y' ? (item.out_plan_time = '*') : (item.out_plan_time = '');
        }
      });
    } else {
      if ('REVIEW' === this.wbsService.taskDetail.task_category) {
        this.baseData.forEach((item, index) => {
          switch (item.abnormal_type) {
            case '1': { item.abnormal_type = this.translateService.instant('dj-default-怠工未回报'); break; }
            case '2': { item.abnormal_type = this.translateService.instant('dj-default-逾期完成'); break; }
            case '3': { item.abnormal_type = this.translateService.instant('dj-default-时程异常调整'); break; }
            case '4': { item.abnormal_type = this.translateService.instant('dj-default-资源配置调整'); break; }
            default: { break; }
          }
        });
        this.list = this.baseData.filter((o) => o.process_status === this.state);
      }
      if ('REVIEW' !== this.wbsService.taskDetail.task_category) {
        const handelData = this.state === '1' ? this.waittingData : this.completedData;
        this.list = handelData.data;
        if (!handelData.isCalculated) {
          this.list = this.baseData.filter((o) => o.process_status === this.state);
          handelData.isCalculated = true;
          this.setHandelData(handelData);
        }
      }
    }
    this.initTemplateJson(this.wbsService.taskDetail.task_category, this.list);
  }

  /**
   * 处理数据
   */
  setHandelData(handelData): void {
    switch (this.wbsService.taskDetail.task_category) {
      case 'POPUR':
        this.posumService.handelPopurPosumAndData(this.list, handelData, this.getPopurKey, 'POPUR');
        this.list = handelData.data;
        break;
      case 'POSUM':
        this.posumService.handelPopurPosumAndData(this.list, handelData, this.getPosumKey, 'POSUM');
        this.list = handelData.data;
        break;
      case 'PRSUM':
        this.posumService.handelPopurPosumAndData(this.list, handelData, this.getPrsumKey, 'PRSUM');
        this.list = handelData.data;
        break;
      case 'MOOP':
      case 'SFT':
      case 'APC':
        this.posumService.handelPopurPosumAndData(this.list, handelData, this.getMoopSftApcKey, 'MOOP-SFT-APC');
        this.list = handelData.data;
        break;
      default:
        handelData.data = this.list;
        break;
    }
  }

  getPopurKey(obj: any) {
    return obj.close_status + obj.purchaser_name + obj.purchase_no +
      obj.purchase_seq + obj.purchase_sub_seq + obj.item_no + obj.item_name_spec + obj.purchase_qty + obj.complete_rate;
  }

  getPosumKey(obj: any) {
    return obj.reference_type_no + obj.reference_doc_no + obj.item_name_spec + obj.item_spec;
  }

  getPrsumKey(obj: any) {
    return obj.reference_type_no + obj.reference_doc_no + obj.item_name_spec + obj.item_spec;
  }

  getMoopSftApcKey(obj: any) {
    return obj.wo_no;
  }

  // 判断source和target里相同字段是否都相等
  judgeEqual(source, target) {
    const flag = [];
    Object.keys(source).forEach((key) => {
      if (source[key] === target[key.substring(4)]) {
        flag.push(true);
      }
    });
    return flag.length === Object.keys(source).length;
  }
  // 重置指定字段
  resetWord(source, target) {
    Object.keys(source).forEach((key) => {
      target[key.substring(4)] = '__';
    });
  }
  // 记录第一行不重复的值
  recordFirstLine(source, target) {
    Object.keys(source).forEach((key) => {
      source[key] = target[key.substring(4)];
    });
  }

  changeTab(state: string): void {
    this.state = state;
    this.buildListData();
    this.changeRef.markForCheck();
  }

  clickContent(ev: any): void {
    ev.stopPropagation();
  }

  toFullScreen(): void {
    this.fullScreenStatus = !this.fullScreenStatus;
    this.changeRef.markForCheck();
  }

  checkData(list, list1, nameList) {
    let isSome = true;
    nameList.forEach((element) => {
      if (list[element] !== list1[element]) {
        isSome = false;
      }
    });
    return isSome;
  }
  translatePccWord(val: string): String {
    return this.translateService.instant(`dj - pcc - ${val} `);
  }
  translateWord(val: string): String {
    return this.translateService.instant(`dj -default -${val} `);
  }

  openWindow(): void {
    this.modalService.create({
      nzTitle: null,
      nzFooter: null,
      nzContent: ApprovalProgressComponent,
      nzOkText: null,
      nzCancelText: null,
      nzComponentParams: {
        taskOrProjectId: this.taskId,
      },
      nzWidth: 550,
      nzClassName: 'signOffProgress-modal-center-sty',
      nzNoAnimation: true,
      nzClosable: true,
      nzOnOk: (): void => { },
    });
  }
}
