import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicTableModel,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicProjectDetailModel } from '../../../model/project-detail/project-detail.model';
import { CommonService, Entry } from '../../../service/common.service';
import { DynamicWbsService } from '../../../component/wbs/wbs.service';
import { AddSubProjectCardService } from 'app/customization/task-project-center-console/component/add-subproject-card/add-subproject-card.service';
import { WbsTabsService } from 'app/customization/task-project-center-console/component/wbs-tabs/wbs-tabs.service';

@Component({
  selector: 'app-dynamic-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.less'],
  providers: [DynamicWbsService, WbsTabsService, AddSubProjectCardService]
})
export class ProjectDetailComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProjectDetailModel;
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();
  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];
  // wbs入口
  Entry = Entry
  showWbsCard = false;


  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public wbsTabsService: WbsTabsService,
    public wbsService: DynamicWbsService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  // 项目计划入口
  ngOnInit(): void { }


  async showWbsContent(flag: boolean): Promise<void> {
    let project_no = this.model.content.executeContext.bpmData.project_info[0].project_no;
    project_no = project_no ?? this.wbsService.project_no ?? this.wbsService.projectInfo.project_no;
    if (flag && project_no) {
      this.wbsService.projectInfo = await this.wbsTabsService.getProjectInfo(project_no);
      this.changeRef.markForCheck();
    }
    this.showWbsCard = flag;
    this.wbsService.editable = false;
  }
}
