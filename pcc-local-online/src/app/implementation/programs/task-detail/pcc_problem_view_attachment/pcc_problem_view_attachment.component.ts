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
import { DynamicPccProblemViewAttachmentModel } from 'app/implementation/model/pcc_problem_view_attachment/pcc_problem_view_attachment.model';
import { PccProblemViewAttachmentService } from './pcc_problem_view_attachment.service';
import { CommonService } from 'app/implementation/service/common.service';
import { ProblemHandlingService } from '../pcc-problem-handling/components/problem-handling/problem-handling.service';
import { PccProblemHandlingService } from '../pcc-problem-handling/pcc-problem-handling.service';

@Component({
  selector: 'app-pcc-problem-view-attachment',
  templateUrl: './pcc_problem_view_attachment.component.html',
  styleUrls: ['./pcc_problem_view_attachment.component.less'],
  providers: [PccProblemViewAttachmentService, CommonService, ProblemHandlingService],
})
export class PccProblemViewAttachmentComponent
  extends DynamicFormControlComponent
  implements OnInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccProblemViewAttachmentModel;
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
    private pccProblemViewAttachmentService: PccProblemViewAttachmentService,
    public commonService: CommonService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }
  get data() {
    return this.pccProblemViewAttachmentService.pageData || {};
  }
  loading: boolean = false;
  async ngOnInit() {
    try {
      this.commonService.content = this.model.content;
      this.loading = true;
      await this.pccProblemViewAttachmentService.getQuestionDetail([
        {
          question_no: this.group.get('question_info').value.question_no,
        },
      ]);
    } catch (error) {
    } finally {
      this.loading = false;
      this.changeRef.markForCheck();
    }
  }
}
