import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, FormGroupName, Validators } from '@angular/forms';
import {
  cloneDeep,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
  PluginLanguageStoreService,
  reportedUserBehavior,
  UserBehaviorOperation,
} from '@ng-dynamic-forms/core';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { DragDropService } from 'app/customization/task-project-center-console/directive/dragdrop/dragdrop.service';
import { CommonService, Entry } from 'app/customization/task-project-center-console/service/common.service';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AthMessageService } from 'ngx-ui-athena/src/components/message';
import { fromEvent, Observable, Subject, Subscription } from 'rxjs';
import { WbsTabsService } from '../../../wbs-tabs/wbs-tabs.service';
import { DynamicWbsService } from '../../wbs.service';
import { ApprovalProgressComponent } from '../task-detail/components/approval-progress/approval-progress.component';

@Component({
  selector: 'app-wbs-header',
  templateUrl: './wbs-header.component.html',
  styleUrls: ['./wbs-header.component.less'],
})
export class WbsHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  // wbs入口
  @Input() source: Entry = Entry.card
  @Output() initWbsData: EventEmitter<any> = new EventEmitter();
  @Output() changeTemp = new EventEmitter();
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();
  @Output() refreshWbs = new EventEmitter<any>();

  @ViewChild('changeReason') changeReason: any;
  @ViewChild('inputElement', { static: false }) inputElement?: ElementRef;
  // 可清理的资源
  subscription: Subscription = new Subscription();
  public destroy$ = new Subject<void>();
  // wbs入口
  Entry = Entry

  validateForm: FormGroup;

  promptMessage: boolean = false;
  // 是否展示专案模板维护
  fullScreenStatus: boolean = false;
  isUpdateDateStatus: boolean = false;
  isContinueDelayDaysVisible: boolean = false;
  accessibleStatus: boolean = false;
  // 保存模板
  isSaveModalVisible: boolean = false;
  isDelay = '1';
  delayType = 1;
  delayDays: any;
  taskMemberInfo: any[] = [];

  // 1 PM独自完成 2 协同计划 3 混合计划（两者都有）
  projectPlanningProcessType: string = '-1';
  // 被选中的协同计划一级任务
  collaborativePlanCardList: any[] = [];
  collaborativeAllChecked: boolean = false;
  collaborativePlanStatus: boolean = false;
  isCollaborativePlan: boolean = false;
  isUseTemplateDateVisible: boolean = false;

  selectedTemplateType: string;

  // 使用模板
  isUseTemplateVisible: boolean = false;
  isUseEquipmentTemplateVisible: boolean = false;
  useTemplateParams: any;

  checkReviewTaskPlanned: boolean = false;

  indeterminate: boolean = true;

  planRearrangeBaseDate: any;

  modalTitle: string = '';
  modalContentInfo: string = '';
  reasonType: string = '';
  reasonFlag: boolean = false;
  loading: boolean = false;

  templateTypeOption: Array<any> = [
    { label: this.translateService.instant('dj-default-职能模板'), value: 'functionTem' },
    { label: this.translateService.instant('dj-default-设备模板'), value: 'equipmentTem' },
  ];
  projectId: any;
  smartDataUrl: any;
  isShowApprove = true;


  constructor(
    private http: HttpClient,
    protected changeRef: ChangeDetectorRef,
    public commonService: CommonService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private modalService: NzModalService,
    private translateService: TranslateService,
    private messageService: NzMessageService,
    private userService: DwUserService,
    protected dragDropService: DragDropService,
    public wbsTabsService: WbsTabsService,
    public openWindowService: OpenWindowService,
    public fb: FormBuilder,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private pluginLanguageStoreService: PluginLanguageStoreService,
    private modal: NzModalService,
    private athMessageService: AthMessageService,
  ) { }



  ngOnInit() {
    this.getProjectIdForQueryApprove();
    this.wbsService.showExcel = false;
    // const { bpmData } = this.commonService.content.executeContext?.taskWithBacklogData || {};
    // this.projectPlanningProcessType = bpmData?.projectPlanningProcessType || '-1';
    this.getProjectPlanFlow();
    this.validateForm = this.fb.group({
      project_template_name: [null, [Validators.required]],
    });
    this.addListener();
    this.getHasStartEnd();
    this.checkReviewTask();
    this.getAccessibleData();

  }

  get isApproveStatus() {
    return this.wbsService.projectInfo.approve_status === 'N' && this.isShowApprove;
  }

  getProjectIdForQueryApprove(): void {
    this.isShowApprove = false;
    if (this.wbsService.projectInfo.approve_status !== 'N') {
      return;
    }
    const params = {
      eocId: {},
      tenantId: this.userService.getUser('tenantId'),
      bkInfo: [
        {
          entityName: 'project_d',
          bk: {
            project_no: this.wbsService.project_no,
          }
        }
      ],
      taskStates: [1, 2, 3, 4, 5],
      activityStates: [1, 2, 3, 4, 5, 6],
    };
    this.wbsService.queryProjectId(params).subscribe((res: any) => {
      const subTasksItem = res.data[0]?.subTasks?.find((el) => {
        return el.state === 1 && el.tmpId === 'projectCenterConsoleStopProject_userProject';
      });
      subTasksItem?.activities?.forEach(element => {
        if (element.actTmpId === 'pccStopProjectApprove') {
          this.wbsService.projectInfo.projectId = element.actId;
          console.log(this.wbsService.projectInfo.projectId);
        }
      });
      this.isShowApprove = true;
      this.changeRef.markForCheck();
    });
  }


  // 项目计划流程
  getProjectPlanFlow() {
    this.commonService.getMechanismParameters('projectPlanFlow').toPromise().then(res => {
      // 1: PM独自完成项目计划(不需协同计划)
      // 2: 协同计划(一定需要协同计划)
      // 3: 混合计划(两种同时存在)
      this.projectPlanningProcessType = res.data?.projectPlanFlow ? res.data?.projectPlanFlow : '-1';
      this.changeRef.markForCheck();
    });
  }

  judgeForProjectPlanFlow1() {
    // [项目计划流程]是： 1.PM独自完成，且 [项目状态]是： 10 或 30 ==> （隐藏）协同计划排定按钮
    return (this.projectPlanningProcessType === '1')
      && ((this.wbsService.projectInfo?.project_status === '10') || (this.wbsService.projectInfo?.project_status === '30'))
      || (this.wbsService.projectInfo?.project_status === '20')
      || (this.wbsService.projectInfo?.project_status === '50');
  }

  judgeForProjectPlanFlow2() {
    // [项目计划流程]是： 不是1.PM独自完成，且 没有可排定的任务 和 [项目状态]是： 30 ==> （置灰）协同计划排定按钮
    // this.wbsService.projectInfo?.project_status !== '10' || !this.wbsService.firstTaskCardList.length
    return (this.projectPlanningProcessType !== '1') && !this.wbsService.firstTaskCardList.length;
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.destroySubscription();
    this.removeListeners();
  }

  private removeListeners(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private destroySubscription(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  /**
 * 监听按键显示下载excel
 */
  addListener(): void {
    this.subscription.add(
      fromEvent(document, 'keydown').subscribe((e: KeyboardEvent) => {
        if (e.altKey && e.ctrlKey && e.which === 69) {
          this.wbsService.showExcel = true;
          this.changeRef.markForCheck();
          this.changeRef.detectChanges();
        }
      }
      ));
  }

  /**
 * 是否显示设备模版
 */
  getHasStartEnd() {
    const tenantId = this.userService.getUser('tenantId');
    this.commonService.getHasGroundEnd(tenantId, 'hasGroundEnd').subscribe((res: any): void => {
      if (res.data.hasGroundEnd === 'N') {
        this.wbsService.hasGroundEnd = this.wbsTabsService.hasGroundEnd = 'N';
        this.templateTypeOption = [
          { label: this.translateService.instant('dj-default-职能模板'), value: 'functionTem' },
        ];
        this.changeRef.markForCheck();
      } else {
        this.wbsService.hasGroundEnd = this.wbsTabsService.hasGroundEnd = 'Y';
      }
    });
  }



  /**
 * 根据前端机制参数判定是否必须维护项目检讨类型
 */
  checkReviewTask(): void {
    const { bpmData } = this.commonService.content.executeContext?.taskWithBacklogData || {};
    this.wbsService
      .checkReviewTaskPlanned('checkReviewTaskPlanned', this.userService.getUser('tenantId'))
      .subscribe((res: any): void => {
        this.checkReviewTaskPlanned =
          bpmData?.checkReviewTaskPlanned || res?.data?.checkReviewTaskPlanned;
        if (this.checkReviewTaskPlanned && this.source === Entry.maintain) {
          this.wbsService.checkTask('', this.source).subscribe((resultData: any): void => {
            const hasReviewTasks = resultData?.data?.project_info?.find((item: any): any => {
              return item.task_category === 'REVIEW';
            });
            this.promptMessage = hasReviewTasks ? false : true;
            this.changeRef.markForCheck();
          });
        }
      });
  }

  toFullScreen(): void {
    this.wbsService.fullScreenStatus = !this.wbsService.fullScreenStatus;
    this.changeRef.markForCheck();
  }

  /**
 * 结案
 */
  closeTheCase(): void {
    if (this.wbsService.projectInfo?.project_status === '30') {
      this.modalService.confirm({
        nzTitle: this.translateService.instant('dj-c-提示'),
        nzContent: this.translateService.instant('dj-default-确定结案吗'),
        nzCancelText: this.translateService.instant('dj-c-取消'),
        nzOkText: this.translateService.instant('dj-c-确定'),
        nzClassName: 'confirm-modal-center-sty',
        nzOnOk: (): void => {
          this.caseApi('40', this.translateService.instant('dj-default-结案成功'));
        },
      });
    }
  }

  /**
 * 指定结案
 */
  designatedProject(): void {
    const projectStatus = this.wbsService.projectInfo?.project_status;
    if (projectStatus !== '30' && projectStatus !== '50') {
      return;
    }
    this.modalTitle = this.translateService.instant('dj-c-提示');
    this.modalContentInfo = this.translateService.instant('dj-default-指定结案confirm-nzContent');
    this.reasonType = 'designated';
    this.changeReason.showModal();
  }

  reasonCancelInput(flag) {
    this.reasonFlag = flag;
    this.reasonType = '';
  }

  reasonInput(info) {
    let status = '';
    let title = '';
    let code = '';
    let variablesType = '';
    if (info) {
      if (this.reasonType === 'suspend') {
        status = '50';
        title = 'dj-pcc-暂停专案';
        code = '-PCC_TAB006-PCC_BUTTON002';
        variablesType = 'stopProject'; // 暂停专案
      }
      if (this.reasonType === 'designated') {
        status = '60';
        title = 'dj-default-指定结案';
        code = '-PCC_TAB006-PCC_BUTTON003';
        variablesType = 'closeProject';  // 指定结案
      }
      if (this.reasonType && status && title && code) {
        // this.loading = true;
        this.wbsService.bmPiscProjectTypeGet({ project_type_no: this.wbsService.projectInfo?.project_type_no }).then((result) => {
          const params = {
            project_info: [{
              project_no: this.wbsService.project_no,
              project_status: status,
              sync_steady_state: this.wbsService.projectInfo.project_property === '10' ? 'N' : this.wbsService.hasGroundEnd,
              is_approve: result.project_status_u_is_approve,
              approve_status: result.project_status_u_is_approve ? 'N' : 'V',
              change_reason: info
            }]
          };

          const project_info = [{
            project_no: this.wbsService.project_no,
            project_name: this.wbsService.projectInfo.project_name,
            plan_start_date: this.wbsService.projectInfo.plan_start_date,
            plan_finish_date: this.wbsService.projectInfo.plan_finish_date,
            project_type_no: this.wbsService.projectInfo.project_type_no,
            taskPersonInCharge: this.userService.getUser('userId'),
            change_reason: info,
            eoc_company_id: this.commonService.content?.executeContext?.businessUnit?.eoc_company_id
          }];
          const dispatchData = [{ project_no: this.wbsService.project_no }];

          // 签核否： true.需签核;false.无需签核
          if (result.project_status_u_is_approve) {
            if (this.reasonType === 'suspend') {
              this.commonService.getInvData('bm.pisc.project.status.update', {
                project_info: [{
                  project_no: this.wbsService.project_no,
                  project_status: '50',
                  is_approve: true,
                  approve_status: 'N',
                  change_reason: info
                }]
              })
                .subscribe((resUpdate): void => {
                  this.wbsService.projectInfo.approve_status = 'N';
                  if (resUpdate?.data?.project_info && resUpdate.data.project_info[0]?.error_msg) {
                    // this.loading = false;
                    this.messageService.error(resUpdate.data.project_info[0].error_msg);
                    this.changeRef.markForCheck();
                    return;
                  } else {
                    this.wbsService.suspendOrStopProject('Athena', variablesType, true, project_info, dispatchData).subscribe(res => {
                      setTimeout(() => {
                        this.initWbsData.emit();
                        // this.loading = false;
                        this.messageService.success(this.translateService.instant('dj-default-已执行暂停项目或暂停项目送签！'));
                        this.getProjectIdForQueryApprove();
                        this.wbsService.initWbsShow.next(true);
                        this.changeRef.markForCheck();
                      }, 500);
                    });
                  }
                });
            }
            if (this.reasonType === 'designated') {
              this.suspendOrStopProjectUpdateStatus('60', params, variablesType, true, project_info, dispatchData);
            }
          } else {
            if (this.reasonType === 'suspend') {
              this.suspendOrStopProjectUpdateStatus('50', params);
            }
            if (this.reasonType === 'designated') {
              this.suspendOrStopProjectUpdateStatus('60', params, variablesType, false, project_info, dispatchData);
            }
          }
        });

        const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
          operation: UserBehaviorOperation.CLICK_BUTTON,
          attachData: {
            name: this.pluginLanguageStoreService.getAllI18n(title),
            appCode: 'PCC',
            code: 'PCC-' + this.userBehaviorCommService.commData.workType + code,
          },
        });
        reportedUserBehavior(behaviorCommData);
      }
    }
  }

  suspendOrStopProjectUpdateStatus(status, params, variablesType?: string, isSign?: boolean, project_info?: any, dispatchData?: any): void {
    this.commonService.getInvData('project.status.info.update', params, this.wbsService.projectInfo.eoc_company_id)
      .subscribe((res) => {
        this.wbsService.projectInfo.approve_status = params?.project_info[0]?.approve_status;
        if (res.data.project_info[0]?.task_name_mistake_message) {
          // this.loading = false;
          this.messageService.error(res.data.project_info[0].task_name_mistake_message);
          this.changeRef.markForCheck();
          return;
        }
        if (status === '60') {
          this.wbsService.suspendOrStopProject('Athena', variablesType, isSign, project_info, dispatchData).subscribe(res2 => {
            setTimeout(() => {
              this.initWbsData.emit();
              // this.loading = false;
              this.messageService.success(this.translateService.instant('dj-default-已执行指定结案或指定结案送签！'));
              this.wbsService.initWbsShow.next(true);
              this.getProjectIdForQueryApprove();
              this.changeRef.markForCheck();
            }, 500);
          });
        } else {
          this.wbsService.suspendCard(this.wbsService.project_no).subscribe(res2 => {
            setTimeout(() => {
              this.initWbsData.emit();
              // this.loading = false;
              this.messageService.success(this.translateService.instant('dj-default-已执行暂停项目或暂停项目送签！'));
              this.wbsService.initWbsShow.next(true);
              this.getProjectIdForQueryApprove();
              this.changeRef.markForCheck();
            }, 500);
          });
        }
      });
  }

  /**
 * 暂停专案
 */
  suspendProject(): void {
    this.modalTitle = this.translateService.instant('dj-c-提示');
    this.modalContentInfo = this.translateService.instant('dj-pcc-确定暂停专案吗');
    this.reasonType = 'suspend';
    this.changeReason.showModal();
  }

  /**
 * 继续专案
 */
  continueProject(): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: this.translateService.instant('dj-pcc-确定继续专案吗'),
      nzCancelText: this.translateService.instant('dj-c-取消'),
      nzOkText: this.translateService.instant('dj-c-确定'),
      nzClassName: 'confirm-modal-center-sty',
      nzOnOk: (): void => {
        const today = moment(new Date()).format('YYYY-MM-DD');
        this.delayDays = moment(today).diff(
          moment(this.wbsService.projectInfo?.pause_date),
          'days'
        );
        this.isContinueDelayDaysVisible = true;
        this.changeRef.markForCheck();
      },
    });
  }

  /**
   * 暂停专案/继续专案/指定结案/结案
   * @param status 状态 40: 结案； 60：指定结案
   * @param message 成功后的通知
   */
  caseApi(status, message?): void {
    const params = {
      project_info: [
        {
          project_no: this.wbsService.project_no,
          postpone_days: status === '30' || this.delayType === 2 ? this.delayDays.toString() : '0',
          is_update_date: this.isUpdateDateStatus,
          advance_lag_type: this.isDelay,
          project_status: status,
          sync_steady_state:
            this.wbsService.projectInfo.project_property === '10'
              ? 'N'
              : this.wbsService.hasGroundEnd,
        },
      ],
    };
    this.commonService
      .getInvData(
        'project.status.info.update',
        params,
        this.wbsService.projectInfo.eoc_company_id
      )
      .subscribe(
        (res) => {
          if (status === '40') {
            if (res.data.project_info[0]?.task_name_mistake_message) {
              this.messageService.error(
                res.data.project_info[0].task_name_mistake_message
              );
              this.changeRef.markForCheck();
              return;
            }
            if (this.wbsService.modelType.indexOf('DTD') !== -1) {
              const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
              const param = [
                {
                  project_info: [
                    {
                      project_no: this.wbsService.project_no,
                      new_project_no: '',
                    },
                  ],
                },
              ];
              this.wbsService
                .postProcessNew(
                  DwUserInfo.acceptLanguage,
                  this.userService.getUser('userId'),
                  param,
                  this.commonService.content
                )
                .subscribe();
            } else {
              const handle_mode = status === '40' ? '2' : '3';
              const param = [
                {
                  project_no: this.wbsService.project_no,
                  new_project_no: '',
                  handle_mode: handle_mode,
                },
              ];
              this.wbsService
                .postProcess(
                  this.userService.getUser('tenantId'),
                  param,
                  this.commonService.content
                )
                .subscribe();
            }
          }
          if (status === '30' || this.delayType === 2) {
            if (
              res.code === 0 &&
              res.data.project_info?.length &&
              res.data.project_info[0]?.task_name_mistake_message
            ) {
              this.messageService.error(
                this.translateService.instant(res.data.project_info[0].task_name_mistake_message)
              );
              return;
            }
          }
          if (status === '30') {
            const content = this.commonService.content;
            if (this.wbsService.modelType.indexOf('DTD') !== -1) {
              const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
              const param = [
                {
                  project_no: this.wbsService.project_no,
                },
              ];
              this.wbsService
                .postContinueProcessNew(
                  DwUserInfo.acceptLanguage,
                  this.userService.getUser('userId'),
                  param,
                  content
                )
                .subscribe();
            } else {
              const param = [
                {
                  project_no: this.wbsService.project_no,
                },
              ];
              this.wbsService
                .postContinueProcess(this.userService.getUser('tenantId'), param, content)
                .subscribe();
            }
          }

          this.wbsService.initWbsShow.next(true);
          this.changeRef.markForCheck();
          if (message) {
            this.messageService.success(message);
          }
          setTimeout(() => {
            this.initWbsData.emit();
          }, 300);
        }
      );
  }

  closeTheCaseError(errorMessage): void {
    this.modalService.info({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: errorMessage,
      nzOkText: this.translateService.instant('dj-c-确定'),
      nzClassName: 'confirm-modal-center-sty',
      nzOnOk: (): void => { },
    });
  }

  /**
   * 所有任务自动延展
   */
  async showDelayDays(): Promise<any> {
    const projectStatus = this.wbsService.projectInfo?.project_status;
    if (this.source !== Entry.maintain && Number(projectStatus) !== 10) {
      const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
      this.wbsService.needRefresh = data.check_result;
    }
    if (this.wbsService.needRefresh) {
      this.athMessageService.error(this.wbsService.needRefresh);
      this.wbsService.changeWbs$.next();
      return;
    }
    if (projectStatus !== '10' && projectStatus !== '20' && projectStatus !== '30') {
      return;
    }
    if (projectStatus === '30') {
      if (this.wbsService?.project_no) {
        this.commonService.getCollaborationCard(this.wbsService.project_no).subscribe(res => {
          const returnInfo = res.data?.assist_schedule_info ?? res.data?.task_info;
          if (returnInfo && returnInfo?.length) {
            this.modal.info({
              nzTitle: this.translateService.instant('dj-c-提示'),
              nzContent: this.translateService.instant('dj-pcc-存在协同任务未完成，不可使用所有任务自动延展功能！'),
              nzOkText: this.translateService.instant('dj-default-我知道了'),
              nzClassName: 'confirm-modal-center-sty',
              nzOnOk: (): void => {
                this.changeRef.markForCheck();
              },
              nzOnCancel: (): void => {
                this.changeRef.markForCheck();
              }
            });
          } else {
            this.delayDays = '';
            this.delayType = 2;
            this.isContinueDelayDaysVisible = true;
            this.changeRef.markForCheck();
          }
        });
      }
    } else {
      this.delayDays = '';
      this.delayType = 2;
      this.isContinueDelayDaysVisible = true;
      this.changeRef.markForCheck();
    }

  }


  /**
 * 设置延展天数
 */
  extendDays(value: string): void {
    const reg = /^-?(0|[1-9][0-9]*)?$/;
    if ((!isNaN(+value) && reg.test(value)) || value === '') {
      this.delayDays = value;
    }
    this.inputElement!.nativeElement.value = this.delayDays;
  }

  /**
 * 确定所有任务自动延展
 */
  continueDelayDays(): void {
    this.isContinueDelayDaysVisible = false;
    this.delayDays = this.delayDays ? this.delayDays : '0';
    if (this.isDelay === '-1') {
      this.isUpdateDateStatus = false;
      this.getNewStatus();
    } else {
      this.isUpdateDate();
    }
    if (this.delayType !== 1) {
      const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
        operation: UserBehaviorOperation.CLICK_BUTTON,
        attachData: {
          name: this.pluginLanguageStoreService.getAllI18n('dj-default-所有计划自动延展：'),
          appCode: 'PCC',
          code:
            'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON006',
        },
      });
      reportedUserBehavior(behaviorCommData);
    }
  }

  /**
 * 自动延展后获取项目最新状态
 */
  getNewStatus() {
    if (this.delayType === 1) {
      this.caseApi('30', this.translateService.instant('dj-pcc-继续专案成功'));
    } else {
      const params = {
        project_info: [
          {
            project_no: this.wbsService.project_no,
          },
        ],
      };
      this.commonService
        .getInvData('bm.pisc.project.get', params)
        .subscribe((res: any): void => {
          const status = res.data.project_info[0].project_status;
          if (Number(status) > 10) {
            this.wbsService.projectInfo.project_status = status;
          }
          this.caseApi(
            res.data.project_info[0].project_status,
            this.translateService.instant('dj-default-所有任务自动延展成功')
          );
          if (Number(status) !== 10) {
            this.wbsService.needRefresh = this.translateService.instant('dj-default-刷新');
          }
        });
    }
  }

  /**
 * 自动延展后是否更新
 * 继续专案和任务延展都会调用此方法
 */
  isUpdateDate(): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: this.translateService.instant('dj-pcc-是否一并更新专案预计完成日？'),
      nzCancelText: this.translateService.instant('dj-pcc-否'),
      nzOkText: this.translateService.instant('dj-pcc-是'),
      nzClassName: 'confirm-modal-center-sty',
      nzMaskClosable: true,
      nzOnOk: (): void => {
        this.isUpdateDateStatus = true;
        this.getNewStatus();
      },
      nzOnCancel: (): void => {
        this.isUpdateDateStatus = false;
        this.getNewStatus();
      },
    });
  }

  lookSignOffProgress(): void {
    this.modalService.create({
      nzTitle: null,
      nzFooter: null,
      nzContent: ApprovalProgressComponent,
      nzOkText: null,
      nzCancelText: null,
      nzComponentParams: {
        taskOrProjectId: this.wbsService.projectInfo.projectId,
      },
      nzWidth: 550,
      nzClassName: 'signOffProgress-modal-center-sty',
      nzNoAnimation: true,
      nzClosable: true,
      nzOnOk: (): void => { },
    });
  }

  /**
 * 取消所有任务自动延展
 */
  continueDelayDaysCancel(): void {
    this.isContinueDelayDaysVisible = false;
  }

  /**
 * 查看甘特图
 */
  lookGatte(): void {
    this.wbsService.showGantt = true;
    this.wbsService.showPert = false;
    const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
      operation: UserBehaviorOperation.CLICK_BUTTON,
      attachData: {
        name: this.pluginLanguageStoreService.getAllI18n('dj-default-查看甘特图'),
        appCode: 'PCC',
        // workType: 作业类型，如：任务：TASK，项目：PROJECT，基础资料录入：BASE-DATA，报表：REPORT
        code: 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB006-PCC_BUTTON001',
      },
    });
    reportedUserBehavior(behaviorCommData);
  }

  /**
 *查看Pert图
 */
  lookPert(): void {
    this.wbsService.showPert = true;
    this.wbsService.showGantt = false;
  }

  /**
 * 项目计划维护 保存模板按钮权限获取
 */
  getAccessibleData(): void {
    this.wbsService.postAccessible().subscribe((res: any) => {
      this.accessibleStatus = res.data[0].activityAccessibleList[0].access === 'forbidden';
      this.changeRef.markForCheck();
    });
  }

  /**
 * 保存为模板
 */
  saveToTemplate(): void {
    this.isSaveModalVisible = true;
  }

  /**
 * 确认保存为模板
 * @returns
 */
  certainSaveTemplate(): any {
    if (this.validateForm.valid) {
      this.taskMemberInfo = [];
      this.getTaskMemberInfo(this.wbsService.pageDatas);
      const paras = {
        query_condition: 'ALL',
        task_info: [{ project_no: this.wbsService.project_no, }]
      };
      // [3.2]
      this.commonService.getInvData('bm.pisc.task.get', paras)
        .subscribe((result: any): void => {
          if (result && result.data) {
            const taskInfo = result.data.task_info;
            taskInfo.forEach(item => {
              // 规格调整1：是否已发任务卡、是否已提醒逾期、任务状态、完成率，不用传
              delete item.actual_days;
              delete item.is_issue_task_card;
              delete item.is_overdue_reminder;
              delete item.task_status;
              delete item.complete_rate;
              // 规格调整2：任务属性、报工说明、（实际开始日期、实际结束日期，属于项目信息，目前没有以防接口后面调整），不用传
              delete item.task_property;
              delete item.report_description;
              delete item.actual_start_date;
              delete item.actual_finish_date;
              item.liable_person_role_name = '';
              item.liable_person_role_no = '';
              item.task_member_info.forEach(element => {
                element.executor_role_no = '';
                element.executor_role_name = '';
              });
            });
            const project_template_info = {
              project_template_no: '',
              project_template_name: this.validateForm.getRawValue().project_template_name,
              project_no: this.wbsService.project_no,
              project_type_no: this.wbsService.projectInfo.project_type_no,
              task_info: taskInfo,
            };
            const params = {
              data_source: '2',
              project_template_info: [project_template_info],
            };
            // spring 3.1 更换api名称 [入参、出参]：'project.template.info.create' ==> 'bm.pisc.project.template.create'
            this.commonService.getInvData('bm.pisc.project.template.create', params).subscribe((res) => {
              if (res.code === 0) {
                if (res.data.project_template_info[0]?.error_msg) {
                  this.messageService.error(res.data.project_template_info[0].error_msg);
                  return;
                }
                this.messageService.success(this.translateService.instant(`dj-default-保存成功！`));
                this.validateForm.get('project_template_name').setValue('');
                this.isSaveModalVisible = false;
                this.changeRef.markForCheck();
              }
            });
          }
        }, (err) => { });
    }
  }

  /**
 * 获取保存模板数据
 */
  getTaskMemberInfo(list: any): void {
    if (list?.length) {
      list.forEach((item: any): void => {
        const everyTaskInfo = {
          project_no: this.wbsService.project_no,
          task_no: item.task_no,
          task_name: item.task_name,
          upper_level_task_no: item.upper_level_task_no,
          is_milepost: item.is_milepost,
          milepost_desc: item.milepost_desc,
          workload_qty: item.workload_qty,
          plan_start_date: item.plan_start_date,
          plan_finish_date: item.plan_finish_date,
          liable_person_code: item.liable_person_code,
          liable_person_department_code: item.liable_person_department_code,
          liable_person_department_name: item.liable_person_department_name,
          liable_person_name: item.liable_person_name,
          liable_person_role_no: item.liable_person_role_no ? item.liable_person_role_no : '',
          liable_person_role_name: item.liable_person_role_name ? item.liable_person_role_name : '',
          remarks: item.remarks,
          is_attachment: item.is_attachment,
          is_approve: item.is_approve,
          sequence: item.sequence,
          eoc_company_id: item.eoc_company_id,
          eoc_site_id: item.eoc_site_id,
          eoc_region_id: item.eoc_region_id,
          workload_unit: item.workload_unit,
          task_dependency_info: item.task_dependency_info || [],
          ar_stage_no: item.ar_stage_no || '',
          ar_stage_name: item.ar_stage_name || '',
          task_member_info: this.formatMember(item),
          task_template_no: item.task_template_no,
          task_template_name: item.task_template_name,
          attachment_remark: item.attachment_remark,
          plan_work_hours: item.plan_work_hours,
          required_task: item.required_task,
          is_need_doc_no: item.is_need_doc_no,
          task_classification_name: item.task_classification_name,
          task_classification_no: item.task_classification_no,
          task_proportion: item.task_proportion,
          main_unit: item.main_unit,
          second_unit: item.second_unit,
          plan_main_unit_value: item.plan_main_unit_value,
          plan_second_unit_value: item.plan_second_unit_value,
          standard_work_hours: item.standard_work_hours,
          standard_days: item.standard_days,
          difficulty_level_no: item.difficulty_level_no,
        };
        this.taskMemberInfo.push(everyTaskInfo);
        if (item?.children?.length) {
          this.getTaskMemberInfo(item.children);
        }
      });
    }
  }

  /**
 * 处理里层task_member_info
 */
  formatMember(item: any): { project_no: any; task_no: any; executor_no: string }[] {
    const { task_member_info = [] } = item;
    if (task_member_info?.length > 0) {
      return task_member_info.map((infoItem: any): void => {
        return {
          ...infoItem,
          task_no: item.task_no,
        };
      });
    } else {
      return [
        {
          project_no: this.wbsService.project_no,
          task_no: item.task_no || '',
          executor_no: '',
        },
      ];
    }
  }

  /**
 * 取消保存为模板
 */
  cancelSaveTemplate(): void {
    this.validateForm.get('project_template_name').setValue('');
    this.isSaveModalVisible = false;
  }

  /**
 * 获取计划排定数据
 * @param collaborativePlanCardList
 */
  changePlanCardList(collaborativePlanCardList: Array<any>): void {
    if (this.collaborativePlanCardList.every((item) => !item.checked)) {
      this.collaborativeAllChecked = false;
      this.indeterminate = false;
    } else if (this.collaborativePlanCardList.every((item) => item.checked)) {
      this.collaborativeAllChecked = true;
      this.indeterminate = false;
    } else {
      this.indeterminate = true;
    }
  }

  /**
 * 协同计划排定
 * @returns
 */
  collaborativePlan(): void {
    if (this.wbsService.projectInfo?.project_status === '30') {
      this.commonService.getTaskInfo(this.wbsService.project_no, this.source).subscribe(
        (value) => {
          const project_info = value.data?.project_info ?? [];
          this.wbsService.firstTaskCardList = project_info.filter(task => {
            return task.liable_person_code && task.plan_start_date && task.plan_finish_date
              && (task.complete_rate < 1) && (task.upper_level_task_no === task.task_no);
          });
          this.changeRef.markForCheck();
          this.showCollaborationModal();
        });
    } else {
      // 启动前(项目状态=10.未开始)
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(
        (task: any): void => task.liable_person_code && task.plan_start_date && task.plan_finish_date
      );
      this.showCollaborationModal();
    }
  }

  /**
 * 协同计划排定
 * @returns
 */
  showCollaborationModal(): void {
    this.collaborativeAllChecked = false;
    if (this.judgeForProjectPlanFlow1() || this.judgeForProjectPlanFlow2()) {
      return;
    }
    this.modalService.confirm({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: this.translateService.instant('dj-default-是否确认协同计划排定'),
      nzCancelText: this.translateService.instant('dj-c-取消'),
      nzOkText: this.translateService.instant('dj-c-确定'),
      nzClassName: 'confirm-modal-center-sty',
      nzOnOk: (): void => {
        this.isCollaborativePlan = true;
        this.getPlanCardList();
        this.changeRef.markForCheck();
      },
    });
  }

  getPlanCardList(): void {
    const tempTaskList = cloneDeep(this.wbsService.firstTaskCardList);
    this.collaborativePlanCardList = tempTaskList.map((task: any): any => {
      return {
        label: task.task_name,
        value: task.task_no,
        task_name: task.task_name,
        task_no: task.task_no,
        project_no: task.project_no,
        checked: false,
      };
    });
  }

  /**
 * 请选择需要协同排定的一级计划
 */
  updateAllChecked(): void {
    this.indeterminate = false;
    if (this.collaborativeAllChecked) {
      this.collaborativePlanCardList = this.collaborativePlanCardList.map((item) => {
        return {
          ...item,
          checked: true,
        };
      });
    } else {
      this.collaborativePlanCardList = this.collaborativePlanCardList.map((item) => {
        return {
          ...item,
          checked: false,
        };
      });
    }
  }

  /**
 * 确定设置协同排定
 */
  createCollaborativePlan(): void {
    this.wbsService.hasCollaborationCard = true;
    const teamwork_plan_days =
      this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData
        .coordinate_arrange_days;
    const tempList = this.collaborativePlanCardList.filter((item: any) => item.checked);
    const params = tempList.map((task: any): any => {
      return {
        task_no: task.task_no,
        project_no: task.project_no,
        teamwork_plan_days: Number(teamwork_plan_days),
      };
    });
    this.isCollaborativePlan = false;
    // 3.2 发起协同计划排定，定制不做修改，调用流程，由标准做修改
    this.commonService
      .getInvData('teamwork.task.plan.info.create', { task_info: params })
      .subscribe((res) => {
        if (res.code === 0) {
          this.changeRef.markForCheck();
          if (!res.data.task_info.length) {
            return;
          }
          // dtd||bpm引擎发起流程
          if (this.wbsService.modelType.indexOf('DTD') !== -1) {
            const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
            const id = this.userService.getUser('userId');
            const postParams = res.data.task_info.map((task: any): any => {
              return {
                responsible_person_no: task.liable_person_code,
                responsible_person_name: task.liable_person_name,
                project_no: task.project_no,
                assist_schedule_seq: task.teamwork_plan_seq,
                new_project_no: '',
                task_no: task.task_no // 配合标准前端调整，增加入参：当前协同排定任务的一级计划
              };
            });
            const param = [
              {
                assist_schedule_info: postParams,
              },
            ];
            this.wbsService
              .postCollaborativePlanProcessNew(
                DwUserInfo.acceptLanguage,
                id,
                param,
                this.commonService.content
              )
              .subscribe();
          } else {
            const param = res.data.task_info.map((task: any): any => {
              return {
                liable_person_code: task.liable_person_code,
                project_no: task.project_no,
                task_no: task.task_no,
                teamwork_plan_seq: task.teamwork_plan_seq,
              };
            });
            const tenantId = this.userService.getUser('tenantId');
            this.wbsService
              .postCollaborativePlanProcess(tenantId, param, this.commonService.content)
              .subscribe();
          }
          tempList.forEach((listItem: any): void => {
            this.wbsService.pageDatas.forEach((pageDatasItem: any) => {
              if (listItem.task_no === pageDatasItem.task_no) {
                pageDatasItem.noEdit = true;
                console.log('3');

                if (!pageDatasItem.isCollaborationCard) {
                  pageDatasItem.isCollaborationCard = true;
                  // // 查找当前协同树的所有的任务卡
                  // const finder = this.wbsService.findChildrenTaskInfo(pageDatasItem.task_no);
                  // const arrNo = [];
                  // // 查找当前协同树的所有的任务卡task_no
                  // this.wbsService.getOneGroupTaskNo(finder[0], arrNo);
                  // this.wbsService.collaborationTaskNoList.push(...arrNo);
                }

              }
            });
          });
          this.changeRef.markForCheck();
        }
      });
    const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
      operation: UserBehaviorOperation.CLICK_BUTTON,
      attachData: {
        name: this.pluginLanguageStoreService.getAllI18n('dj-pcc-协同计划排定'),
        appCode: 'PCC',
        code: 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON007',
      },
    });
    reportedUserBehavior(behaviorCommData);
  }

  /**
 * 取消协同计划排定
 */
  collaborativeHandleCancel(): void {
    this.isCollaborativePlan = false;
    this.changeRef.markForCheck();
  }

  /**
 * 点击选择模板
 */
  templateTypeFocus(): void {
    this.selectedTemplateType = '';
  }

  /**
 * 选择模板时
 * @param $event 1：职能模板 2：设备模板
 */
  templateTypeChange($event: string): void {
    this.selectedTemplateType = $event;
    if ($event === 'functionTem') {
      this.useTemplateThen();
    } else {
      this.isUseEquipmentTemplateVisible = true;
    }
  }

  /**
 * 获取开窗定义模板
 * @returns
 */
  useTemplateThen(): void {
    const { project_status } = this.wbsService.projectInfo;
    const canUse = ['20', '30', '50'].includes(project_status) && !this.wbsService.pageDatas.length;
    if (project_status === '10' || canUse) {
      const params = {
        search_info: [{
          order: 1,
          logic: 'OR',
          search_field: 'project_type_no',
          search_operator: 'equal',
          search_value: [this.wbsService.projectInfo?.project_type_no || '']
        }, {
          order: 2,
          search_field: 'project_type_no',
          search_operator: 'equal',
          search_value: ['']
        }]
      };
      this.wbsTabsService.getTaskTemplate(params).subscribe((res: any): void => {
        if (res.code === 0) {
          this.wbsTabsService.OpenWindowDefine = res.data;
          const executeContextTemp = JSON.parse(JSON.stringify(this.commonService.content.executeContext));
          executeContextTemp.identity = 'charge';
          executeContextTemp.tmActivityId = 'maintenanceProject_DTD';
          executeContextTemp.category = 'CUSTOM';
          executeContextTemp.relationTag = {
            identity: 'charge',
            activityId: 'maintenanceProject_DTD'
          };
          executeContextTemp.isTaskEngine = true;
          executeContextTemp.pattern = 'com';
          executeContextTemp.pageCode = 'task-detail';
          const operations = [
            {
              title: this.translateService.instant('dj-default-选择项目模板'),
              description: this.translateService.instant('dj-pcc-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-default-选择项目模板'),
                selectedFirstRow: false,
                multipleSelect: false,
                rowSelection: 'single',
                allAction: {
                  defaultShow: false,
                  dataSourceSet: this.wbsTabsService.OpenWindowDefine.dataSourceSet,
                  executeContext: executeContextTemp,
                },
                buttons: [
                  {
                    title: this.translateService.instant('dj-default-确定'),
                    actions: [
                      {
                        category: 'UI',
                        backFills: [
                          {
                            key: 'project_template_name',
                            valueScript: "selectedObject['project_template_name']",
                          },
                          {
                            key: 'project_template_no',
                            valueScript: "selectedObject['project_template_no']",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ];
          const selectRow = this.fb.group({
            project_template_info: [
              [
                {
                  project_template_no: '',
                  project_template_name: '',
                  project_type_no: this.wbsService.projectInfo?.project_type_no || '',
                },
              ],
            ],
          });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (resData: Array<any>) => {
              const { project_template_name, project_template_no } = resData[0];
              const { bpmData } = this.commonService.content.executeContext?.taskWithBacklogData || {};
              if (this.checkReviewTaskPlanned) {
                this.wbsService.checkTask(project_template_no, this.source, '2').subscribe((resultData: any): void => {
                  const hasReviewTasks = resultData?.data?.project_info.find((item: any): any => {
                    return item.task_category === 'REVIEW';
                  });
                  if (hasReviewTasks) {
                    this.useTemplateParams = {
                      project_no: this.wbsService.project_no,
                      project_template_no: project_template_no,
                    };
                    this.planRearrangeBaseDate = this.wbsService.projectInfo?.plan_start_date;
                    this.isUseTemplateDateVisible = true;
                    this.changeRef.markForCheck();
                  } else {
                    this.modal.info({
                      nzClosable: false,
                      nzContent: this.translateService.instant(
                        'dj-default-该项目模板未维护项目检讨类型的任务，不可使用！'
                      ),
                      nzOkText: this.translateService.instant('dj-default-我知道了'),
                    });
                  }
                });
              } else {
                this.useTemplateParams = {
                  project_no: this.wbsService.project_no,
                  project_template_no: project_template_no,
                };
                this.planRearrangeBaseDate = this.wbsService.projectInfo?.plan_start_date;
                this.isUseTemplateDateVisible = true;
                this.changeRef.markForCheck();
              }
            }
          );
        }
      });
    }

  }

  /**
 * 确认使用选中的模板并覆盖现有内容
 */
  useTemplateHandleOk(): void {
    sessionStorage.removeItem('hasEditFromProjectNo');
    sessionStorage.removeItem('hasEditFromTaskNoArr');
    this.taskAfresh(this.useTemplateParams);
    const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
      operation: UserBehaviorOperation.CLICK_BUTTON,
      attachData: {
        name: this.pluginLanguageStoreService.getAllI18n('dj-default-职能模板'),
        appCode: 'PCC',
        code: 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON003',
      },
    });
    reportedUserBehavior(behaviorCommData);
  }

  /**
 * 选择任务模板后重产数据
 * @param value
 */
  taskAfresh(value: any): void {
    this.isUseTemplateVisible = false;
    const params = {
      project_info: [value],
    };
    // 计划维护，选择【职能模板】后确定，调用API
    this.commonService.getInvData('task.afresh.create', params).subscribe((res) => {
      if (res.data?.task_info[0]?.task_name_mistake_message) {
        this.messageService.error(
          this.translateService.instant(res.data.task_info[0].task_name_mistake_message)
        );
        this.changeRef.markForCheck();
        return;
      }
      this.changeTemp.emit();
      this.changeWbsTaskCardProportion.emit();
    });
  }

  /**
 * 计划日期重排基准日期变更赋值
 * @param $event
 */
  delayTimeChange($event): void {
    const date = $event ? moment($event).format('YYYY/MM/DD') : '';
    this.planRearrangeBaseDate = date;
  }

  /**
 * 确定计划日期重排基准日期
 */
  templateDateConfirm(): void {
    this.useTemplateParams.plan_rearrange_base_date = this.planRearrangeBaseDate
      ? moment(this.planRearrangeBaseDate).format('YYYY-MM-DD')
      : '';
    this.isUseTemplateDateVisible = false;
    this.isUseTemplateVisible = true;
  }

  /**
 * 取消计划日期重排基准日期
 */
  templateDateCancel(): void {
    this.isUseTemplateDateVisible = false;
  }

  /**
 * 确认使用设备清单模板
 */
  useEquipmentTemplateHandleOk(): void {
    const params = {
      project_info: [
        {
          project_no: this.wbsService.project_no,
        },
      ],
    };
    this.commonService.getInvData('task.info.process', params).subscribe((res) => {
      if (res.code === 0) {
        this.isUseEquipmentTemplateVisible = false;
        if (!res.data.task_info?.length) {
          this.messageService.error(this.translateService.instant(`dj-default-暂无设备清单`));
          this.changeRef.markForCheck();
          return;
        }
        if (res.data?.task_info[0]?.task_name_mistake_message) {
          this.messageService.error(
            res.data.task_info[0].task_name_mistake_message
          );
          this.changeRef.markForCheck();
          return;
        }
        this.changeTemp.emit();
        this.changeRef.markForCheck();
      }
    });
    const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
      operation: UserBehaviorOperation.CLICK_BUTTON,
      attachData: {
        name: this.pluginLanguageStoreService.getAllI18n('dj-default-设备模板'),
        appCode: 'PCC',
        code: 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON003',
      },
    });
    reportedUserBehavior(behaviorCommData);
  }

  /**
 * 取消使用设备清单模板
 */
  useTemplateHandleCancel(): void {
    this.isUseTemplateVisible = false;
    this.isUseEquipmentTemplateVisible = false;
  }

  /**
 * 项目未开始且没有项目类型：project_status 项目状态10 未开始; project_type_no 项目类型编号
 * @returns true false 是否禁用
 */
  isDisabled(): boolean {
    return this.wbsService.projectInfo?.project_status === '10' && !this.wbsService.projectInfo.project_type_no;
  }

  /**
 * 是否禁用选择模版
 * 禁用条件：1. 项目状态>10; 2.项目状态=10,项目类型编号为空； 3.含有协同任务卡（项目状态为10）
 * @returns true false 是否禁用
 */
  isDisabledSelectTemplate(): boolean {
    const { project_status, project_type_no } = this.wbsService.projectInfo;
    let isDisabled = true;
    if (project_status === '10' && !this.wbsService.hasCollaborationCard && project_type_no) {
      isDisabled = false;
    }
    if (project_status > '10' && ['20', '30', '50'].includes(project_status) && !this.wbsService.pageDatas.length) {
      isDisabled = false;
    }
    return isDisabled;
  }

  /**
 * html 中文字翻译
 * @param val
 */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
