import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonService } from 'app/customization/task-project-center-console/service/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { WbsTabsService } from '../../wbs-tabs.service';
import { TranslateService } from '@ngx-translate/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { EventBusService, EventBusSpecialChannel } from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';

@Component({
  selector: 'app-start-project',
  templateUrl: './start-project.component.html',
  styleUrls: ['./start-project.component.less']
})
export class StartProjectComponent implements OnInit {
  @Output() changTabIndex: EventEmitter<any> = new EventEmitter();
  @Output() startProject: EventEmitter<any> = new EventEmitter();
  @Input() isCanDelete:boolean = false;

  key: any;
  subject: Subject<any>;

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
  ) {
    this.key = this.eventBusService.register(EventBusSpecialChannel.baseDate);
    // this.subject = this.eventBusService.getSubject(EventBusSpecialChannel.baseDate);
  }

  get isShowStart() {
    return this.wbsService.projectInfo?.project_status === '10' && this.wbsTabsService.isShowStart;
  }

  ngOnInit(): void {
  }


  /**
   * 潜在转为正式项目
   */
  transferToFormal(): void {
    if (this.wbsService.projectInfo?.project_status === '50') {
      this.messageService.warning(this.translateService.instant('dj-pcc-专案已暂停，不可转为正式专案'));
      return;
    }
    this.wbsTabsService.potentialStatus = 1;
    this.changTabIndex.emit();
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

  onStartProject(event): void {
    if (event.target.className.indexOf('start-disable') !== -1) {
      return;
    }
    this.startProject.emit();
  }

  onDeleteProject(): void {
    const project_no = this.wbsService?.projectInfo?.project_no ?? this.wbsService.project_no;
    if ((this.wbsService?.projectInfo?.project_status === '10') && project_no && this.isCanDelete) {
      this.modalService.confirm({
        nzContent: this.translateService.instant('dj-pcc-确定项目删除'),
        nzOkText: this.translateService.instant('dj-c-确定'),
        nzCancelText: this.translateService.instant('dj-c-取消'),
        nzClassName: 'confirm-modal-center-sty confirm-modal-center-content-sty',
        nzOnOk: (): void => {
          this.commonService.getInvData('bm.pisc.assist.schedule.get', { assist_schedule_info: [{ project_no }] })
            .subscribe((res1: any): void => {
              const { assist_schedule_info } = res1?.data ?? {};
              const params = {
                project_info: [{
                  project_no: project_no,
                  operation_no: this.userService.getUser('userId'),
                  operation_name: this.userService.getUser('userName')
                }]
              };
              this.commonService.getInvData('project.info.delete', params).subscribe((res) => {
                if (res.data?.project_info && res.data?.project_info[0]?.error_msg) {
                  this.messageService.error(res.data?.project_info[0]?.error_msg);
                  return;
                } else {
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
                    nzClassName: 'confirm-modal-center-sty',
                    nzOnOk: (): void => {
                      this.commonService.getInvData('bm.pisc.project.get', { project_info: [{ project_no: project_no }] })
                        .subscribe((res2) => {
                          this.wbsService.projectInfo = res2.data.project_info[0];
                          this.changeRef.markForCheck();
                          this.subject = this.eventBusService.getSubject(this.key);
                          // 刷新当前⻚签
                          this.subject.next({ from: Symbol(), name: 'updateTab', });
                          // 刷新主⻚签
                          this.subject.next({ from: Symbol(), name: 'updateMainTab' });
                        });
                    },
                  });
                }
                this.changeRef.markForCheck();
              });
            });
        },
      });
    } else {
      return ;
    }
  }
}
