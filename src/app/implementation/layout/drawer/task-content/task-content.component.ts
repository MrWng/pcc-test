import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { TranslateService } from '@ngx-translate/core';
import {
  Content,
  DynamicFormControlModel,
  DynamicFormLayout,
  DynamicFormService,
  getElementHeight,
  isEmpty,
  isNotEmpty,
  isNotNone,
} from '@ng-dynamic-forms/core';
import { DynamicCalculateComponentHeight } from '@ng-dynamic-forms/core';
import { ValidationErrorsService } from '@ng-dynamic-forms/core';
import { AntFormSubmitService } from '@ng-dynamic-forms/ui-ant-web';
import { FormGroup } from '@angular/forms';
import { DynamicTemplateService } from '@ng-dynamic-forms/ui-ant-web';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SubmitSpinService } from '@ng-dynamic-forms/ui-ant-web';

@Component({
  // tslint:disable-next-line
  selector: 'app-task-content',
  templateUrl: './task-content.component.html',
  styleUrls: ['./task-content.component.less'],
  providers: [ValidationErrorsService, DynamicTemplateService],
})
export class TaskContentComponent
  extends DynamicCalculateComponentHeight
  implements OnInit, AfterViewChecked, OnDestroy
{
  @Input()
  templateJson: any;

  @Input()
  activity: any;

  @Output()
  task_submit = new EventEmitter();

  componentCollection: any[];
  formGroup: FormGroup;
  formModel: DynamicFormControlModel[];
  formLayout: DynamicFormLayout;
  content: Content;

  actions: any[] = [];
  rules: Array<any> = [];
  resultData: any;

  isNotEmpty = isNotEmpty;

  @ViewChild('headerArea', { static: false })
  headerAreaContainer: ElementRef;

  @ViewChild('contentArea', { static: false })
  contentAreaContainer: ElementRef;

  @ViewChild('actionArea', { static: false })
  actionAreaContainer: ElementRef;

  // contentModelTypeArr: string[] = [
  //   'CONTENT_TITLE',
  //   'CONTENT_SUBTITLE',
  //   'CONTENT_QUERY_BUTTON',
  //   'TABLE',
  //   'DYNAMIC_AREA',
  //   'TASK_MECHANISM_ADJUSTMENT',
  // ];
  headerModel: DynamicFormControlModel[] = [];
  contentModel: DynamicFormControlModel[] = [];
  // contentActionMinHeight = 500;
  queryBtnParams: any;
  resizeListenDisposing: Function;

  constructor(
    private formService: DynamicFormService,
    private submitService: AntFormSubmitService,
    private translateService: TranslateService,
    private renderer2: Renderer2,
    private submitSpinService: SubmitSpinService,
    private changeRef: ChangeDetectorRef,
    private configService: DwSystemConfigService,
    protected elementRef: ElementRef,
    public templateService: DynamicTemplateService,
    private http: HttpClient
  ) {
    super(elementRef);
    this.configService.get('uibotUrl').subscribe((url: string) => {
      this.templateService.uibotUrl = url;
    });
  }

  ngOnInit(): void {
    this.initTemplateJson();
    this.asyncQueryResultCall();
    this.viewResize();
  }

  viewResize(): void {
    this.resizeListenDisposing = this.renderer2.listen('window', 'resize', () => {
      this.calculateComponentHeight();
    });
  }

  ngAfterViewChecked(): void {
    this.calculateComponentHeight();
    this.changeRef.markForCheck();
    this.changeRef.detectChanges();
  }

  initTemplateJson(): void {
    const { layout, pageData, rules, style, actions, content, executeContext } = this.templateJson;
    this.content = content || {};
    if (isNotEmpty(executeContext)) {
      this.content.executeContext = executeContext;
    }
    if (isNotNone(this.activity)) {
      Object.assign(this.content, {
        taskName: this.activity.name,
      });
    }
    this.resultData = this.templateJson;
    const initializedData = this.formService.initData(
      layout,
      pageData,
      rules,
      style,
      this.content,
      actions
    );
    this.formLayout = initializedData.formLayout; // 样式
    this.formModel = initializedData.formModel; // 组件数据模型
    if (isNotEmpty(this.formModel)) {
      this.formModel.forEach((model: DynamicFormControlModel) => {
        // if (this.contentModelTypeArr.includes(model.type)) {
        this.contentModel.push(model);
        // } else {
        //   this.headerModel.push(model);
        // }
      });
    }
    this.formGroup = initializedData.formGroup; // formGroup
    this.rules = initializedData.rules || []; // 规则
    this.actions = actions || [];
    this.initComponentCollection();
    this.changeRef.markForCheck();
    // triggerControlRule(this.formGroup);
    // this.formService.setFormGroupEnvironment(
    //   formGroup,
    //   EnvironmentStatus.AFTER_SUBMIT,
    //   null
    // );
  }

  calculateComponentHeight(): void {
    let totalHeight = this.getContainerHeight();
    const needRecalculateArr = [];
    if (isEmpty(this.componentCollection)) {
      return;
    }
    // let headerHeight = 0;
    let contentHeight = 0;
    const actionHeight = isNotEmpty(this.actionAreaContainer)
      ? getElementHeight(this.actionAreaContainer.nativeElement)
      : 0;
    this.componentCollection.forEach((componentItem) => {
      // if (this.headerModel.includes(componentItem.component.model)) {
      //   headerHeight += componentItem.heightChange.value;
      // }
      // componentItem.offsetTop.next(headerHeight + contentHeight);
      componentItem.offsetTop.next(contentHeight);
      componentItem.offsetBottom.next(
        totalHeight - componentItem.offsetTop.value - componentItem.heightChange.value
      );
      if (!componentItem.component.changeRef['destroyed']) {
        componentItem.component.changeRef.markForCheck();
        // componentItem.component.changeRef.detectChanges();
      }
      if (
        // this.contentModel.includes(componentItem.component.model) &&
        !componentItem.needRecalculate
      ) {
        contentHeight += componentItem.heightChange.value;
      }
      if (componentItem.needRecalculate) {
        needRecalculateArr.push(componentItem);
      }
    });

    totalHeight = totalHeight - actionHeight - contentHeight;

    // if (totalHeight - headerHeight < this.contentActionMinHeight) {
    //   headerHeight = totalHeight - this.contentActionMinHeight;
    //   totalHeight = this.contentActionMinHeight - actionHeight - contentHeight;
    // } else {
    // totalHeight = totalHeight - headerHeight - actionHeight - contentHeight;
    // }
    // if (isNotEmpty(this.headerAreaContainer)) {
    //   this.renderer2.setStyle(
    //     this.headerAreaContainer.nativeElement,
    //     'height',
    //     headerHeight + 'px'
    //   );
    // }

    if (totalHeight < 0) {
      totalHeight = totalHeight < 0 ? null : totalHeight;
      if (this.actionAreaContainer) {
        this.renderer2.setStyle(this.actionAreaContainer.nativeElement, 'position', 'static');
      }
    }

    needRecalculateArr.forEach((componentItem) => {
      if (componentItem.heightChange.value !== totalHeight) {
        componentItem.heightChange.next(totalHeight);
        if (!componentItem.component.changeRef['destroyed']) {
          componentItem.component.changeRef.markForCheck();
          // componentItem.component.changeRef.detectChanges();
        }
      }
    });
  }

  getContainerHeight(): number {
    return getElementHeight(this.elementRef.nativeElement, true);
  }

  asyncQueryResultCall(): void {
    this.templateService.asyncQueryFun = (btnParams: any): void => {
      this.updateDynamicArea(btnParams);
    };
  }

  private resetActivityPanelParams(): void {
    this.templateService.formModel = null;
    this.templateService.formGroup = null;
    this.templateService.formLayout = null;
  }

  actionShow(body: any): Observable<any> {
    // const url = '/assets/api/12/temp.json';
    // return this.http.get(url);

    const url = `${this.templateService.uibotUrl}/api/ai/v1/bot/action/show`;
    return this.http.post(url, body);
  }

  updateDynamicArea(btnParams: any): void {
    btnParams = isNotEmpty(btnParams) ? btnParams : this.queryBtnParams;
    this.queryBtnParams = btnParams;
    if (btnParams && btnParams.rowSize === 0) {
      return;
    }
    this.templateService.asyncQueryLoading = true;
    this.templateService.asyncQueryLoadingFailed = false;
    this.templateService.templateJson = null;
    this.resetActivityPanelParams();
    this.actionShow(btnParams).subscribe(
      (res: any) => {
        this.templateService.asyncQueryLoading = false;
        const { data } = res;
        if (data) {
          this.templateService.templateJson = res.data;
        } else {
          this.templateService.asyncQueryLoadingFailed = true;
        }
        this.changeRef.markForCheck();
      },
      (error) => {
        this.templateService.asyncQueryLoading = false;
        this.templateService.asyncQueryLoadingFailed = true;
        this.changeRef.markForCheck();
      }
    );
  }

  clickBtn(actionParams: any): void {
    this.submitService
      .getFormValidationAndStatus(this.formGroup, this.rules, actionParams, this.content)
      .subscribe((res) => {
        this.submitSpinService.dataConfiguring = false;
        this.submitSpinService.showSubmitSpin = true;
        if (res.isReturn) {
          this.submitSpinService.showSubmitSpin = false;
          this.refreshPage();
        } else {
          this.task_submit.emit({
            actionParams: actionParams,
            formGroup: this.formGroup,
          });
        }
      });
  }

  private refreshPage(): void {
    this.changeRef.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.resizeListenDisposing) {
      this.resizeListenDisposing();
    }
  }
}
