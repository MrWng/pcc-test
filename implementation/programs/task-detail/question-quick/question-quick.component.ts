import { Component, Input, OnInit, ChangeDetectorRef, ElementRef, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout,
  DynamicFormLayoutService, DynamicFormService, DynamicFormValidationService, DynamicFormModel, cloneDeep, PostMessageDistributionService, WorkType
} from '@athena/dynamic-core';
import { QuestionQuickService } from './question-quick.service';
import { CommonService } from 'app/implementation/service/common.service';
import { APIService } from 'app/implementation/service/api.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as moment from 'moment';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { QuestionQuickModel } from '../../../model/question-quick/question-quick.model';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DwUserService } from '@webdpt/framework/user';

@Component({
  selector: 'app-dynamic-question-quick',
  templateUrl: './question-quick.component.html',
  styleUrls: ['./question-quick.component.less'],
  providers: [QuestionQuickService]
})

export class QuestionQuickComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: QuestionQuickModel;
  @Input() control: AbstractControl;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  dynamicGroup: FormGroup;
  dynamicLayout: DynamicFormLayout;
  dynamicModel: DynamicFormModel;
  disabledClick: number = 0;
  isNoAuth: boolean = false;
  enableFeedback: boolean = false;
  project_info:any=[];

  constructor(
    private translateService: TranslateService,
    private modal: NzModalService,
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public commonService: CommonService,
    public fb: FormBuilder,
    public apiService: APIService,
    public questionQuickService: QuestionQuickService,
    public postMessageDistributionService: PostMessageDistributionService,
    private userService: DwUserService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    let project_info;
    if ((this.model as any).contents) {
      project_info = (this.model as any).contents.executeContext?.taskWithBacklogData?.bpmData?.project_info;
    } else {
      project_info = this.model?.content.executeContext?.taskWithBacklogData?.bpmData?.project_info;
    }
    if (!project_info || project_info.length === 0){
      project_info = this.commonService?.content?.bpmData?.project_info
    }
    this.project_info = project_info;
    this.commonService.getMechanismParameters('enableFeedback').subscribe(({data})=>{
      this.enableFeedback = data.enableFeedback;
      this.changeRef.markForCheck();
    })
  }

  getText(content): string{
    return this.translateService.instant(content)
  }

  closeNoAuth=()=>{
    this.disabledClick = 0;
    this.isNoAuth = false;
    this.changeRef.markForCheck();
  }

  jumpFromCheck(): void {
    if(moment().valueOf() - this.disabledClick < 5000){
      return;
    }
    this.disabledClick = moment().valueOf();
    // 检查应用是否授权
    const params ={
      appid: 'FRC',
    }
    this.commonService.getInvData('bm.basc.app.auth.employee.get', params)
      .subscribe(({ data }) => {
        const { app_auth_employee_info = [] } = data;
        const eocInfo = this.userService.getUser('eoc');
        const employee = app_auth_employee_info.filter(info=>info.employee_no === eocInfo?.id);
        if(employee.length === 0){
          // 不在权限范围，开窗提示
          this.isNoAuth = true;
          this.changeRef.markForCheck();
          // this.modal.info({
          //   nzTitle:' ',
          //   nzContent: "<span class='pcc-questionModal'><em nz-icon nzType='info-circle' nzTheme='outline'></em>"+this.translateService.instant(
          //     'dj-default-无问题快反的授权，请联系管理员！'
          //   )+"</span>",
          //   nzOkText: this.translateService.instant('dj-default-我知道了'),
          //   nzCancelText: null,
          //   nzClassName: 'confirm-modal-center-sty',
          //   nzOnOk: (): void => {
          //     this.changeRef.markForCheck();
          //     this.disabledClick = 0;
          //   },
          // });
        }else {
          // 如果在权限范围内，走跳转,请求基础数据
          const {project_no,task_no} = this.project_info[0]
          const taskParams = {
            task_info: [{
              task_no,
              project_no,
              task_property: '1'
            }]
          }
          this.commonService.getInvData('bm.pisc.root.task.get', taskParams)
            .subscribe(({ data }) => {
              const {task_info=[]} = data;
              if(task_info.length > 0){
                const { project_no, project_name, root_task_no, root_task_name } = task_info[0];
                this.postMessageDistributionService.distribute({
                  type: WorkType.startProject,
                  source: 'PCC_PROJECT',
                  data: {
                    code: 'task_question_answer_mainline',
                    data: {
                      question_info: {
                        project_no,
                        project_name,
                        project_stage_no: root_task_no,
                        project_stage_name: root_task_name,
                      },
                    },
                  },
                });
              }else{
                this.modal.info({
                  nzTitle: '提示',
                  nzContent: this.translateService.instant(
                    'dj-default-无任务信息，请联系管理员！'
                  ),
                  nzOkText: this.translateService.instant('dj-default-我知道了'),
                  nzCancelText: null,
                  nzClassName: 'confirm-modal-center-sty',
                  nzOnOk: (): void => {
                    this.changeRef.markForCheck();
                    this.disabledClick = 0;
                  },
                });
              }
            });
        }
      });
  }

  translateWord(text: string): string{
    return this.translateService.instant(`dj-default-${text}`)
  }
}
