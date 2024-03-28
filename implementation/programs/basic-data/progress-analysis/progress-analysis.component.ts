import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import { ProgressAnalysisService } from './progress-analysis.service';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { DynamicProgressAnalysisModel } from '../../../model/progress-analysis/progress-analysis.model';

@Component({
  selector: 'app-dynamic-progress-analysis',
  templateUrl: './progress-analysis.component.html',
  styleUrls: ['./progress-analysis.component.less'],
})
export class ProgressAnalysisComponent
  extends DynamicFormControlComponent
  implements OnInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProgressAnalysisModel;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public progressAnalysisService: ProgressAnalysisService,
    public openWindowService: OpenWindowService,
    public fb: FormBuilder
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.progressAnalysisService.isShowProjectAnalysis = true;
  }

  changeToTask(): void {
    if (this.progressAnalysisService.isShowProjectAnalysis) {
      return;
    }
    this.progressAnalysisService.isShowProjectAnalysis =
        !this.progressAnalysisService.isShowProjectAnalysis;

  }

  changeToProject(): void {
    if (!this.progressAnalysisService.isShowProjectAnalysis) {
      return;
    }
    this.progressAnalysisService.isShowProjectAnalysis =
        !this.progressAnalysisService.isShowProjectAnalysis;
  }
}
