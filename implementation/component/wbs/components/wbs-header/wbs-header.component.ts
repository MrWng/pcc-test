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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  cloneDeep,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
  isObject,
  PluginLanguageStoreService,
  reportedUserBehavior,
  UserBehaviorOperation,
} from '@athena/dynamic-core';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { DragDropService } from 'app/implementation/directive/dragdrop/dragdrop.service';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { forkJoin, fromEvent, Observable, Subject, Subscription } from 'rxjs';
import { WbsTabsService } from '../../../wbs-tabs/wbs-tabs.service';
import { DynamicWbsService } from '../../wbs.service';
import { ApprovalProgressComponent } from '../task-detail/components/approval-progress/approval-progress.component';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { IndividualCaseAPIService } from 'app/implementation/individual-case/api';

@Component({
  selector: 'app-wbs-header',
  templateUrl: './wbs-header.component.html',
  styleUrls: ['./wbs-header.component.less'],
})
export class WbsHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  // wbs入口
  @Input() source: Entry = Entry.card;
  @Input() signOff: boolean = false;
  @Input() unRead: boolean = false;
  @Input() callReadFn;
  @Input() hasAuth: boolean = true;
  @Output() initWbsData: EventEmitter<any> = new EventEmitter();
  @Output() changeTemp = new EventEmitter();
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();
  @Output() refreshWbs = new EventEmitter<any>();
  @Output() refreshPageChange: EventEmitter<any> = new EventEmitter();
  @Output() changeLoading: EventEmitter<any> = new EventEmitter();

  // loading蒙层组件
  @ViewChild('loadingModal') loadingModal: any;
  @ViewChild('changeReason') changeReason: any;
  @ViewChild('inputElement', { static: false }) inputElement?: ElementRef;
  // 可清理的资源
  subscription: Subscription = new Subscription();
  public destroy$ = new Subject<void>();
  // wbs入口
  Entry = Entry;
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
  delayDays: any = 1;
  changeReasonInfo: string = '';
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

  indeterminate: boolean = false;

  planRearrangeBaseDate: any;

  modalTitle: string = '';
  modalContentInfo: string = '';
  reasonType: string = '';
  reasonFlag: boolean = false;
  loading: boolean = false;
  collaborativeTime: number = 0;
  updateTimer: number = 0;

  templateTypeOption: Array<any> = [
    { label: this.translateService.instant('dj-default-职能模板'), value: 'functionTem' },
    { label: this.translateService.instant('dj-default-设备模板'), value: 'equipmentTem' },
  ];
  projectId: any;
  smartDataUrl: any;
  isShowApprove = true;
  isChangeApprove = false;
  // 用于不同分辨率展示按钮
  headerWidth: number = 1216;
  resizeObserver: any;
  private callShowDelayDays$ = new Subject<void>();
  private widthChange$ = new Subject<number>();
  refModal: NzModalRef;
  continueProjectFileList: any[] = [];
  constructor(
    private http: HttpClient,
    public changeRef: ChangeDetectorRef,
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
    private athMessageService: AthMessageService,
    private individualCaseAPIService: IndividualCaseAPIService
  ) {}

  ngOnInit() {
    this.getProjectIdForQueryApprove();
    // this.wbsService.showExcel = false;
    this.getProjectPlanFlow();
    // this.validateForm = this.fb.group({
    //   project_template_name: [null, [Validators.required]],
    // });
    // this.addListener();
    this.getHasStartEnd();
    this.checkReviewTask();
    this.getAccessibleData();
    this.initShowDelayDays();

    // 宽度变更后进行赋值，用于按钮收展
    this.widthChange$.pipe(debounceTime(300)).subscribe((headerWidth) => {
      this.headerWidth = headerWidth;
      setTimeout(() => {
        this.changeRef.markForCheck();
      }, 0);
    });
    this.watchWidth();
  }

  get isApproveStatus() {
    return this.wbsService.projectInfo?.approve_status === 'N' && this.isShowApprove;
  }

  // 监听宽度变更
  watchWidth() {
    const dom = document.getElementById('PCC-wbs-header');
    if (dom) {
      this.headerWidth = dom?.clientWidth;

      if (this.resizeObserver) {
        // 如果已经存在一个 ResizeObserver，那么先断开它
        this.resizeObserver.disconnect();
      }
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.widthChange$.next(entry.contentRect.width);
        }
      });
      this.resizeObserver.observe(dom);
    }
  }

  getProjectIdForQueryApprove(): void {
    this.isShowApprove = false;
    this.isChangeApprove = false;
    this.commonService
      .getInvData('bm.pisc.project.change.doc.get', {
        project_change_doc_info: [
          {
            project_no: this.wbsService.project_no,
            change_status: 4,
          },
        ],
      })
      .subscribe((res: any): void => {
        if (res.data?.project_change_doc_info.length > 0) {
          this.isChangeApprove = true;
          console.log(res.data?.project_change_doc_info[0]);
          this.wbsService.change_approve_version =
            res.data?.project_change_doc_info[0]?.change_version;
          const bkInfo = [
            {
              entityName: 'projectChange_d',
              bk: {
                project_no: this.wbsService.project_no,
                change_version: this.wbsService.change_approve_version,
              },
            },
          ];
          const tmpId = 'PCC_project_0001';
          const actTmpId = 'PCC_task_0010';
          this.getProcessForApprove(bkInfo, tmpId, actTmpId);
        }
        // res?.data?.project_change_doc_info[0];
      });
    if (this.wbsService.projectInfo?.approve_status !== 'N') {
      return;
    }
    const bkInfo: any = [
      {
        entityName: 'project_d',
        bk: {
          project_no: this.wbsService.project_no,
        },
      },
    ];
    const tmpId = 'projectCenterConsoleStopProject_userProject';
    const actTmpId = 'pccStopProjectApprove';
    this.getProcessForApprove(bkInfo, tmpId, actTmpId);
  }

  // 请求签核进度
  getProcessForApprove(bkInfo, tmpId, actTmpId) {
    const params = {
      eocId: {},
      tenantId: this.userService.getUser('tenantId'),
      bkInfo,
      taskStates: [1, 2, 3, 4, 5],
      activityStates: [1, 2, 3, 4, 5, 6],
    };
    this.wbsService.queryProjectId(params).subscribe((res: any) => {
      const subTasksItem = res.data[0]?.subTasks?.find((el) => {
        return el.state === 1 && el.tmpId === tmpId;
      });
      subTasksItem?.activities?.forEach((element) => {
        if (element.actTmpId === actTmpId) {
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
    this.commonService
      .getMechanismParameters('projectPlanFlow')
      .toPromise()
      .then((res) => {
        // 1: PM独自完成项目计划(不需协同计划)
        // 2: 协同计划(一定需要协同计划)
        // 3: 混合计划(两种同时存在)
        this.projectPlanningProcessType = res.data?.projectPlanFlow
          ? res.data?.projectPlanFlow
          : '-1';
        this.changeRef.markForCheck();
      });
  }

  judgeForProjectPlanFlow1() {
    // [项目计划流程]是： 1.PM独自完成，且 [项目状态]是： 10 或 30 ==> （隐藏）协同计划排定按钮
    return (
      (this.projectPlanningProcessType === '1' &&
        (this.wbsService.projectInfo?.project_status === '10' ||
          this.wbsService.projectInfo?.project_status === '30')) ||
      this.wbsService.projectInfo?.project_status === '20' ||
      this.wbsService.projectInfo?.project_status === '50'
    );
  }

  judgeForProjectPlanFlow2() {
    // [项目计划流程]是： 不是1.PM独自完成，且 没有可排定的任务 和 [项目状态]是： 30 ==> （置灰）协同计划排定按钮
    // this.wbsService.projectInfo?.project_status !== '10' || !this.wbsService.firstTaskCardList.length
    return this.projectPlanningProcessType !== '1' && !this.wbsService.firstTaskCardList.length;
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    // 关闭loading蒙层
    this.loadingModal.closeLoadingModal();
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
  // addListener(): void {
  //   this.subscription.add(
  //     fromEvent(document, 'keydown').subscribe((e: KeyboardEvent) => {
  //       if (e.altKey && e.ctrlKey && e.which === 69) {
  //         this.wbsService.showExcel = true;
  //         this.changeRef.markForCheck();
  //         this.changeRef.detectChanges();
  //       }
  //     })
  //   );
  // }

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
    if (!this.wbsService.projectChangeStatus['check_type_init']) {
      return;
    }
    if (this.wbsService.projectInfo?.project_status === '30') {
      // this.modalService.confirm({
      //   nzTitle: this.translateService.instant('dj-c-提示'),
      //   nzContent: this.translateService.instant('dj-default-确定结案吗'),
      //   nzCancelText: this.translateService.instant('dj-c-取消'),
      //   nzOkText: this.translateService.instant('dj-c-确定'),
      //   nzClassName: 'confirm-modal-center-sty',
      //   nzOnOk: (): void => {
      //     this.caseApi('40', this.translateService.instant('dj-default-结案成功'));
      //   },
      // });
      this.modalTitle = this.translateService.instant('dj-c-提示');
      this.modalContentInfo = this.translateService.instant('dj-default-指定结案confirm-nzContent');
      this.reasonType = 'closeProjectForNotDesign';
      this.changeReason.showModal(this.reasonType);
    }
  }

  /**
   * 指定结案
   */
  designatedProject(): void {
    if (!this.wbsService.projectChangeStatus['check_type_init']) {
      return;
    }
    const projectStatus = this.wbsService.projectInfo?.project_status;
    if (projectStatus !== '30' && projectStatus !== '50') {
      return;
    }
    this.modalTitle = this.translateService.instant('dj-c-提示');
    this.modalContentInfo = this.translateService.instant('dj-default-指定结案confirm-nzContent');
    this.reasonType = 'designated';
    this.changeReason.showModal(this.reasonType);
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
        variablesType = 'closeProject'; // 指定结案
      }
      if (this.reasonType === 'continueProject') {
        status = '30';
        title = 'dj-default-继续专案';
        code = '-PCC_TAB006-PCC_BUTTON005';
        variablesType = 'continueProject'; // 继续专案
      }
      if (this.reasonType === 'closeProjectForNotDesign') {
        status = '40';
        title = 'dj-pcc-结案';
        code = '-PCC_TAB006-PCC_BUTTON006';
        variablesType = 'closeProjectForNotDesign'; // 结案
      }
      if (this.reasonType && status && title && code) {
        // this.loading = true;
        this.wbsService
          .bmPiscProjectTypeGet({ project_type_no: this.wbsService.projectInfo?.project_type_no })
          .then((result) => {
            // 打开loading蒙层
            this.loadingModal.createLoadingModal();
            const params = {
              project_info: [
                {
                  project_no: this.wbsService.project_no,
                  project_status: status,
                  sync_steady_state:
                    this.wbsService.projectInfo.project_property === '10'
                      ? 'N'
                      : this.wbsService.hasGroundEnd,
                  is_approve: result.project_status_u_is_approve,
                  approve_status: result.project_status_u_is_approve ? 'N' : 'V',
                  change_reason: isObject(info) ? info['changeReason'] : info,
                },
              ],
            };

            const project_info = [
              {
                project_no: this.wbsService.project_no,
                project_name: this.wbsService.projectInfo.project_name,
                plan_start_date: this.wbsService.projectInfo.plan_start_date,
                plan_finish_date: this.wbsService.projectInfo.plan_finish_date,
                project_type_no: this.wbsService.projectInfo.project_type_no,
                taskPersonInCharge: this.userService.getUser('userId'),
                change_reason: isObject(info) ? info['changeReason'] : info,
                eoc_company_id:
                  this.commonService.content?.executeContext?.businessUnit?.eoc_company_id,
              },
            ];
            const dispatchData = [{ project_no: this.wbsService.project_no }];
            // s16 暂停/继续项目/结案/指定结案增加项目状态变更附件
            const addAttachmentIntoParamsAndProjectInfo = (_params, _project_info, type = '') => {
              const attach = {
                row_data: this.wbsService.project_no + ';',
                data:
                  type === 'continueProject'
                    ? this.continueProjectFileList || []
                    : info.fileList || [],
              };
              _params['project_info'][0]['status_change_attachment'] = attach;
              _project_info[0]['status_change_attachment'] = attach;
              if (!result.project_status_u_is_approve) {
                _params['is_sync_document'] = this.wbsService.is_sync_document;
              }
            };
            // 签核否： true.需签核;false.无需签核
            if (result.project_status_u_is_approve) {
              if (this.reasonType === 'suspend') {
                const suspendParams = {
                  project_info: [
                    {
                      project_no: this.wbsService.project_no,
                      project_status: '50',
                      is_approve: true,
                      approve_status: 'N',
                      change_reason: isObject(info) ? info['changeReason'] : info,
                    },
                  ],
                };
                addAttachmentIntoParamsAndProjectInfo(suspendParams, project_info);
                this.commonService
                  .getInvData('bm.pisc.project.status.update', suspendParams)
                  .subscribe(
                    (resUpdate): void => {
                      if (
                        resUpdate?.data?.project_info &&
                        resUpdate.data.project_info[0]?.error_msg
                      ) {
                        this.loadingModal.closeLoadingModal();
                        this.athMessageService.error(resUpdate.data.project_info[0].error_msg);
                        this.changeRef.markForCheck();
                        return;
                      } else {
                        this.wbsService
                          .suspendOrStopProject(
                            'Athena',
                            variablesType,
                            true,
                            project_info,
                            dispatchData
                          )
                          .subscribe((res) => {
                            setTimeout(() => {
                              this.initWbsData.emit();
                              this.wbsService.projectInfo.approve_status = 'N';
                              this.getProjectIdForQueryApprove();
                              this.wbsService.initWbsShow.next(true);
                              this.changeRef.markForCheck();
                              this.loadingModal.closeLoadingModal();
                              this.athMessageService.success(
                                this.translateService.instant(
                                  'dj-default-已执行暂停项目或暂停项目送签！'
                                )
                              );
                            }, 500);
                          });
                      }
                    },
                    (err) => {
                      this.loadingModal.closeLoadingModal();
                    }
                  );
              }
              if (this.reasonType === 'designated') {
                addAttachmentIntoParamsAndProjectInfo(params, project_info);
                this.suspendOrStopProjectUpdateStatus(
                  '60',
                  params,
                  variablesType,
                  true,
                  project_info,
                  dispatchData
                );
              }
              if (this.reasonType === 'continueProject') {
                const continueProjectParams = {
                  project_info: [
                    {
                      project_no: this.wbsService.project_no,
                      project_status: '30',
                      is_approve: true,
                      approve_status: 'N',
                      is_update_date: this.isUpdateDateStatus,
                      postpone_days: this.delayDays.toString(),
                      change_reason: isObject(info) ? info['changeReason'] : info,
                      advance_lag_type: this.isDelay,
                    },
                  ],
                };
                addAttachmentIntoParamsAndProjectInfo(
                  continueProjectParams,
                  project_info,
                  'continueProject'
                );
                this.commonService
                  .getInvData('project.status.info.update', continueProjectParams)
                  .subscribe(
                    (resUpdate): void => {
                      if (
                        resUpdate?.data?.project_info &&
                        resUpdate.data.project_info[0]?.task_name_mistake_message
                      ) {
                        this.loadingModal.closeLoadingModal();
                        this.athMessageService.error(
                          resUpdate.data.project_info[0].task_name_mistake_message
                        );
                        this.changeRef.markForCheck();
                        return;
                      } else {
                        this.wbsService
                          .suspendOrStopProject(
                            'Athena',
                            variablesType,
                            true,
                            project_info,
                            dispatchData,
                            {
                              is_update_date: this.isUpdateDateStatus,
                              postpone_days: this.delayDays.toString(),
                              advance_lag_type: this.isDelay,
                            }
                          )
                          .subscribe(
                            (res) => {
                              setTimeout(() => {
                                this.initWbsData.emit();
                                this.wbsService.projectInfo.approve_status = 'N';
                                this.getProjectIdForQueryApprove();
                                this.wbsService.initWbsShow.next(true);
                                this.changeRef.markForCheck();
                                this.loadingModal.closeLoadingModal();
                                this.athMessageService.success(
                                  this.translateService.instant(
                                    'dj-default-已执行继续项目或继续项目送签！'
                                  )
                                );
                              }, 500);
                            },
                            (err) => {
                              this.loadingModal.closeLoadingModal();
                            }
                          );
                      }
                    },
                    (err) => {
                      this.loadingModal.closeLoadingModal();
                    }
                  );
              }
              if (this.reasonType === 'closeProjectForNotDesign') {
                addAttachmentIntoParamsAndProjectInfo(params, project_info);
                this.suspendOrStopProjectUpdateStatus(
                  '40',
                  params,
                  variablesType,
                  true,
                  project_info,
                  dispatchData
                );
              }
            } else {
              if (this.reasonType === 'suspend') {
                addAttachmentIntoParamsAndProjectInfo(params, project_info);
                this.suspendOrStopProjectUpdateStatus('50', params);
              }
              if (this.reasonType === 'designated') {
                addAttachmentIntoParamsAndProjectInfo(params, project_info);
                this.suspendOrStopProjectUpdateStatus(
                  '60',
                  params,
                  variablesType,
                  false,
                  project_info,
                  dispatchData
                );
              }
              if (this.reasonType === 'continueProject') {
                this.caseApi('30', this.translateService.instant('dj-pcc-继续专案成功'));
              }
              if (this.reasonType === 'closeProjectForNotDesign') {
                this.caseApi(
                  '40',
                  this.translateService.instant('dj-default-结案成功'),
                  null,
                  info
                );
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

  suspendOrStopProjectUpdateStatus(
    status,
    params,
    variablesType?: string,
    isSign?: boolean,
    project_info?: any,
    dispatchData?: any
  ): void {
    this.commonService
      .getInvData('project.status.info.update', params, this.wbsService.projectInfo.eoc_company_id)
      .subscribe(
        async (res) => {
          if (res.data.project_info[0]?.task_name_mistake_message) {
            this.loadingModal.closeLoadingModal();
            this.athMessageService.error(res.data.project_info[0].task_name_mistake_message);
            this.changeRef.markForCheck();
            return;
          }
          if (status === '60' || status === '40') {
            // 光斯奥丢单原因逻辑个案
            await this.reasonForLostOrderHandler(isSign);
            this.wbsService
              .suspendOrStopProject('Athena', variablesType, isSign, project_info, dispatchData)
              .subscribe(
                (res2) => {
                  setTimeout(() => {
                    this.initWbsData.emit();
                    this.wbsService.projectInfo.approve_status =
                      params?.project_info[0]?.approve_status;
                    this.wbsService.initWbsShow.next(true);
                    this.getProjectIdForQueryApprove();
                    this.changeRef.markForCheck();
                    this.loadingModal.closeLoadingModal();
                    this.athMessageService.success(
                      status === '60'
                        ? this.translateService.instant('dj-default-已执行指定结案或指定结案送签！')
                        : this.translateService.instant('dj-default-已执行结案或结案送签！')
                    );
                  }, 500);
                },
                (err) => {
                  this.loadingModal.closeLoadingModal();
                }
              );
          } else {
            forkJoin([
              // 1.回收协同计划排定的任务卡，清理协同卡 pcc_closeTeamWork
              this.wbsService.suspendCard(this.wbsService.project_no, false),
              // 2.回收计划时程异常相关任务卡和项目卡  pcc_closePlanChange_manual
              this.wbsService.closePlanChangeManual(this.wbsService.project_no, false),
              // 3.回收怠工处理异常相关任务卡和项目卡 pcc_finishTaskThenCheckGoSlowTask
              this.wbsService.finishTaskThenCheckGoSlowTask(
                this.wbsService.project_no,
                'projectStatusChange',
                false
              ),
            ])
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                (res) => {
                  setTimeout(() => {
                    this.initWbsData.emit();
                    this.wbsService.projectInfo.approve_status =
                      params?.project_info[0]?.approve_status;
                    this.wbsService.initWbsShow.next(true);
                    this.getProjectIdForQueryApprove();
                    this.changeRef.markForCheck();
                    this.loadingModal.closeLoadingModal();
                    this.athMessageService.success(
                      this.translateService.instant('dj-default-已执行暂停项目或暂停项目送签！')
                    );
                  }, 500);
                },
                (err) => {
                  this.loadingModal.closeLoadingModal();
                }
              );
          }
        },
        (err) => {
          this.loadingModal.closeLoadingModal();
        }
      );
  }
  /**
   * 光斯奥个案丢单原因逻辑
   * @param isSign 是否签核
   */
  private reasonForLostOrderHandler(isSign: boolean): Promise<any> {
    if (!this.changeReason.reasonForLostOrderDynamicModel) {
      return Promise.resolve();
    }
    const reason_for_lost_order = this.changeReason.reason_for_lost_order;
    return this.individualCaseAPIService
      .UC_PROJECT_REASON_FOR_LOST_ORDER_INFO_UPDATE([
        {
          reason_for_lost_order,
          project_no: this.wbsService.project_no,
          status: isSign ? 'N' : 'Y',
        },
      ])
      .then((res) => {
        this.changeReason.resetReasonForLostOrder();
        return res;
      });
  }

  /**
   * 暂停专案
   */
  suspendProject(): void {
    if (!this.wbsService.projectChangeStatus['check_type_init']) {
      return;
    }
    this.modalService.confirm({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: this.translateService.instant(
        'dj-pcc-请注意：项目暂停，将会自动关闭该项目下进行中的协同计划排定相关任务、计划时程异常相关任务、怠工异常相关任务！是否确认发起项目暂停？'
      ),
      nzOkText: this.translateService.instant('dj-c-确定'),
      nzCancelText: this.translateService.instant('dj-c-取消'),
      nzClassName: 'confirm-modal-center-sty modal-content-center',
      nzMaskClosable: false,
      nzOnOk: (): void => {
        this.modalTitle = this.translateService.instant('dj-c-提示');
        this.modalContentInfo = this.translateService.instant('dj-pcc-确定暂停专案吗');
        this.reasonType = 'suspend';
        this.changeReason.showModal(this.reasonType);
        this.changeRef.markForCheck();
      },
      nzOnCancel: (): void => {
        this.changeRef.markForCheck();
        return;
      },
    });
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
        const delayDays = moment(today).diff(
          moment(this.wbsService.projectInfo?.pause_date),
          'days'
        );
        this.delayDays = delayDays ? delayDays : 0;
        this.isContinueDelayDaysVisible = true;
        this.reasonType = 'continueProject';
        this.continueProjectFileList = [];
        this.changeRef.markForCheck();
      },
    });
  }

  /**
   * 暂停专案/继续专案/指定结案/结案
   * 所有任务自动延展
   * @param status 状态 40: 结案； 60：指定结案
   * @param message 成功后的通知
   */
  caseApi(status, message?, callBack?, changeReason?): void {
    const approveInfo = {};
    if (status === '30' || status === '40') {
      approveInfo['is_approve'] = false;
      approveInfo['approve_status'] = 'V';
      if (changeReason) {
        approveInfo['change_reason'] =
          typeof changeReason === 'object' ? changeReason.changeReason : changeReason;
      }
    }
    let params: any = {
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
          ...approveInfo,
        },
      ],
    };
    if (this.changeReasonInfo && !['10', '20'].includes(status)) {
      params.project_info[0]['change_reason'] = this.changeReasonInfo;
      this.changeReasonInfo = '';
    }
    // s16 继续项目和结案增加项目状态变更附件
    if (this.reasonType === 'continueProject' || this.reasonType === 'closeProjectForNotDesign') {
      params.project_info[0]['status_change_attachment'] = {
        row_data: this.wbsService.project_no + ';',
        data:
          this.reasonType === 'closeProjectForNotDesign'
            ? changeReason.fileList || []
            : this.continueProjectFileList || [],
      };
      params = {
        ...params,
        is_sync_document: this.wbsService.is_sync_document,
      };
    }
    this.commonService
      .getInvData('project.status.info.update', params, this.wbsService.projectInfo.eoc_company_id)
      .subscribe(
        (res) => {
          this.continueProjectFileList = [];
          if (status === '40') {
            if (res.data.project_info[0]?.task_name_mistake_message) {
              this.loadingModal.closeLoadingModal();
              this.athMessageService.error(res.data.project_info[0].task_name_mistake_message);
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
                .subscribe(
                  (res) => {
                    this.loadingModal.closeLoadingModal();
                  },
                  (err) => {
                    this.loadingModal.closeLoadingModal();
                  }
                );
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
                .subscribe(
                  (res) => {
                    this.loadingModal.closeLoadingModal();
                  },
                  (err) => {
                    this.loadingModal.closeLoadingModal();
                  }
                );
            }
          }
          if (status === '30' || this.delayType === 2) {
            if (
              res.code === 0 &&
              res.data.project_info?.length &&
              res.data.project_info[0]?.task_name_mistake_message
            ) {
              this.loadingModal.closeLoadingModal();
              this.athMessageService.error(
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
                .subscribe(
                  (res) => {
                    this.loadingModal.closeLoadingModal();
                  },
                  (err) => {
                    this.loadingModal.closeLoadingModal();
                  }
                );
            } else {
              const param = [
                {
                  project_no: this.wbsService.project_no,
                },
              ];
              this.wbsService
                .postContinueProcess(this.userService.getUser('tenantId'), param, content)
                .subscribe(
                  (res) => {
                    this.loadingModal.closeLoadingModal();
                  },
                  (err) => {
                    this.loadingModal.closeLoadingModal();
                  }
                );
            }
          }
          // if (Number(status) !== 10) {
          //   if (!res.data.project_info[0]?.task_name_mistake_message) {
          //     this.wbsService.needRefresh = this.translateService.instant('dj-default-刷新');
          //   }
          // }

          this.wbsService.initWbsShow.next(true);
          this.changeRef.markForCheck();
          if (message) {
            this.athMessageService.success(message);
            if (callBack) {
              callBack();
            }
          }
          setTimeout(() => {
            this.initWbsData.emit();
          }, 300);
        },
        (err) => {
          this.continueProjectFileList = [];
          this.loadingModal.closeLoadingModal();
        }
      );
  }

  closeTheCaseError(errorMessage): void {
    this.modalService.info({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: errorMessage,
      nzOkText: this.translateService.instant('dj-c-确定'),
      nzClassName: 'confirm-modal-center-sty',
      nzOnOk: (): void => {},
    });
  }

  initShowDelayDays(): void {
    this.callShowDelayDays$.pipe(debounceTime(200)).subscribe((change: any) => {
      this.showDelayDays();
    });
  }

  callShowDelayDays() {
    // 项目变更任务
    if (
      this.source === Entry.projectChange &&
      this.wbsService.projectChangeDoc?.change_status !== '1'
    ) {
      return;
    }
    // 项目变更任务签核
    if (this.source === Entry.projectChange && this.signOff) {
      return;
    }
    if (
      this.source !== Entry.projectChange &&
      (!['10', '20', '30'].includes(this.wbsService.projectInfo?.project_status) ||
        this.wbsService.needRefresh ||
        this.isDisabled() ||
        (this.wbsService.projectInfo?.project_status !== '30' &&
          this.wbsService.hasCollaborationCard))
    ) {
      return;
    }
    this.callShowDelayDays$.next();
  }

  /**
   * 所有任务自动延展
   */
  async showDelayDays(): Promise<any> {
    if (this.source === Entry.projectChange) {
      const project_no_o = this.wbsService.projectInfo?.project_no;
      this.wbsService.getInfoCheck(project_no_o).subscribe((res) => {
        if (res.data && res.data?.check_result) {
          this.messageService.warning(res.data?.check_result);
          this.changeRef.markForCheck();
          return;
        } else {
          this.delayDays = 1;
          this.isContinueDelayDaysVisible = true;
          this.changeRef.markForCheck();
          return;
        }
      });
      return;
    }
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
    this.commonService
      .getProjectChangeStatus(this.wbsService.project_no, ['1', '2', '3', '4', '5'], '1')
      .subscribe(
        (resChange) => {
          if (projectStatus === '10' || projectStatus === '30' || projectStatus === '20') {
            if (this.wbsService?.project_no) {
              this.commonService
                .getCollaborationCard(this.wbsService.project_no)
                .subscribe((res) => {
                  const returnInfo = res.data?.assist_schedule_info ?? res.data?.task_info;
                  if (returnInfo && returnInfo?.length) {
                    this.modalService.info({
                      nzTitle: this.translateService.instant('dj-c-提示'),
                      nzContent: this.translateService.instant(
                        'dj-pcc-存在协同任务未完成，不可使用所有任务自动延展功能！'
                      ),
                      nzOkText: this.translateService.instant('dj-default-我知道了'),
                      nzClassName: 'confirm-modal-center-sty',
                      nzOnOk: (): void => {
                        this.changeRef.markForCheck();
                      },
                      nzOnCancel: (): void => {
                        this.changeRef.markForCheck();
                      },
                    });
                  } else {
                    this.delayDays = 1;
                    this.delayType = 2;
                    this.isContinueDelayDaysVisible = true;
                    this.changeRef.markForCheck();
                  }
                });
            }
          }
        },
        (error) => {}
      );
  }

  placeholderMessage(): String {
    if (this.reasonType !== 'continueProject') {
      return this.translateWordPcc('不可为空，必须大于0');
    }
    if (this.reasonType === 'continueProject') {
      return this.translateWordPcc('请输入');
    }
  }

  /**
   * 设置延展天数
   */
  extendDays(value: string): void {
    // const reg = /^-?(0|[1-9][0-9]*)?$/;
    // if ((!isNaN(+value) && reg.test(value)) || value === '') {
    this.delayDays = value;
    // }
    // this.inputElement!.nativeElement.value = this.delayDays;
  }

  /**
   * 确定所有任务自动延展
   */
  continueDelayDays(): void {
    // 所有任务自动延展，不管是在项目变更任务，还是计划维护，都可以默认1，并且不可小于等于0。
    if (!(Number(this.delayDays) > 0) && this.reasonType !== 'continueProject') {
      return;
    } else if (this.delayDays === '' || Number(this.delayDays) < 0) {
      // 只有继续专案，要可以等于0，管控不可小于0就行。
      return;
    }
    this.delayDays = this.delayDays
      ? this.delayDays
      : this.reasonType === 'continueProject'
      ? '0'
      : '1';
    if (this.source === Entry.projectChange) {
      if (this.isDelay === '-1') {
        this.isContinueDelayDaysVisible = false;
        this.changeRef.markForCheck();
        this.changeLoading.emit(true);
        // 提前不弹窗，就默认传入FALSE
        this.projectChangeProcess(false);
      } else {
        this.isUpdateDate();
      }
      return;
    }
    if (
      !this.changeReasonInfo &&
      !['10', '20'].includes(this.wbsService.projectInfo?.project_status)
    ) {
      this.athMessageService.create(
        'warning',
        this.translateService.instant('dj-pcc-请输入变更原因'),
        { nzDuration: 0 }
      );
      return;
    }
    this.isContinueDelayDaysVisible = false;
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
          name: this.pluginLanguageStoreService.getAllI18n('dj-default-所有任务自动延展'),
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
      this.reasonInput(this.changeReasonInfo);
      // this.caseApi('30', this.translateService.instant('dj-pcc-继续专案成功'));
    } else {
      const params = {
        project_info: [
          {
            project_no: this.wbsService.project_no,
          },
        ],
      };
      this.commonService.getInvData('bm.pisc.project.get', params).subscribe((res: any): void => {
        const status = res.data.project_info[0].project_status;
        if (Number(status) > 10) {
          this.wbsService.projectInfo.project_status = status;
        }
        this.caseApi(
          res.data.project_info[0].project_status,
          this.translateService.instant('dj-default-所有任务自动延展成功'),
          () => {
            if (Number(status) !== 10 && Number(status) !== 20) {
              this.wbsService.needRefresh = this.translateService.instant('dj-default-刷新');
            }
          }
        );
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
      nzContent: this.translateService.instant('dj-pcc-若超出项目日期范围，是否同步更新项目？'),
      nzCancelText: this.translateService.instant('dj-pcc-否'),
      nzOkText: this.translateService.instant('dj-pcc-是'),
      nzClassName: 'confirm-modal-center-sty',
      nzMaskClosable: false,
      nzClosable: false,
      nzOnOk: (): void => {
        // 防止多次点击触发
        if (moment().valueOf() - this.updateTimer < 3000) {
          return;
        }
        this.updateTimer = moment().valueOf();
        this.isUpdateDateStatus = true;
        if (this.source === Entry.projectChange) {
          this.isContinueDelayDaysVisible = false;
          this.changeRef.markForCheck();
          this.changeLoading.emit(true);
          this.projectChangeProcess(true);
        } else {
          this.getNewStatus();
        }
      },
      nzOnCancel: (): void => {
        if (moment().valueOf() - this.updateTimer < 3000) {
          return;
        }
        this.updateTimer = moment().valueOf();
        this.isUpdateDateStatus = false;
        if (this.source === Entry.projectChange) {
          this.isContinueDelayDaysVisible = false;
          this.changeRef.markForCheck();
          this.changeLoading.emit(true);
          this.projectChangeProcess(false);
        } else {
          this.getNewStatus();
        }
      },
    });
  }

  // 项目变更任务 -- 所有任务自动延展
  projectChangeProcess(is_update_project_date: boolean) {
    const params = {
      // 超出项目日期范围是否同步更新项目
      is_update_project_date,
      // 是否更新已发卡任务的计划开始时间=true
      is_update_issued_card_task_plan_start_date: true,
      project_info: [
        {
          // 项目编号、变更版本、延期天数=若为延后，传入前端录入的天数，否则 传入-1*前端录入的天数
          project_no: this.wbsService.project_no,
          change_version: this.wbsService.change_version,
          postpone_days:
            this.isDelay === '1' ? Number(this.delayDays) : Number(this.delayDays) * -1,
        },
      ],
    };
    this.commonService.getInvData('bm.pisc.project.postpone.process', params).subscribe(
      (res: any): void => {
        this.translateService.instant('dj-default-所有任务自动延展成功');
        // 刷新页面数据
        this.refreshPageChange.emit();
      },
      (error) => {
        this.refreshPageChange.emit();
      }
    );
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
        idType: 'project',
        project_no: this.wbsService.project_no,
        isChangeApprove: this.isChangeApprove,
        wbsService: this.wbsService,
      },
      nzWidth: 550,
      nzClassName: 'signOffProgress-modal-center-sty',
      nzNoAnimation: true,
      nzClosable: true,
      nzOnOk: (): void => {},
    });
  }

  /**
   * 取消所有任务自动延展
   */
  continueDelayDaysCancel(): void {
    this.isContinueDelayDaysVisible = false;
    this.continueProjectFileList = [];
    this.changeReasonInfo = '';
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
    if (this.isDisabled() || this.accessibleStatus) {
      return;
    }
    this.validateForm = this.fb.group({
      project_template_name: [null, [Validators.required]],
    });
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
        task_info: [{ project_no: this.wbsService.project_no }],
      };
      // [3.2]
      this.commonService.getInvData('bm.pisc.task.get', paras).subscribe(
        (result: any): void => {
          if (result && result.data) {
            const taskInfo = result.data.task_info;
            taskInfo.forEach((item) => {
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
              item.task_member_info.forEach((element) => {
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
            this.commonService
              .getInvData('bm.pisc.project.template.create', params)
              .subscribe((res) => {
                if (res.code === 0) {
                  if (res.data.project_template_info[0]?.error_msg) {
                    this.athMessageService.error(res.data.project_template_info[0].error_msg);
                    return;
                  }
                  this.athMessageService.success(
                    this.translateService.instant(`dj-default-保存成功！`)
                  );
                  this.validateForm.get('project_template_name').setValue('');
                  this.isSaveModalVisible = false;
                  this.changeRef.markForCheck();
                }
              });
          }
        },
        (err) => {}
      );
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
    if (moment().valueOf() - this.collaborativeTime < 2000) {
      return;
    }
    this.collaborativeTime = moment().valueOf();
    this.commonService
      .getProjectChangeStatus(this.wbsService.project_no, ['1', '4', '5'], '1')
      .subscribe(
        (res) => {
          if (this.wbsService.projectInfo?.project_status === '30') {
            this.commonService
              .getTaskInfo(this.wbsService.project_no, this.source)
              .subscribe((value) => {
                const project_info = value.data?.project_info ?? [];
                this.wbsService.firstTaskCardList = project_info.filter((task) => {
                  return (
                    task.liable_person_code &&
                    task.complete_rate < 1 &&
                    task.upper_level_task_no === task.task_no &&
                    !['PCM', 'ASSC_ISA_ORDER'].includes(task.task_category)
                  );
                });
                this.changeRef.markForCheck();
                this.showCollaborationModal();
              });
          } else {
            // 启动前(项目状态=10.未开始)
            this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(
              (task: any) =>
                task.liable_person_code && !['PCM', 'ASSC_ISA_ORDER'].includes(task.task_category)
            );
            this.showCollaborationModal();
          }
        },
        (error) => {}
      );
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
    tempTaskList.sort((a, b) => {
      return a.sequence - b.sequence;
    });
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
    this.indeterminate = false;
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
                task_no: task.task_no, // 配合标准前端调整，增加入参：当前协同排定任务的一级计划
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
          if (this.wbsService.typeChange === 'table') {
            this.wbsService.pageChange.next(true);
          }
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
    this.indeterminate = false;
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
        search_info: [
          {
            order: 1,
            logic: 'OR',
            search_field: 'project_type_no',
            search_operator: 'equal',
            search_value: [this.wbsService.projectInfo?.project_type_no || ''],
          },
          {
            order: 2,
            search_field: 'project_type_no',
            search_operator: 'equal',
            search_value: [''],
          },
        ],
      };
      this.wbsTabsService.getTaskTemplate(params).subscribe((res: any): void => {
        if (res.code === 0) {
          this.wbsTabsService.OpenWindowDefine = res.data;
          const executeContextTemp = JSON.parse(
            JSON.stringify(this.commonService.content.executeContext)
          );
          executeContextTemp.identity = 'charge';
          executeContextTemp.tmActivityId = 'maintenanceProject_DTD';
          executeContextTemp.category = 'CUSTOM';
          executeContextTemp.relationTag = {
            identity: 'charge',
            activityId: 'maintenanceProject_DTD',
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
              const { bpmData } =
                this.commonService.content.executeContext?.taskWithBacklogData || {};
              if (this.checkReviewTaskPlanned) {
                this.wbsService
                  .checkTask(project_template_no, this.source, '2')
                  .subscribe((resultData: any): void => {
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
                      this.modalService.info({
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
    sessionStorage.removeItem('hasEditFromTaskNoArr' + this.wbsService.project_no);
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
  async taskAfresh(value: any): Promise<any> {
    this.isUseTemplateVisible = false;
    // s6: 入参追加是否同步文档
    const syncDoc = await this.wbsService.getSyncDoc();
    const params = {
      is_sync_document: syncDoc,
      project_info: [value],
    };
    // 计划维护，选择【职能模板】后确定，调用API
    this.commonService.getInvData('task.afresh.create', params).subscribe((res) => {
      if (res.data?.task_info[0]?.task_name_mistake_message) {
        this.athMessageService.error(
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
          this.athMessageService.error(this.translateService.instant(`dj-default-暂无设备清单`));
          this.changeRef.markForCheck();
          return;
        }
        if (res.data?.task_info[0]?.task_name_mistake_message) {
          this.athMessageService.error(res.data.task_info[0].task_name_mistake_message);
          this.changeRef.markForCheck();
          return;
        }
        this.changeTemp.emit();
        sessionStorage.removeItem('hasEditFromTaskNoArr' + this.wbsService.project_no);
        this.changeWbsTaskCardProportion.emit();
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
    return (
      this.wbsService.projectInfo?.project_status === '10' &&
      !this.wbsService.projectInfo.project_type_no
    );
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
    if (
      project_status > '10' &&
      ['20', '30', '50'].includes(project_status) &&
      !this.wbsService.pageDatas.length
    ) {
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
