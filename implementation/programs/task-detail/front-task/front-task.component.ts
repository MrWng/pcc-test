import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicTableModel,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { FrontTaskService } from './front-task.service';
import { DynamicFrontTaskModel } from 'app/implementation/model/front-task/front-task.model';
import { CommonService } from 'app/implementation/service/common.service';
import { APIService } from 'app/implementation/service/api.service';
import { DwUserService } from '@webdpt/framework/user';


@Component({
  selector: 'app-dynamic-front-task',
  templateUrl: './front-task.component.html',
  styleUrls: ['./front-task.component.less'],
  providers: [FrontTaskService],
})
export class FrontTaskComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicFrontTaskModel;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  isShowSpin: boolean = true;
  project_no: any;
  task_no: any;
  isVisible = false;
  list = [];

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    private formService: DynamicFormService,
    private modalService: NzModalService,
    protected elementRef: ElementRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public fb: FormBuilder,
    public frontTaskService: FrontTaskService,
    public apiService: APIService,
    private userService: DwUserService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    let content;
    if ((this.model as any).contents) {
      content = (this.model as any).contents;
    } else {
      content = this.model?.content;
    }
    const project_info = content.executeContext?.taskWithBacklogData.bpmData.project_info;
    const doc_info = content.executeContext?.taskWithBacklogData.bpmData.doc_info;
    this.project_no =
      project_info && project_info[0].project_no
        ? project_info[0].project_no
        : doc_info && doc_info[0].project_no
          ? doc_info[0].project_no
          : '';
    this.task_no =
      project_info && project_info[0].task_no
        ? project_info[0].task_no
        : doc_info && doc_info[0].task_no
          ? doc_info[0].task_no
          : '';
    // this.getData();
  }

  getData() {
    if (!this.project_no || !this.task_no) {
      this.isShowSpin = false;
      return;
    }
    const params = {
      task_info: [
        {
          project_no: this.project_no,
          task_no: this.task_no,
        },
      ],
    };
    this.commonService.getInvData('before.task.info.get', params).subscribe((res: any): void => {
      this.isShowSpin = false;
      this.list = res.data.before_task_info;
      this.list.forEach((resData) => {
        if (resData.attachment?.data) {
          resData.attachment0 = {
            rowDataKey: resData.project_no + ';' + resData.before_task_no + ';',
            data: [],
          };
          resData.attachment1 = {
            rowDataKey: resData.project_no + ';' + resData.before_task_no + ';',
            data: [],
          };
          const data = resData.attachment.data;
          for (const i in data) {
            if (data.hasOwnProperty(i)) {
              data[i].uploadUserName = data[i].upload_user_name;
              data[i].createDate = data[i].create_date;
              if (
                data[i].category === 'manualAssignmentDelivery' ||
                data[i].category === 'mohDeliverable'
              ) {
                resData.attachment0.data.push(data[i]);
              } else {
                resData.attachment1.data.push(data[i]);
              }
            }
          }
        }
      });
      this.initTemplateJson(this.list);
    });
  }

  initTemplateJson(data: Array<any>): void {
    const result = this.frontTaskService.setTemplateJson(data);
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
    this.isVisible = true;
    this.changeRef.markForCheck();
  }

  closeMask() {
    this.isVisible = false;
  }

  clickContent(ev: any): void {
    ev.stopPropagation();
  }

  showTable() {
    this.getData();
    // this.isVisible = true;
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
