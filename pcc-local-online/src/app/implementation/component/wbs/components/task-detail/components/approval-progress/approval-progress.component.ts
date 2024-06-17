import { Component, Input, OnInit } from '@angular/core';
import { isNotNone } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DwLanguageService } from '@webdpt/framework/language';
import * as moment from 'moment';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { TaskDetailService } from '../../task-detail.service';
import { DynamicWbsService } from '../../../../wbs.service';

@Component({
  selector: 'app-approval-progress',
  templateUrl: './approval-progress.component.html',
  styleUrls: ['./approval-progress.component.less'],
  providers: [TaskDetailService, DynamicWbsService]
})
export class ApprovalProgressComponent implements OnInit {
  notifySignTypeList: any[] = [81, 82];
  signOffProgressData: any;
  @Input() taskOrProjectId: string = '';
  @Input() idType: string = 'task';
  @Input() project_no = '';
  @Input() isChangeApprove: Boolean = false;
  @Input() wbsService;

  // 退回信息
  approvalInfo: any;

  public progressData: any[] = [];
  public loading = true;
  public personList: any[] = [];
  returnInfo: any[];

  constructor(
    private translateService: TranslateService,
    private modalRef: NzModalRef,
    public taskDetailService: TaskDetailService,
    // public wbsService: DynamicWbsService,
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.getTaskApproval();
  }

  /**
   * 获取签核进度信息
   */
  async getTaskApproval(): Promise<void> {
    if (this.idType === 'project' && !this.taskOrProjectId) {
      this.taskOrProjectId = await this.wbsService.getProjectIdForQueryApprove(this.project_no, this.isChangeApprove);
    }
    if (this.taskOrProjectId) {
      this.taskDetailService.getTaskApproval(this.taskOrProjectId).subscribe(
        (res) => {
          this.progressData = res.data;
          // this.getApprovalInfo();
          this.loading = false;
        },
        (error) => {
          this.loading = false;
        }
      );
      return;
    }
    this.loading = false;
  }

  /**
   * 获取最新的退回消息
   * subState = 60 或 150。或者 是createType = 2 或 3。
   * createType：2 退回重签 3:退回重办
   */
  getApprovalInfo(): void {
    this.progressData?.forEach((progressInfo: any): void => {
      progressInfo?.workitemList?.forEach((p): void => {
        if (p.subState === 60 || p.subState === 150 || p.createType === 2 || p.createType === 3) {
          this.approvalInfo = p;
        }
      });
      if (
        this.approvalInfo?.subState === 60
        || this.approvalInfo?.subState === 150
        || this.approvalInfo?.createType === 2
        || this.approvalInfo?.createType === 3
      ) {
        this.returnInfo = [
          {
            title: 'dj-退回意见',
            content: this.approvalInfo.comment,
          },
          {
            title: 'dj-退回时间',
            content: moment(this.approvalInfo.closedTime).format('YYYY/MM/DD'),
          },
          {
            title: 'dj-退回人',
            content: this.approvalInfo.performerName,
          },
        ];
      }
    });
  }

  showComment(item: any): void {
    const { checkPoint, event } = item;
    event.stopPropagation();
    this.hideComment();
    checkPoint.isShowComment = !checkPoint.isShowComment;
  }

  hideComment(): void {
    if (this.progressData && this.progressData.length > 0) {
      this.progressData.forEach((item) => {
        if (item.workitemList && item.workitemList.length > 0) {
          item.workitemList.forEach((workitem) => {
            if (workitem.isShowComment) {
              workitem.isShowComment = false;
            }
          });
        }
      });
    }
  }

  handleOk(): void {
    this.modalRef.triggerOk();
  }
}
