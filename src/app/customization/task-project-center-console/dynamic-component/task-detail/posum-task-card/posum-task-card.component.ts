import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import { cloneDeep, DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicFormLayoutService, DynamicFormService, DynamicFormValidationService, DynamicTableModel, multiple, } from '@ng-dynamic-forms/core';
import { DynamicPosumTaskCardModel } from '../../../model/posum-task-card/posum-task-card.model';
import { PosumTaskCardService } from './posum-task-card.service';
import { CommonService } from '../../../service/common.service';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework';
import { APIService } from 'app/customization/task-project-center-console/service/api.service';
import { PosumService } from 'app/customization/task-project-center-console/component/add-subproject-card/services/posum.service';
import { WbsTabsService } from 'app/customization/task-project-center-console/component/wbs-tabs/wbs-tabs.service';

@Component({
  selector: 'app-posum-task-card',
  templateUrl: './posum-task-card.component.html',
  styleUrls: ['./posum-task-card.component.less'],
  providers: [PosumTaskCardService, PosumService, WbsTabsService],
})
export class PosumTaskCardComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPosumTaskCardModel;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  project_no: any;
  isShowSpin: boolean = true;
  state: string = '1';
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
  baseData: any = [];
  taskInfo: any;
  list: any;
  pageData: any;
  showBtn = false;
  activeBtn = false;
  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];
  public isMaxTable: boolean = false;
  waittingData = { isCalculated: false, data: [] };
  completedData = { isCalculated: false, data: [] };
  isNeedMerge: boolean = true

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    private formService: DynamicFormService,
    protected elementRef: ElementRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public fb: FormBuilder,
    public apiService: APIService,
    private userService: DwUserService,
    private posumTaskCardService: PosumTaskCardService,
    private posumService: PosumService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.commonService.content = this.model.content;
    this.project_no = this.model?.content?.executeContext?.taskWithBacklogData.bpmData.project_info[0].project_no;
    this.getTaskInfo();
  }

  /**
   * 重置数据
   */
  resetData() {
    // loding
    this.isShowSpin = true;
    // 是否显示提交按钮
    this.showBtn = false;
    // 是否禁用提交按钮
    this.activeBtn = false;
    // 清空数据
    this.baseData = [];
    this.tabList[0].sum = 0;
    this.tabList[1].sum = 0;
  }

  /**
   * 获取任务资料
   */
  async getTaskInfo(): Promise<any> {
    // 是否需要合并单云格
    this.isNeedMerge = true;
    this.resetData();
    const task_no = this.model?.content?.executeContext?.taskWithBacklogData?.bpmData?.project_info[0].task_no;
    this.taskInfo = await this.posumTaskCardService.getTaskInfo(this.project_no, task_no);
    if (this.taskInfo?.task_category === 'MOOP') {
      this.MoopTaskType(this.taskInfo);
      return;
    } else {
      this.posumPopurTaskType();
      this.changeRef.markForCheck();
    }
  }

  posumPopurTaskType() {
    if (!this.taskInfo.is_need_doc_no || (this.taskInfo.is_need_doc_no && this.taskInfo.doc_type_no && this.taskInfo.doc_no)) {
      this.getDocData(this.taskInfo, false);
    } else {
      this.isNeedMerge = false;
      this.isShowSpin = false;
      this.showBtn = true;
      const arr = {
        doc_type_no: this.taskInfo.doc_type_no ? this.taskInfo.doc_type_no : '',
        doc_no: this.taskInfo.doc_no ? this.taskInfo.doc_no : '',
        item_type_name: this.taskInfo.item_type_name,
        complete_rate: this.taskInfo.complete_rate,
        process_status: '1',
      };
      this.baseData.push(arr);
      this.buildPageInfo();
      this.buildListData();
      this.changeRef.markForCheck();
    }
  }


  MoopTaskType(taskInfo) {
    // 任务类型为MOOP(工单工艺)
    this.model.is_need_doc_no = taskInfo.is_need_doc_no;
    if (!taskInfo.is_need_doc_no || (taskInfo.is_need_doc_no && taskInfo.doc_type_no && taskInfo.doc_no && taskInfo.seq)) {
      this.getDocData(taskInfo, true);
    } else {
      const arr = {
        doc_type_no: taskInfo?.doc_type_no ? taskInfo.doc_type_no : '',
        doc_no: taskInfo?.doc_no ? taskInfo.doc_no : '',
        seq: taskInfo?.seq ? taskInfo.seq : '',
        item_type_name: taskInfo.item_type_name,
        complete_rate: taskInfo.complete_rate,
        process_status: '1',
      };
      this.baseData.push(arr);
      this.isShowSpin = false;
      this.showBtn = true;
      this.buildPageInfo();
      this.buildListData();
      this.changeRef.markForCheck();
    }
  }



  async getDocData(info, isMaxTable: boolean): Promise<any> {
    this.showBtn = false;
    const [waitting, completed] = await Promise.all([
      this.apiService.project_Doc_Data_Get(
        [
          {
            ...info,
            process_status: '1',
          },
        ],
        info.eoc_company_id
      ),
      this.apiService.project_Doc_Data_Get(
        [
          {
            ...info,
            process_status: '2',
          },
        ],
        info.eoc_company_id
      ),
    ]);
    waitting.forEach((o) => {
      o.process_status = '1';
    });
    completed.forEach((o) => {
      o.process_status = '2';
    });
    this.baseData = waitting.concat(completed);
    this.buildPageInfo();
    this.buildListData();
    this.isShowSpin = false;
    this.isMaxTable = isMaxTable;
    this.changeRef.markForCheck();
  }

  buildPageInfo(): void {
    this.baseData.forEach((o) => {
      if (o.process_status === '1') {
        this.tabList[0].sum++;
      } else {
        this.tabList[1].sum++;
      }
      if (['PRSUM', 'POSUM'].includes(this.taskInfo.task_category)) {
        o.complete_rate = o.complete_rate <= 1 ? o.complete_rate * 100 : o.complete_rate;
      }
    });
  }

  buildListData(): void {
    const allData = cloneDeep(this.baseData);
    this.list = allData.filter((o) => o.process_status === this.state);
    if (['MOOP'].includes(this.taskInfo.task_category)) {
      const names = [
        'reference_type_no',
        'reference_doc_no',
        'item_name_spec',
        'item_spec',
        'item_classification',
        'seq',
        'complete_rate',
      ];
      const baseData = cloneDeep(this.list);
      for (let i = 0; i < baseData.length; i++) {
        if (i > 0) {
          if (this.checkData(baseData[i], baseData[i - 1], names)) {
            for (const n in names) {
              if (names[n] === 'complete_rate') {
                this.list[i][names[n]] = '-1';
              } else {
                this.list[i][names[n]] = '';
              }
            }
          }
        }
      }
    }
    if (!['POSUM', 'PRSUM'].includes(this.taskInfo.task_category)) {
      this.list.forEach((data: any, index): void => {
        data.complete_rate = data.complete_rate ? data.complete_rate : 0;
        if (data.complete_rate === '-1') {
          data.complete_rate = '';
        } else {
          if (data.complete_rate <= 1) {
            data.complete_rate = `${multiple(data.complete_rate.toFixed(4), 100)}%`;
          }
        }
      });
    }

    if (this.taskInfo.task_category === 'PRSUM') {
      const handelData = this.state === '1' ? this.waittingData : this.completedData;
      if (!handelData.isCalculated) {
        handelData.isCalculated = true;
        this.posumService.handelPopurPosumAndData(this.list, handelData, this.getPrsumKey, 'PRSUM');
      }
      this.list = handelData.data;
    }

    if (this.taskInfo.task_category === 'POSUM' && this.isNeedMerge) {
      const handelData = this.state === '1' ? this.waittingData : this.completedData;
      if (!handelData.isCalculated) {
        handelData.isCalculated = true;
        this.posumService.handelPopurPosumAndData(this.list, handelData, this.getPosumKey, 'POSUM');
      }
      this.list = handelData.data;
    }
    this.initTemplateJson(this.taskInfo.task_category, this.list);
  }

  /**
 * Posum任务类型
 */
  handelPosumData(): void {
    const handelData = this.state === '1' ? this.waittingData : this.completedData;
    if (handelData.isCalculated) {
      console.log('isCalculated');
      this.list = handelData.data;
      return;
    }
    handelData.isCalculated = true;
    const mergeGroupData = this.getMergeGroup(this.list, this.getPosumKey);
    this.getMergeTableList(mergeGroupData);
  }

  getPosumKey(obj: any) {
    return obj.reference_type_no + obj.reference_doc_no + obj.item_name_spec + obj.item_spec;
  }

  getPrsumKey(obj: any) {
    return obj.reference_type_no + obj.reference_doc_no + obj.item_name_spec + obj.item_spec;
  }

  /**
   * 按照单别单号品名规格分成大组,合并单元格
   * @returns
  */
  getMergeGroup(rawData: any, callBack: any): any {
    return rawData.reduce((acc, obj) => {
      const key = callBack(obj);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }

  /**
* 获取类似合并单元格的数据
* @param grouped
*/
  getMergeTableList(grouped): void {
    const handelData = this.state === '1' ? this.waittingData : this.completedData;
    for (const k in grouped) {
      if (Object.prototype.hasOwnProperty.call(grouped, k)) {
        // 获取每个大组名称对应的数组
        const element = grouped[k];
        // 将大组名称对应的数组按照item_classification进行分组
        const classification = this.getPosumClassificationGroup(element);
        const groupTotalData = this.getPosumGroupTotalData(classification);
        this.setPosumTotalData(groupTotalData);
      }
    }
    this.list = handelData.data;
  }


  /**
  * 统计总明细
  * @param groupTotalData
  */
  setPosumTotalData(groupTotalData): void {
    const handelData = this.state === '1' ? this.waittingData : this.completedData;
    let completeRateAverage = 0;
    if (groupTotalData.count) {
      completeRateAverage = groupTotalData.total_complete_rate_number / groupTotalData.count;
    }
    const complete_rate_number =
      String(completeRateAverage).length > 5
        ? completeRateAverage.toFixed(4) : completeRateAverage;
    handelData.data.push({
      reference_type_no: '',
      reference_doc_no: '',
      item_name_spec: '',
      item_spec: '',
      item_classification: '总明细',
      complete_rate: complete_rate_number + '%',
      purchase_qty: groupTotalData.total_purchase_qty,
      stock_in_qty: groupTotalData.total_stock_in_qty,
    });
  }

  /**
* 根据品号分类/群组分组: 遍历大组，将其按照群组进行分组，结果是{key: {group:[values]}}
* @param rawData
* @returns
*/
  getPosumClassificationGroup(rawData: any): any {
    return rawData.reduce((acc, obj) => {
      const key = obj.item_classification;
      if (!acc[key]) {
        acc[key] = [{
          reference_type_no: obj.reference_type_no,
          reference_doc_no: obj.reference_doc_no,
          item_name_spec: obj.item_name_spec,
          item_spec: obj.item_spec,
          item_classification: obj.item_classification,
          complete_rate: 0,
          purchase_qty: 0,
          stock_in_qty: 0
        }];
      }
      acc[key].push({
        ...obj,
        ...{
          reference_type_no: '',
          reference_doc_no: '',
          item_name_spec: '',
          item_spec: '',
          item_classification: '',
          out_plan_time: obj.out_plan_time === 'Y' ? '*' : '',
          complete_rate: String(obj.complete_rate).length > 5 ? Number(obj.complete_rate).toFixed(4) : Number(obj.complete_rate)
        }
      });
      return acc;
    }, {}) ?? {};
  }


  /**
* 获取总明细信息
* @param classification
* @returns
*/
  getPosumGroupTotalData(classification: any): any {
    const groupTotalData = {
      total_complete_rate_number: 0,
      count: 0,
      total_purchase_qty: 0,
      total_stock_in_qty: 0,
    };
    this.getPosumClassificationTotalData(classification, groupTotalData);
    return groupTotalData;
  }


  /**
  * 获取群组分组总明细
  * @param classification
  * @param groupTotalData
  */
  getPosumClassificationTotalData(classification: any, groupTotalData): void {
    const handelData = this.state === '1' ? this.waittingData : this.completedData;
    Object.keys(classification).forEach(((i, classificationIndex) => {
      const classificationTotalData = {
        complete_rate_number: 0,
        complete_rate: '0',
        purchase_qty: 0,
        stock_in_qty: 0,
        reference_type_no: '',
        reference_doc_no: '',
        item_name_spec: '',
        item_spec: ''
      };
      // 遍历每个小分组名字对应的数组，统计小组组的总完成率、总进货量和总出货量
      classification[i].forEach((item, index) => {
        if (classificationIndex > 0 && index === 0) {
          item.reference_type_no = '';
          item.reference_doc_no = '';
          item.item_name_spec = '';
          item.item_spec = '';
        }
        if (index > 0) {
          groupTotalData.count++;
          groupTotalData.total_complete_rate_number += Number(item.complete_rate);
          classificationTotalData.complete_rate_number += Number(item.complete_rate);
          classificationTotalData.purchase_qty += Number(item.purchase_qty);
          classificationTotalData.stock_in_qty += Number(item.stock_in_qty);
        }
      });
      // 给每个小分组名字对应的数组的第一个数组（总计组）赋值总完成率、总进货量和总出货量
      const caculeData = classificationTotalData.complete_rate_number / (classification[i].length - 1);
      if (String(caculeData).length > 5) {
        classification[i][0].complete_rate = Number(caculeData).toFixed(4) + '%';
      } else {
        classification[i][0].complete_rate = caculeData + '%';
      }
      classification[i][0].purchase_qty = classificationTotalData.purchase_qty;
      classification[i][0].stock_in_qty = classificationTotalData.stock_in_qty;
      // 将每个小组中的总计（总完成率、总进货量和总出货量）赋值给每个大组的总计明细
      groupTotalData.total_purchase_qty += Number(classification[i][0].purchase_qty);
      groupTotalData.total_stock_in_qty += Number(classification[i][0].stock_in_qty);
      // 将每个组的百分比数显示成%
      classification[i].forEach((item, index) => {
        if (index > 0) {
          item.complete_rate = item.complete_rate + '%';
        }
      });
      // 标记数据已经被处理
      groupTotalData.isCalculated = true;
      // 保存处理数据的结果
      handelData.data = [...handelData.data, ...classification[i]];
    }));
  }

  initTemplateJson(category: string, data: Array<any>): void {
    const result = this.posumTaskCardService.setTemplateJson(
      category,
      data,
      this.showBtn,
      this.model?.content
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
    console.log(this.dynamicGroup);
    this.changeRef.markForCheck();
  }

  submit() {
    if (!this.activeBtn) {
      return;
    }
    const taskInfo = this.taskInfo;
    taskInfo.doc_type_no = this.pageData.doc_type_no;
    taskInfo.doc_no = this.pageData.doc_no;
    taskInfo.seq = this.pageData.seq;
    const params = {
      project_info: [
        {
          ...taskInfo,
          report_source: '10',
          employee_no: this.userService.getUser('userId'),
          operation_no: this.userService.getUser('userId'),
          operation_name: this.userService.getUser('userName'),
        },
      ],
    };
    this.commonService.getInvData('task.info.update', params).subscribe((res: any): void => {
      if (res.code === 0) {
        this.getTaskInfo();
      }
    });
  }

  changeTab(state: string): void {
    this.state = state;
    this.buildListData();
    this.changeRef.markForCheck();
  }

  onChange(event) {
    if (!event) {
      return;
    }
    setTimeout(() => {
      const pageData = event.group.getRawValue();
      this.pageData = pageData;
      if (['MOOP'].includes(this.taskInfo.task_category)) {
        this.activeBtn = false;
        if (pageData.doc_type_no && pageData.doc_no && pageData.seq) {
          this.activeBtn = true;
        }
        this.showBtn = true;
        this.changeRef.markForCheck();
        return;
      }
      if (pageData.doc_type_no && pageData.doc_no) {
        this.activeBtn = true;
      } else {
        this.activeBtn = false;
      }
      this.changeRef.markForCheck();
    });
  }

  checkData(list, list1, nameList) {
    let isSome = true;
    for (const i in nameList) {
      if (list[nameList[i]] === list1[nameList[i]]) {
        isSome = true;
      } else {
        return false;
      }
    }
    return isSome;
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
