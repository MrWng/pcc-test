import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
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
import { DynamicPccProblemViewHistoryModel } from 'app/implementation/model/pcc_problem_view_history/pcc_problem_view_history.model';
import { PccProblemViewHistoryService } from './pcc_problem_view_history.service';
import { CommonService } from 'app/implementation/service/common.service';
import { PccProblemHandlingService } from '../pcc-problem-handling/pcc-problem-handling.service';

@Component({
  selector: 'app-pcc-problem-view-history',
  templateUrl: './pcc_problem_view_history.component.html',
  styleUrls: ['./pcc_problem_view_history.component.less'],
  providers: [PccProblemViewHistoryService, CommonService],
})
export class PccProblemViewHistoryComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccProblemViewHistoryModel;
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
    private pccProblemViewHistoryService: PccProblemViewHistoryService,
    public commonService: CommonService,
    public zone: NgZone
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }
  get data() {
    return this.pccProblemViewHistoryService.pageData;
  }
  loading: boolean = false;
  async ngOnInit() {
    this.commonService.content = this.model.content;
    try {
      this.loading = true;
      await this.pccProblemViewHistoryService.getQuestionDetail([
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
