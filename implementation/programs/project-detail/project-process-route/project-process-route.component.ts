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
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicProjectProcessRouteModel }
  from 'app/implementation/model/project-process-route/project-process-route.model';
import { CommonService } from 'app/implementation/service/common.service';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ProjectProcessRouteService } from './project-process-route.service';

@Component({
  selector: 'app-project-process-route',
  templateUrl: './project-process-route.component.html',
  styleUrls: ['./project-process-route.component.less'],
  providers: [ProjectProcessRouteService]
})

export class ProjectProcessRouteComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProjectProcessRouteModel;
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  // 项目集编号
  project_set_no: string = '';
  // 未结案项目数量
  unclosedProjectNumber: number = 1;
  isFinish: boolean = false;
  programInfo: any;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private message: NzMessageService,
    private modal: NzModalService,
    public commonService: CommonService,
    private translateService: TranslateService,
    public service: ProjectProcessRouteService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.commonService.content = this.model?.content;
    this.getProgramNumberAndInfo();
    this.getUnclosedProjectNumber();
  }



  /**
   * 获取母项目信息和项目集编号
   */
  getProgramNumberAndInfo() {
    const { projectSet_info } = this.model.content?.executeContext?.taskWithBacklogData?.bpmData ?? {};
    const { project_set_no } = projectSet_info.at(0);
    this.project_set_no = project_set_no;
    this.commonService.getInvData('bm.pisc.project.set.get', { project_set_info: [{ project_set_no }] }).subscribe((res: any): void => {
      this.programInfo = res.data?.project_set_info.at(0) ?? {};
      this.isFinish = this.programInfo.project_status === '40' || this.programInfo.project_status === '60' ? true : false;
      this.changeRef.markForCheck();
    });
  }


  /**
   * 获取未结案子项目信息数量
   */
  getUnclosedProjectNumber(): void {
    this.commonService.getInvData('bm.pisc.project.get', { project_info: [{ project_set_no: this.project_set_no }] })
      .subscribe((res: any): void => {
        const { project_info } = res.data ?? { project_info: [] };
        this.unclosedProjectNumber = 0;
        project_info?.forEach((element: any): void => {
          if (element.project_status !== '40' && element.project_status !== '60') {
            this.unclosedProjectNumber++;
          }
        });
        this.changeRef.markForCheck();
      });
  }


  /**
   * 结案
   * @returns
   */
  closeProject(): void {
    if (this.unclosedProjectNumber) {
      this.message.error(this.unclosedProjectNumber + this.translateService.instant('dj-default-个项目进行中，无法结案!'));
      return;
    }
    this.modal.confirm({
      nzContent: '<b>' + this.translateService.instant('dj-default-是否确定结案?') + '</b>',
      nzOnOk: () => {
        const actual_finish_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        const params = {
          project_set_info: [{ project_set_no: this.project_set_no, project_status: '40', actual_finish_date }]
        };
        this.commonService.getInvData('project.set.info.update', params).subscribe((res: any): void => {
          this.isFinish = true;
          this.message.success(this.translateService.instant('dj-default-提交成功'));
          this.commonService.pushDTDProcess(this.project_set_no);
          this.service.recoveryCard(this.project_set_no).subscribe(() => { });
          this.change.emit({
            type: 'application-submit',
          });
          this.changeRef.markForCheck();
          this.changeRef.detectChanges();
        });
      }
    });
  }
}
