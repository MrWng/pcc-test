import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { APIService } from '../../../service/api.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicTableModel,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
  multiple,
} from '@ng-dynamic-forms/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicApcTaskCardModel } from '../../../model/apc-task-card/apc-task-card.model';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../service/common.service';
import { cloneDeep } from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';
import { APCTaskCardService } from './apc-task-card.service';

@Component({
  selector: 'app-apc-task-card',
  templateUrl: './apc-task-card.component.html',
  styleUrls: ['./apc-task-card.component.less'],
  providers: [APCTaskCardService],
})

export class ApcTaskCardComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicApcTaskCardModel;
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();
  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];

  // 项目编号
  project_no: any;
  // 加载中
  loading: boolean = true;
  // 是否显示提交按钮
  showSubmitButton: boolean = false;
  // 提交按钮是否可用
  canSubmit: boolean = false;
  // 是否可编辑表格
  editable: boolean = true;
  // 任务状态
  taskStatus: Array<any> = [
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
  state: string = '1';
  taskInfo: any;
  // 待完成信息
  waitingTask: any;
  // 已处理信息
  completedTask: any;
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
    public apcTaskCardService: APCTaskCardService,
    protected userService: DwUserService,
    private messageService: NzMessageService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.commonService.content = this.model.content;
    this.project_no = this.model?.content?.executeContext?.taskWithBacklogData.bpmData.project_info[0].project_no;
    this.getTaskInfo();
  }

  getTaskInfo(): void {
    const params = {
      project_info: [
        {
          control_mode: '1',
          project_no: this.project_no,
          task_no: this.model?.content?.executeContext?.taskWithBacklogData?.bpmData?.project_info[0].task_no,
        },
      ],
    };
    this.commonService.getInvData('task.info.get', params).subscribe(({ data = {} }): void => {
      this.taskInfo = data.project_info[0] ?? {};
      // 单别、单号
      if (this.taskInfo?.doc_type_no && this.taskInfo?.doc_no) {
        // 都不为空时，画面不需要【提交】按钮，栏位只读
        // 直接呼叫 敏103.project.doc.info.process入參.專案編號、單別、單號、序號 (api再調用中台  bm.dsc.wo.op.dispatch.get )
        this.getInfoData();
      } else {
        this.loading = false;
        this.showSubmitButton = true;
        this.taskStatus[0].sum = 1;
        this.initTemplateData('1');
      }
      this.changeRef.markForCheck();
    });
  }

  async getInfoData(): Promise<any> {
    this.taskInfo.wo_type_no = this.taskInfo.doc_type_no;
    this.taskInfo.wo_no = this.taskInfo.doc_no;
    this.taskInfo.plan_date_e = this.taskInfo.plan_finish_date;
    this.taskInfo.plan_complete_date = this.taskInfo.plan_finish_date;
    const [waitting, completed] = await Promise.all([
      this.apiService.project_Doc_Data_Get(
        [
          {
            ...this.taskInfo,
            process_status: '1',
          },
        ],
        this.taskInfo.eoc_company_id,
      ),
      this.apiService.project_Doc_Data_Get(
        [
          {
            ...this.taskInfo,
            process_status: '2',
          },
        ],
        this.taskInfo.eoc_company_id
      ),
    ]);
    let [waitTasksNumber, completedTasksNumber] = [0, 0];
    waitting?.forEach((o) => {
      o.process_status = '1';
      waitTasksNumber++;
      this.handelData(o);
    });
    completed?.forEach((o) => {
      o.process_status = '2';
      completedTasksNumber++;
      this.handelData(o);
    });
    this.taskStatus.forEach(p => {
      p.sum = p.code === '1' ? waitTasksNumber : completedTasksNumber;
    });
    this.loading = false;
    this.editable = false;
    this.waitingTask = this.formatData(waitting);
    this.completedTask = this.formatData(completed);
    this.initTemplateData('1');
    this.changeRef.markForCheck();
  }

  formatData(list) {
    if (!list) {
      return;
    }
    // 格式化数据
    const names = ['status', 'wo_no', 'item_no', 'item_name_spec', 'item_spec'];
    const baseData = cloneDeep(list);
    for (let i = 0; i < baseData.length; i++) {
      if (i > 0) {
        if (this.checkData(baseData[i], baseData[i - 1], names)) {
          for (const n in names) {
            if (names[n] === 'complete_rate') {
              list[i][names[n]] = '-1';
            } else {
              list[i][names[n]] = '';
            }
          }
        }
      }
    }
    return list;
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
   * 处理特殊数据
   * @param item
   */
  handelData(item: any): void {
    item.status = this.apcTaskCardService.statusList1[item.status];
    item.op_type = this.apcTaskCardService.statusList4[item.op_type];
    item.complete_rate = Number(item.complete_rate) ? Number(item.complete_rate) : 0;
    if (item.complete_rate === '-1') {
      item.complete_rate = '';
    } else {
      if (item.complete_rate <= 1) {
        item.complete_rate = `${multiple(item.complete_rate.toFixed(4), 100)}%`;
      }
    }
    item.out_plan_time === 'Y' ? (item.out_plan_time = '*') : (item.out_plan_time = '');
  }

  // 提交
  submit() {
    if (!this.canSubmit) {
      return;
    }

    const params = {
      project_info: [
        {
          ...this.taskInfo,
          report_source: '10',
          employee_no: this.userService.getUser('userId'),
          operation_no: this.userService.getUser('userId'),
          operation_name: this.userService.getUser('userName'),
        },
      ],
    };
    this.commonService.getInvData('task.info.update', params).subscribe((res: any): void => {
      this.loading = true;
      this.getInfoData();
      this.changeRef.markForCheck();
    });

  }

  changeTab(state: string): void {
    this.state = state;
    this.initTemplateData(state);
    this.changeRef.markForCheck();
  }

  onChange(event) {
    if (event?.$event?.type !== 'change') {
      return;
    }
    this.canSubmit = false;
    const pageData = event.group.getRawValue();
    this.taskInfo.doc_type_no = pageData.doc_type_no;
    this.taskInfo.doc_no = pageData.doc_no;
    if (pageData.doc_type_no && pageData.doc_no) {
      this.canSubmit = true;
    }
    this.changeRef.markForCheck();
  }

  initTemplateData(state: string): void {
    let data;
    if (this.editable) {
      data = state === '1'
        ? [{
          doc_type_no: this.taskInfo?.doc_type_no ? this.taskInfo?.doc_type_no : '', // 单别
          doc_no: this.taskInfo?.doc_no ? this.taskInfo?.doc_no : '', //  单号
          complete_rate: '0%', // 完成率
          process_status: '1', // 处理状态	1.待处理 2.已完工
        }]
        : [];
    } else {
      data = state === '1' ? this.waitingTask : this.completedTask;
    }
    this.initTemplateJson(data);
  }


  initTemplateJson(data: Array<any>): void {
    const result = this.apcTaskCardService.setTemplateJson(
      this.editable,
      data,
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
    this.changeRef.markForCheck();
  }


  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
