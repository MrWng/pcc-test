import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonService } from 'app/implementation/service/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { WbsTabsService } from '../../wbs-tabs.service';
import { TranslateService } from '@ngx-translate/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { EventBusService, EventBusSpecialChannel } from '@athena/dynamic-core';
import { DwUserService } from '@webdpt/framework/user';
import { debounceTime } from 'rxjs/operators';
import { IndividualCaseAPIService } from 'app/implementation/individual-case/api';
import { DynamicCustomizedService } from 'app/implementation/service/dynamic-customized.service';

@Component({
  selector: 'app-start-project',
  templateUrl: './start-project.component.html',
  styleUrls: ['./start-project.component.less'],
})
export class StartProjectComponent implements OnInit {
  @Output() changTabIndex: EventEmitter<any> = new EventEmitter();
  @Output() startProject: EventEmitter<any> = new EventEmitter();
  @Input() isCanDelete: boolean = false;
  @Input() isShowInitiateProjectChangesBtn: boolean = false;
  @Output() parentChangeFn: EventEmitter<any> = new EventEmitter();
  @Output() callTabLoading = new EventEmitter();

  key: any;
  subject: Subject<any>;
  private $projectChange = new Subject<void>();
  isShowChangeInfo: boolean = false;
  synchronizeChangeTasks: boolean = false;
  changeReasonInfo: string = '';

  constructor(
    private translateService: TranslateService,
    public wbsTabsService: WbsTabsService,
    public commonService: CommonService,
    protected messageService: NzMessageService,
    private modalService: NzModalService,
    protected changeRef: ChangeDetectorRef,
    public wbsService: DynamicWbsService,
    public eventBusService: EventBusService,
    private userService: DwUserService,
    private individualCaseAPIService: IndividualCaseAPIService,
    private dynamicCustomizedService: DynamicCustomizedService
  ) {
    this.key = this.eventBusService.register(EventBusSpecialChannel.baseDate);
    // this.subject = this.eventBusService.getSubject(EventBusSpecialChannel.baseDate);
  }

  get isShowStart() {
    return this.wbsService.projectInfo?.project_status === '10' && this.wbsTabsService.isShowStart;
  }

  ngOnInit(): void {
    this.initProjectChangeFun();
  }

  isShowTransferToFormal(): boolean {
    const { project_status, project_property, to_be_formal_project } = this.wbsService.projectInfo;
    return (
      (project_status === '10' || project_status === '30') &&
      project_property === '10' &&
      to_be_formal_project === false &&
      this.wbsTabsService.potentialStatus === 0
    );
  }

  /**
   * 潜在转为正式项目
   */
  transferToFormal(): void {
    if (this.wbsService.projectInfo?.project_status === '50') {
      this.messageService.warning(
        this.translateService.instant('dj-pcc-专案已暂停，不可转为正式专案')
      );
      return;
    }
    this.commonService
      .getProjectChangeStatus(this.wbsService.projectInfo.project_no, ['1', '4', '5'], '1')
      .subscribe(
        (res) => {
          if (res.data?.project_info[0]?.check_result) {
            this.wbsTabsService.potentialStatus = 1;
            this.changTabIndex.emit();
          }
          this.changeRef.markForCheck();
        },
        (error) => {
          this.changeRef.markForCheck();
          return;
        }
      );
  }

  initProjectChangeFun() {
    this.$projectChange.pipe(debounceTime(300)).subscribe((change: any) => {
      this.initiateProjectChanges();
    });
  }

  callIinitiateProjectChanges() {
    this.$projectChange.next();
  }

  initiateProjectChanges(): void {
    if (!this.isShowInitiateProjectChangesBtn) {
      return;
    }
    const project_no_o = this.wbsService.projectInfo?.project_no;
    this.wbsService.getInfoCheck(project_no_o).subscribe((res) => {
      if (res.data && res.data?.check_result) {
        this.messageService.warning(res.data?.check_result);
        this.changeRef.markForCheck();
        return;
      } else {
        this.commonService
          .getProjectChangeStatus(this.wbsService.projectInfo?.project_no, ['1', '4', '5'], '1')
          .subscribe(
            (result: any): void => {
              this.modalService.confirm({
                nzTitle: this.translateService.instant('dj-c-提示'),
                nzContent: this.translateService.instant(
                  'dj-pcc-请注意，发起项目变更，将会自动关闭该项目下进行中的协同计划排定相关任务、计划时程异常相关任务、怠工异常相关任务！是否确认发起项目变更？'
                ),
                nzOkText: this.translateService.instant('dj-c-确定'),
                nzCancelText: this.translateService.instant('dj-c-取消'),
                nzClassName: 'confirm-modal-center-sty modal-content-center',
                nzMaskClosable: false,
                nzOnOk: (): void => {
                  this.isShowChangeInfo = true;
                  this.changeRef.markForCheck();
                },
                nzOnCancel: (): void => {
                  this.changeRef.markForCheck();
                  return;
                },
              });
            },
            (error) => {}
          );
      }
    });
  }

  changeReasonCancel() {
    this.synchronizeChangeTasks = false;
    this.changeReasonInfo = '';
    this.isShowChangeInfo = false;
    this.callTabLoading.emit({ type: 'loading', value: false });
    this.changeRef.markForCheck();
  }

  async changeReasonOk(): Promise<any> {
    const project_no_o = this.wbsService.projectInfo?.project_no;
    if (!this.changeReasonInfo || !project_no_o) {
      this.messageService.warning(this.translateService.instant('dj-pcc-缺少必要参数'));
      return;
    }
    this.callTabLoading.emit({ type: 'loading', value: true });
    const params = {
      change_type: this.synchronizeChangeTasks ? '2' : '1',
      project_change_doc_info: [
        {
          project_no: project_no_o,
          change_reason: this.changeReasonInfo,
        },
      ],
    };

    // 发起项目变更，调用API-138
    this.commonService.getInvData('bm.pisc.project.change.doc.create', params).subscribe(
      async (res: any): Promise<void> => {
        // 走流程
        if (res.data?.project_change_doc_info && res.data?.project_change_doc_info[0]) {
          const { project_no, change_version } = res.data.project_change_doc_info[0];
          if (project_no && change_version) {
            // 1.给项目负责人派发项目变更任务卡
            const project_change_doc_info = [{ project_no: project_no_o, change_version }];
            await this.commonService
              .publishProjectChange(
                project_change_doc_info,
                'PCC_mainline_project_projectChange',
                {
                  project_change_doc_info,
                  project_type_get: this.wbsService.projectInfo.project_type_no,
                },
                this.wbsService.projectInfo.eoc_company_id
              )
              .toPromise();
            this.commonService.getProjectChangeStatus(project_no, ['1'], '2').subscribe(
              (resStauts: any): void => {
                // 若回参.存在否=true，显示 项目变更中
                const check_result = resStauts.data?.project_info[0]?.check_result;
                this.wbsService.projectChangeStatus['check_type_init'] = check_result;
                this.wbsService.$projectChangeStatusSubscribe.next({
                  type: 'check_type_init',
                  check_type_init: check_result,
                });
                this.changeRef.markForCheck();
              },
              (error) => {
                this.wbsService.projectChangeStatus['check_type_init'] = true;
                this.wbsService.$projectChangeStatusSubscribe.next({
                  type: 'check_type_init',
                  check_type_init: true,
                });
                this.changeRef.markForCheck();
              }
            );
          }
          // 2.回收协同计划排定的任务卡和项目卡
          // pcc_closeTeamWork
          this.wbsService.changeProjectCloseTeamWork(project_no_o).subscribe();

          // 3.回收计划时程异常相关任务卡和项目卡
          // pcc_closePlanChange_manual
          this.wbsService.closePlanChangeManual(project_no_o).subscribe();

          // 4.回收怠工处理异常相关任务卡和项目卡
          // pcc_finishTaskThenCheckGoSlowTask
          this.wbsService.finishTaskThenCheckGoSlowTask(project_no_o).subscribe();
        } else {
          this.changeReasonCancel();
        }
        this.changeReasonCancel();
      },
      (error) => {
        this.changeReasonCancel();
      }
    );
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

  /**
   * 取消转为正式专案
   */
  cancelTransfer(): void {
    this.wbsTabsService.potentialStatus = 0;
  }

  getProjectStatustypeNo(): boolean {
    const { projectInfo } = this.wbsService;
    return projectInfo.project_status === '10' && !projectInfo.project_type_no;
  }

  /**
   * 启动项目，按钮事件
   */
  onStartProject(event): void {
    if (event.target.className.indexOf('start-disable') !== -1) {
      return;
    }
    this.startProjectConfim();
  }

  /**
   * 启动项目确认，开窗
   */
  startProjectConfim(): void {
    this.modalService.confirm({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: this.translateService.instant(
        'dj-default-请确认计划已排定完成，是否确认启动项目？'
      ),
      nzCancelText: this.translateService.instant('dj-c-取消'),
      nzOkText: this.translateService.instant('dj-c-确定'),
      nzClassName: 'confirm-modal-center-sty modal-content-center',
      nzOnOk: (): void => {
        this.startProject.emit();
      },
      nzOnCancel: (): void => {
        this.wbsTabsService.isShowStart = true;
        this.wbsService.projectInfo.project_status = '10';
        this.changeRef.markForCheck();
      },
    });
  }

  onDeleteProject(): void {
    const project_no = this.wbsService?.projectInfo?.project_no ?? this.wbsService.project_no;
    if (this.wbsService?.projectInfo?.project_status === '10' && project_no && this.isCanDelete) {
      this.modalService.confirm({
        nzContent: this.translateService.instant('dj-pcc-确定项目删除'),
        nzOkText: this.translateService.instant('dj-c-确定'),
        nzCancelText: this.translateService.instant('dj-c-取消'),
        nzClassName: 'confirm-modal-center-sty modal-content-center',
        nzOnOk: (): void => {
          this.commonService
            .getInvData('bm.pisc.assist.schedule.get', { assist_schedule_info: [{ project_no }] })
            .subscribe((res1: any): void => {
              const { assist_schedule_info } = res1?.data ?? {};
              const params = {
                project_info: [
                  {
                    project_no: project_no,
                    operation_no: this.userService.getUser('userId'),
                    operation_name: this.userService.getUser('userName'),
                  },
                ],
              };
              this.commonService
                .getInvData('project.info.delete', params)
                .subscribe(async (res) => {
                  if (res.data?.project_info && res.data?.project_info[0]?.error_msg) {
                    this.messageService.error(res.data?.project_info[0]?.error_msg);
                    return;
                  } else {
                    // 光斯奥个案项目删除
                    await this.projectDeleteIndCaseHandler(project_no);
                    // pcc_closeTeamWork
                    this.wbsService.deleteCard2(project_no, assist_schedule_info).subscribe();
                    // pcc_closeProjectNotStart
                    this.wbsService.deleteCard(project_no).subscribe();
                    // pcc_closeMainProject
                    this.wbsService.cancelCard(project_no).subscribe();
                    // 启动蒙版弹窗告知
                    this.modalService.info({
                      nzTitle: this.translateService.instant('dj-c-提示'),
                      nzContent: this.translateService.instant('dj-pcc-项目删除提示'),
                      nzOkText: this.translateService.instant('dj-c-确定'),
                      nzClassName: 'confirm-modal-center-sty modal-content-center',
                      nzOnOk: (): void => {
                        this.parentChangeFn.emit();
                      },
                    });
                  }
                  this.changeRef.markForCheck();
                });
            });
        },
      });
    } else {
      return;
    }
  }
  /**
   * 光斯奥个案项目删除
   * @param project_no 项目编号
   */
  projectDeleteIndCaseHandler(project_no): Promise<any> {
    if (!this.dynamicCustomizedService.isGaosiaoIndCase) {
      return Promise.resolve();
    }
    return this.individualCaseAPIService.UC_PROJECT_BUSINESS_OPPORTUNITY_INFO_DELETE([
      {
        project_no,
      },
    ]);
  }
}
