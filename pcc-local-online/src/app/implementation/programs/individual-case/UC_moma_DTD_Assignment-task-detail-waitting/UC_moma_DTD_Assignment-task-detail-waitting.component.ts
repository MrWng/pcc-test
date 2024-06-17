import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { DynamicUCMomaDTDAssignmentTaskDetailWaittingModel } from 'app/implementation/model/UC_moma_DTD_Assignment-task-detail-waitting/UC_moma_DTD_Assignment-task-detail-waitting.model';
import { UCMomaDTDAssignmentTaskDetailWaittingService } from './UC_moma_DTD_Assignment-task-detail-waitting.service';
import { CommonService } from 'app/implementation/service/common.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { ModalFormService } from '@app-custom/ui/modal-form';

@Component({
  selector: 'app-UC_moma_DTD_Assignment-task-detail-waitting',
  templateUrl: './UC_moma_DTD_Assignment-task-detail-waitting.component.html',
  styleUrls: ['./UC_moma_DTD_Assignment-task-detail-waitting.component.less'],
  providers: [
    UCMomaDTDAssignmentTaskDetailWaittingService,
    CommonService,
    ModalFormService,
    DynamicWbsService,
  ],
})
export class UCMomaDTDAssignmentTaskDetailWaittingComponent
  extends DynamicFormControlComponent
  implements OnInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicUCMomaDTDAssignmentTaskDetailWaittingModel;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private UCMomaDTDAssignmentTaskDetailWaittingService: UCMomaDTDAssignmentTaskDetailWaittingService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    this.commonService.content = this.model.content;
    this.elementRef.nativeElement.parentNode.style.height = '100%';
    this.elementRef.nativeElement.style.height = 'calc(100% - 16px)';
  }
  async loadData() {
    const res = await this.commonService
      .getInvData('task.info.get', {
        project_info: [
          {
            control_mode: '1',
            ...(this.model.content.executeContext?.bpmData?.project_info?.[0] || {}),
          },
        ],
      })
      .toPromise();
    this.wbsService.taskDetail = res.data.project_info[0];
  }
}
