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
} from '@ng-dynamic-forms/core';
import { DynamicProjectPlanManageModel } from '../../../model/project-plan-manage/project-plan-manage.model';
import { ProjectPlanManageService } from './project-plan-manage.service';
import { CommonService } from '../../../service/common.service';
import { DynamicWbsService } from 'app/customization/task-project-center-console/component/wbs/wbs.service';
import { AddSubProjectCardService } from 'app/customization/task-project-center-console/component/add-subproject-card/add-subproject-card.service';
import { WbsTabsService } from 'app/customization/task-project-center-console/component/wbs-tabs/wbs-tabs.service';

@Component({
  selector: 'app-project-plan-manage',
  templateUrl: './project-plan-manage.component.html',
  styleUrls: ['./project-plan-manage.component.less'],
  providers: [ProjectPlanManageService, DynamicWbsService, WbsTabsService, AddSubProjectCardService, CommonService],
})
export class ProjectPlanManageComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProjectPlanManageModel;
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
    private projectPlanManageService: ProjectPlanManageService,
    public commonService: CommonService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() { }
}
