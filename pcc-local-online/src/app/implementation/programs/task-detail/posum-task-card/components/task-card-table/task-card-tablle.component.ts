import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService
} from '@athena/dynamic-core';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { DynamicPosumTaskCardModel } from '../../../../../model/posum-task-card/posum-task-card.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { APIService } from '../../../../../service/api.service';
import { CommonService } from '../../../../../service/common.service';

@Component({
  selector: 'app-task-card-tablle',
  templateUrl: './task-card-tablle.component.html',
  styleUrls: ['./task-card-tablle.component.less']
})
export class TaskCardTablleComponent extends DynamicFormControlComponent implements OnInit {
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: CommonService,
    public openWindowService: OpenWindowService,
    private translateService: TranslateService,
    private messageService: NzMessageService,
    public fb: FormBuilder,
    public apiService: APIService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPosumTaskCardModel;
  @Input() taskInfo: any

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();


  // 1.待处理 2.已完工 3.全部
  public btnList: any[] = [
    {
      title: this.translateService.instant('dj-pcc-待处理n项'),
      active: true,
      id: '1',
    },
    {
      title: this.translateService.instant('dj-pcc-已完成n项'),
      active: false,
      id: '2',
    },
  ];
  public activeId: string = '1';
  public pendingList: any[] = [];
  public completeList: any[] = [];
  public isShowSpin: boolean = false;

  ngOnInit() {
    this.wbsService.content = this.model.content;
    this.initTaskInfo();
  }

  // 切换按钮状态
  handleSwitchType({ id }) {
    this.btnList.forEach((o) => {
      o.active = false;
      if (id === o.id) {
        this.activeId = o.id;
        o.active = true;
        // this.getTableData(o.id)
      }
    });
    this.changeRef.markForCheck();
  }
  // 获取项目编号和任务编号
  initTaskInfo() {
    const project_info_obj =
      this.model?.content?.executeContext?.taskWithBacklogData.bpmData.project_info[0] || {};
    const infoParams = [
      {
        control_mode: '1',
        project_no: project_info_obj.project_no,
        task_no: project_info_obj.task_no,
      },
    ];
    this.isShowSpin = true;
    this.apiService
      .task_Info_Get(infoParams)
      .then((arr) => {
        this.isShowSpin = false;
        if (!arr.length) {
          this.messageService.error(this.translateWord('暂无数据') as string);
          return;
        }
        this.taskInfo = arr[0];
        // 获取待处理、已完成的数据
        this.btnList.forEach(({ id }) => {
          this.getTableData(id);
        });
        this.changeRef.markForCheck();
      })
      .catch(() => (this.isShowSpin = false));
  }

  /**
   * html  获取表格数据
   * @param processStatus   需要获取的类型      [string]
   */
  getTableData(processStatus) {
    // processStatus 1.待处理 2.已完工 3.全部
    this.isShowSpin = true;
    this.apiService
      .project_Doc_Data_Get(
        [{ ...this.taskInfo, process_status: processStatus }],
        this.taskInfo.eoc_company_id
      )
      .then((arr) => {
        switch (processStatus) {
          case '1':
            this.pendingList = arr;
            break;
          case '2':
            this.completeList = arr;
            break;
          default:
            break;
        }
        this.isShowSpin = false;
        this.changeRef.markForCheck();
      })
      .catch(() => (this.isShowSpin = false));
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
