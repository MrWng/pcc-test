import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { DynamicFormLayout, DynamicFormLayoutService } from '@athena/dynamic-core';
import { CommonService } from 'app/implementation/service/common.service';
import { InputGroupOpenWindowModalService} from './input-group-open-window.service';
import { OpenWindowService } from '@athena/dynamic-ui';
import {
  DynamicReportProjectQuestionModel
} from 'app/implementation/model/report-project-question-bulletin-board/report-project-question-bulletin-board.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { InputGroupOpenWindowInterface, OpenWindowInfoInterface } from './InputGroupOpenWindowInterface';

@Component({
  selector: 'app-input-group-open-window',
  templateUrl: './input-group-open-window.component.html',
  styleUrls: ['./input-group-open-window.component.less'],
  providers: [InputGroupOpenWindowModalService],
})
export class InputGroupOpenWindowComponent implements OnInit, OnDestroy {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormLayout;
  @Input() reportProjectQuestionModel: DynamicReportProjectQuestionModel;
  @Input() validateForm: FormGroup = this.fb.group({
    projectInfo: [{}],
    project_name: ''
  });
  @Input() inputGroupInfo: InputGroupOpenWindowInterface = {
    label: '输入框标题',
    placeholder: '输入框提示信息',
    transparentTransmissionStyle: {}
  };

  @Input() openWindowInfo: OpenWindowInfoInterface = {
    title: '开窗标题',
    serviceName: 'window.api',
    dataKeys: [],
    paras: {},
    roleAttention: [],
  }

  executeContext: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public commonService: CommonService,
    protected layoutService: DynamicFormLayoutService,
    protected elementRef: ElementRef,
    private openWindowService: OpenWindowService,
    protected changeRef: ChangeDetectorRef,
    private inputGroupOpenWindowModalService: InputGroupOpenWindowModalService,
    private translateService: TranslateService,
  ) { }

  ngOnInit() {
    this.executeContext = this.reportProjectQuestionModel.content?.executeContext;
  }

  ngOnDestroy(): void { }

  // 单选开窗
  openWindow() {
    const { title, serviceName, paras, dataKeys, roleAttention } = this.openWindowInfo;
    this.executeContext.openWindow = true;
    this.inputGroupOpenWindowModalService
      .getOpenWindowDefine(title, serviceName, this.executeContext, paras, dataKeys)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          const operations = [{
            title: title,
            description: title,
            operate: 'openwindow',
            openWindowDefine: {
              title: title,
              selectedFirstRow: false,
              multipleSelect: false,
              rowSelection: 'single',
              // 可在此处理开窗数据源、上下文
              allAction: {
                defaultShow: false,
                dataSourceSet: res.data.dataSourceSet,
                executeContext: this.executeContext,
              },
              useHasNext: false,
              // 使用 roleAttention 控制接口返回的 columnDefs
              roleAttention,
              buttons: [{
                title: this.translateService.instant('dj-default-确定'),
                actions: [{
                  category: 'UI',
                }]
              }]
            },
          }];
          const selectRow = this.fb.group({ project_no: [''] });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.validateForm.get('project_name').setValue(data[0].project_name);
              this.validateForm.get('projectInfo').setValue(data[0]);
              this.changeRef.markForCheck();
            }
          );
        }
      });
  }

  delete(e) {
    this.validateForm.get('project_name').setValue(null);
    this.validateForm.get('projectInfo').setValue(null);
    this.changeRef.markForCheck();
  }

}
