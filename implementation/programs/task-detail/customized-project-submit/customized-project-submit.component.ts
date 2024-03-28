import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DynamicFormControlComponent, DynamicFormControlLayout,
  DynamicFormLayout, DynamicFormLayoutService, DynamicFormValidationService,
  EventBusService, EventBusSpecialChannel} from '@athena/dynamic-core';
import { CustomizedProjectSubmitModel } from '../../../model/customized-project-submit/customized-project-submit.model';
import { CustomizedProjectSubmitService } from './customized-project-submit.service';
import { CommonService } from '../../../service/common.service';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-customized-project-submit',
  templateUrl: './customized-project-submit.component.html',
  styleUrls: ['./customized-project-submit.component.less'],
  providers: [CustomizedProjectSubmitService, CommonService],
})
export class CustomizedProjectSubmitComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: CustomizedProjectSubmitModel;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  subject: Subject<any>;
  // 管控提交按钮
  isAllowSubmit: boolean = false;
  tmActivityId: string;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private customizedProjectSubmitService: CustomizedProjectSubmitService,
    public commonService: CommonService,
    private modalService: AthModalService,
    private translateService: TranslateService,
    private eventBusService: EventBusService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void { }

  submit(): void {
    if (this.group.valid) {
      this.modalService.confirm({
        nzTitle: this.translateService.instant('dj-c-提示'),
        nzContent: this.translateService.instant('dj-pcc-是否确定提交'),
        nzClassName: 'confirm-modal-center-sty plain-text-modal',
        nzOnOk: (): void => {
          this.confirmSubmit();
        },
      });
    } else {
      if (this.group?.controls) {
        Object.values(this.group?.controls).forEach((validateFormItem: any): void => {
          Object.values(validateFormItem.controls).forEach((item: any): void => {
            item.markAsDirty();
            item.updateValueAndValidity();
          });
        });
      }
    }
  }

  async confirmSubmit() {
    const action = {
      'title': '提交',
      actionId: 'sd_manual.project.create',
      category: 'MANUALPROJECT_NEW',
      'serviceId': {
        'tenant_id': 'E10ATHENA',
        'hostAcct': 'athena',
        'name': 'manual.project.create'
      },
      'trackCode': 'SUBMIT',
      'isCustomize': true,
      type: 'pccStart-customComponent',
      'defaultAction': true,
      'executeContext': {
        'locale': 'zh_CN',
        'clientAgent': 'webplatform',
        'tmActivityId': this.model.content?.executeContext?.tmActivityId ?? this.model?.executeContext?.tmActivityId,
        'pattern': this.model?.content?.executeContext?.pattern ?? this.model?.executeContext?.pattern,
        'pageCode': 'task-detail',
        'category': 'StartProject'
      },
      'submitType': {
        'isBatch': false,
        'schema': 'render_obj'
      },
      'attachActions': [],
      taskEngin: false
    };

    const params = {
      action,
      data: {},
    };
    params['executeContext'] = this.model.content?.executeContext;
    params.data['startActionId'] = 'sd_manual.project.create';
    const render_obj = this.group.value?.render_obj;
    if (render_obj) {
      if (render_obj.coding_pattern === '1') {
        const params_info = {
          sync_steady_state: (render_obj.project_property === '10') ? 'N' : render_obj.hasGroundEnd,
          project_info: [{
            project_no: render_obj.project_no ?? '',
            coding_rule_no: render_obj.coding_rule_no,
            eoc_company_id: render_obj.belong_company_no
          }]
        };
        this.commonService.getInvData('bm.pisc.initiates.project.process', params_info, render_obj.belong_company_no).subscribe(resInfo => {
          if (resInfo.data && resInfo.data?.project_info && resInfo.data?.project_info.length) {
            render_obj.project_no = resInfo.data.project_info[0].project_no;
            params.data[action.submitType.schema] = render_obj;
            this.customizedProjectSubmitService.executeAction(params).pipe(debounceTime(300)).subscribe((res): void => {
              if (res.code === 0) {
                this.handleGenerateProjectOk();
              }
            });
          }
        });
      } else {
        params.data[action.submitType.schema] = render_obj;
        this.customizedProjectSubmitService.executeAction(params).pipe(debounceTime(300)).subscribe((res): void => {
          if (res.code === 0) {
            this.handleGenerateProjectOk();
          }
        });
      }
    }
  }

  handleGenerateProjectOk() {
    this.subject = this.eventBusService.getSubject(EventBusSpecialChannel.createProject);
    if (this.subject && typeof this.subject.next === 'function') {
      this.subject.next(true);
    }
  }
}
