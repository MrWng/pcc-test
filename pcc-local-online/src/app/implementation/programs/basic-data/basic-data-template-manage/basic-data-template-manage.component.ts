import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { EventBusService, EventBusSpecialChannel } from '@athena/dynamic-core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { Subject } from 'rxjs';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { BasicDataTemplateManageService } from './basic-data-template-manage.service';
import { DynamicBasicDataTemplateManageModel } from 'app/implementation/model/basic-data-template-manage/basic-data-template-manage.model';
import { AddSubProjectCardService } from 'app/implementation/component/add-subproject-card/add-subproject-card.service';
import { WbsTabsService } from 'app/implementation/component/wbs-tabs/wbs-tabs.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-basic-data-template-manage',
  templateUrl: './basic-data-template-manage.component.html',
  styleUrls: ['./basic-data-template-manage.component.less'],
  providers: [
    BasicDataTemplateManageService,
    WbsTabsService,
    DynamicWbsService,
    AddSubProjectCardService,
    CommonService,
  ],
})
export class BasicDataTemplateManageComponent
  extends DynamicFormControlComponent
  implements OnInit, OnChanges
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicBasicDataTemplateManageModel;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  // wbs入口
  Entry = Entry;
  // 专案模版维护数据
  projectTemplateMaintainData: any = [];

  isEdit: boolean = false;

  templateInfo: any = {};
  isShowWbs: boolean = false;
  activeStatus: boolean = true;
  subject: Subject<any>;
  validateForm: FormGroup = this.fb.group({
    project_template_no: [null, [Validators.required]],
    project_template_name: [null, [Validators.required]],
    project_type_no: [null],
  });

  private callSaveToTemplate$ = new Subject<void>();

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public basicDataTemplateManageService: BasicDataTemplateManageService,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    private translateService: TranslateService,
    private modalService: NzModalService,
    private messageService: NzMessageService,
    public fb: FormBuilder,
    public eventBusService: EventBusService,
    public wbsService: DynamicWbsService,
    public wbsTabsService: WbsTabsService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    // 注册观察者
    const key = this.eventBusService.register(EventBusSpecialChannel.baseDate);
    this.subject = this.eventBusService.getSubject(key);
  }

  ngOnInit(): void {
    this.initData();
    this.changeFormValue();
    this.initSaveToTemplate();
  }

  /**
   * 初始化wbs服务中的数据
   */
  initData(): void {
    this.wbsService.editable = true;
    this.wbsService.modelType = this.model.type;
    this.wbsService.group = this.group;
    this.commonService.content = this.model.content;
    if (this.group.value?.parameterData) {
      this.wbsService.project_no =
        this.group.value?.parameterData?.project_template_info[0].project_template_no;
      this.isEdit = !!this.wbsService.project_no;
    }
    if (this.isEdit) {
      this.templateInfo = this.group.value?.parameterData?.project_template_info[0];
      this.wbsService.projectInfo = this.templateInfo;
      this.templateInfo.temp =
        this.templateInfo?.project_type_name + this.templateInfo?.project_type_no;
      this.activeStatus = false;
      this.validateForm = this.fb.group({
        project_template_no: [
          { value: this.templateInfo?.project_template_no, disabled: true },
          [Validators.required],
        ],
        project_template_name: [
          { value: this.templateInfo?.project_template_name, disabled: false },
          [Validators.required],
        ],
        project_type_no: [{ value: this.templateInfo?.project_type_no, disabled: false }],
      });
      this.getTaskInfo();
    }
    this.queryChargePersonList();
  }

  getProjectInfo(): void {
    this.basicDataTemplateManageService.getProjectInfo(this.wbsService.project_no).then((res) => {
      this.wbsService.projectInfo = res;
    });
  }

  /**
   * 获取任务卡信息
   */
  getTaskInfo(): void {
    this.commonService
      .getTaskInfo(this.wbsService.project_no, Entry.maintain)
      .subscribe((value) => {
        const project_info = value.data?.project_info ?? [];
        this.projectTemplateMaintainData = project_info;
        this.isShowWbs = true;
        this.changeRef.markForCheck();
      });
  }

  changeFormValue(): void {
    this.validateForm?.valueChanges.subscribe((form) => {
      this.activeStatus = true;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {}

  // 获取开窗定义
  openProjectTypeInfoWindow(): void {
    this.basicDataTemplateManageService.getProjectTypeInfo().subscribe((res: any): void => {
      if (res.code === 0) {
        this.basicDataTemplateManageService.openWindowDefine = res.data;
        const executeContextTemp = JSON.parse(
          JSON.stringify(this.commonService.content.executeContext)
        );
        if (executeContextTemp && executeContextTemp.taskWithBacklogData) {
          delete executeContextTemp.taskWithBacklogData;
        }
        if (executeContextTemp && executeContextTemp.allBpmData) {
          delete executeContextTemp.allBpmData;
        }

        executeContextTemp.identity = 'performer';
        executeContextTemp.tmActivityId = 'projectTemplate';
        executeContextTemp.category = 'DOUBLE-DOCUMENT';
        executeContextTemp.relationTag = {
          identity: 'performer',
          activityId: 'projectTemplate',
        };
        executeContextTemp.gridSchema = 'project_template_info';
        executeContextTemp.isTaskEngine = false;
        executeContextTemp.pattern = 'com';
        executeContextTemp.pageCode = 'task-detail';
        const operations = [
          {
            title: this.translateService.instant('dj-default-选择项目类型'),
            description: this.translateService.instant('dj-pcc-建议人工处理'),
            operate: 'openwindow',
            openWindowDefine: {
              title: this.translateService.instant('dj-default-选择项目类型'),
              selectedFirstRow: false,
              multipleSelect: false,
              rowSelection: 'single',
              allAction: {
                defaultShow: false,
                dataSourceSet: this.basicDataTemplateManageService.openWindowDefine.dataSourceSet,
                executeContext: executeContextTemp,
              },
              buttons: [
                {
                  title: this.translateService.instant('dj-default-确定'),
                  actions: [
                    {
                      category: 'UI',
                      backFills: [
                        {
                          key: 'project_type_name',
                          valueScript: "selectedObject['project_type_name']",
                        },
                        {
                          key: 'project_type_no',
                          valueScript: "selectedObject['project_type_no']",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ];
        const selectRow = this.fb.group({ project_type_info: [[]] });
        this.openWindowService.openWindow(
          selectRow,
          operations,
          [],
          '',
          '',
          (resData: Array<any>) => {
            const oldProjectTypeNo = this.validateForm.get('project_type_no').value;
            const { project_type_name, project_type_no } = resData[0];
            this.validateForm.get('project_type_no').setValue(project_type_no);
            this.validateForm.get('project_type_no').markAsDirty();
            this.templateInfo.temp = project_type_name + project_type_no;
            this.changeRef.markForCheck();
          }
        );
      }
    });
  }

  initSaveToTemplate(): void {
    this.callSaveToTemplate$.pipe(debounceTime(200)).subscribe((change: any) => {
      this.saveToTemplate();
    });
  }

  callSaveToTemplate() {
    this.callSaveToTemplate$.next();
  }

  saveToTemplate() {
    if (!this.validateForm.dirty) {
      return;
    }
    if (!this.activeStatus) {
      return;
    }
    for (const i in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }
    if (this.validateForm.invalid) {
      return;
    }
    const project_type_no = this.wbsService.projectInfo?.project_type_no || null;
    const project_template_info = {
      project_template_no: this.validateForm.getRawValue().project_template_no,
      project_template_name: this.validateForm.getRawValue().project_template_name,
      project_type_no: this.validateForm.getRawValue().project_type_no,
      project_no: this.validateForm.getRawValue().project_template_no,
      task_info: [],
    };
    const card_list = [];
    // 创建的时候 待定
    if (this.wbsService.project_no && Array.isArray(card_list)) {
      card_list.forEach((o) => {
        project_template_info.task_info.push({
          task_classification_name: o.task_classification_name,
          task_classification_no: o.task_classification_no,
        });
      });
    }
    const params = {
      data_source: '1',
      project_template_info: [project_template_info],
    };
    // spring 3.1 更换api名称 [入参、出参]：'project.template.info.update' ==> 'bm.pisc.project.template.update'
    // spring 3.1 更换api名称 [入参、出参]：'project.template.info.create' ==> 'bm.pisc.project.template.create'
    const url = this.wbsService.project_no
      ? 'bm.pisc.project.template.update'
      : 'bm.pisc.project.template.create';
    this.commonService.getInvData(url, params).subscribe((res) => {
      if (res && res.code === 0) {
        if (res.data && res.data?.project_template_info[0]?.error_msg) {
          // 适用于：bm.pisc.project.template.create 返回信息
          this.messageService.error(res.data?.project_template_info[0].error_msg);
          return;
        }
        if (res.data && res.data?.project_template_info[0]?.project_no_mistake_message) {
          this.messageService.error(res.data.project_template_info[0].project_no_mistake_message);
          return;
        }
        this.wbsService.project_no = project_template_info.project_template_no;
        this.wbsService.projectInfo.project_type_no =
          this.validateForm.get('project_type_no').value ?? null;
        const info = this.isEdit ? 'dj-default-保存成功！' : 'dj-default-模板创建成功！';

        if (!this.isEdit) {
          this.validateForm.get('project_template_no').disable();
        }
        if (
          this.isEdit &&
          res.data &&
          res.data?.project_template_info &&
          res.data?.project_template_info[0]?.project_template_no_mistake_message
        ) {
          this.messageService.error(
            this.translateService.instant(
              res.data?.project_template_info[0].project_template_no_mistake_message
            )
          );
          return;
        }
        if (
          !url.includes('create') &&
          project_type_no !== this.validateForm.getRawValue().project_type_no &&
          this.validateForm.getRawValue().project_type_no
        ) {
          this.modalService.confirm({
            nzTitle: null,
            nzContent: this.translateService.instant(
              'dj-pcc-项目类型已变更，是否需要同步更新已排WBS的需要交付物和需要签核？'
            ),
            nzCancelText: this.translateService.instant('dj-default-否'),
            nzOkText: this.translateService.instant('dj-default-是'),
            nzClassName: 'confirm-modal-center-sty confirm-modal-center-content-sty',
            nzOnOk: (): void => {
              this.editConfig(project_template_info.project_template_no);
              this.changeRef.markForCheck();
            },
          });
        } else {
          this.messageService.success(this.translateService.instant(info));
          this.getTaskInfo();
        }
        this.templateInfo.project_type_no = project_template_info.project_type_no;
        this.isEdit = !!this.wbsService.project_no;
        this.activeStatus = false;
        // 保存完毕回到模板维护刷新界面
        try {
          const from = Symbol();
          if (this.isEdit) {
            this.subject.next({
              from,
              name: 'updateTabName',
              params: {
                name: this.translateService.instant('dj-pcc-维护'),
              },
            });
          }
          this.subject.next({
            from,
            name: 'updateMainTab',
          });
        } catch (error) {
          console.log(error);
        }
        this.changeRef.markForCheck();
      }
    });
  }

  editConfig(project_no: string) {
    const params = {
      project_type_info: [
        {
          project_type_no: this.validateForm.getRawValue().project_type_no,
        },
      ],
    };
    this.commonService
      .getInvData('bm.pisc.project.type.get', params)
      .subscribe((res: any): void => {
        this.changeRef.markForCheck();
        this.editTask(
          res.data.project_type_info[0].is_approve,
          res.data.project_type_info[0].is_attachment,
          project_no
        );
        this.changeRef.markForCheck();
      });
  }

  editTask(is_approve, is_attachment, project_no) {
    const param = {
      project_info: [
        {
          control_mode: '1',
          project_no: project_no,
          task_property: '2',
        },
      ],
    };
    this.commonService.getInvData('task.info.get', param).subscribe((res: any): void => {
      const projectTemplateMaintainData = res.data.project_info;
      projectTemplateMaintainData.forEach((resData) => {
        resData.is_approve = is_approve ? is_approve : false;
        resData.is_attachment = is_attachment ? is_attachment : false;
        resData.task_property = '2';
      });
      this.changeRef.markForCheck();
      const params = {
        task_info: projectTemplateMaintainData,
      };
      this.commonService.getInvData('task.base.info.update', params).subscribe((): void => {
        this.getTaskInfo();
        this.changeRef.markForCheck();
      });
    });
  }

  /**
   * 获取EOC(鼎捷云端端组织)符合授权及用户关联之员工信息 (敏态)
   */
  queryChargePersonList(): void {
    const params = { project_member_info: [{ project_no: '' }] };
    this.commonService.getInvData('employee.info.process', params).subscribe((res: any): void => {
      this.wbsTabsService.personList = res.data.project_member_info;
      this.changeRef.markForCheck();
    });
  }
  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWords(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
