import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  ChangeDetectorRef,
  SkipSelf,
  OnChanges,
} from '@angular/core';
import {
  isEmpty,
  OpenImService,
  DynamicUserBehaviorCommService,
} from '@ng-dynamic-forms/core';
import { MessageTipService } from '@ng-dynamic-forms/ui-ant-web';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { CommonService } from 'app/customization/task-project-center-console/service/common.service';
import * as moment from 'moment';
import { DynamicWbsService } from '../../wbs.service';

@Component({
  selector: 'app-progress-tracking-card',
  templateUrl: './progress-tracking-card.component.html',
  styleUrls: [
    './progress-tracking-card.component.less',
  ],
})
export class ProgressTrackingCardComponent implements OnInit, OnChanges {
  @Input() progressTrackingList: any;
  progressTrackingData: Array<any>;
  notifyPopVisible: boolean = false;
  notifyItemData: any;
  msgModalVisible: boolean = false;
  msgContentVal: string;
  msgUserName: string;
  taskMemberList: any = [];
  liablePersonCode: string;
  taskInfo: any;
  projectPersonCode: string;
  closeList = [];
  showTaskDetailCode: string;

  constructor(
    @SkipSelf()
    public wbsService: DynamicWbsService,
    private translateService: TranslateService,
    private messageTipService: MessageTipService,
    protected changeRef: ChangeDetectorRef,
    private userService: DwUserService,
    public commonService: CommonService,
    public openImService: OpenImService,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
  ) {
    this.showTaskDetailCode = 'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB006-PCC_BUTTON004';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.progressTrackingList && changes.progressTrackingList.currentValue) {
      this.progressTrackingData = changes.progressTrackingList.currentValue.length
        ? changes.progressTrackingList.currentValue
        : [changes.progressTrackingList.currentValue];
    }
  }

  ngOnInit() { }

  /**
   *
   * @param item 展开/收起子节点
   */
  showOrHideChildren(item: any, e: any) {
    e.stopPropagation();
    item.isChildrenshow = !item.isChildrenshow;
    const corridorData = this.wbsService.getCurrentCorridor(item);
    this.wbsService.calculationChildrenLength([corridorData]);
    this.changeRef.markForCheck();
  }

  switchColor(status, isOverdue) {
    switch (status) {
      case 30:
        return isOverdue
          ? ['rgb(212, 218, 225)', 'rgb(212, 218, 225)', 'rgb(226, 37, 54)']
          : ['rgb(212, 218, 225)', 'rgb(212, 218, 225)', '#39454f'];
      case 20:
        return isOverdue
          ? ['rgb(231, 213, 211)', 'rgb(226, 37, 54)', '#39454f']
          : ['rgb(210, 225, 246)', 'rgb(20, 93, 253)', '#39454f'];
    }
  }

  searchEmployeeId(performerId: string, item: any): void {
    const task_start = item.plan_start_date.split('/').slice(1, 3).join('/');
    const pro_start = this.wbsService.projectInfo?.plan_start_date
      .split('/')
      .slice(1, 3)
      .join('/');
    const pro_end = this.wbsService.projectInfo?.plan_finish_date
      .split('/')
      .slice(1, 3)
      .join('/');
    this.wbsService.searchEmployeeId({ empId: performerId }).subscribe((res: any): void => {
      this.msgUserName = item.liable_person_name;
      this.notifyItemData = {
        comment: this.msgContentVal,
        performerId: res.data,
        performerName: item.liable_person_name,
        title: `${task_start}需完成${item.task_name}【${pro_start}-${pro_end}${this.wbsService.projectInfo?.project_name}】任务`,
      };
    });
  }

  // 处理发送信息入参json
  handleInputParameter(
    receive: string,
    projectPersonCode: string,
    projectPersonName: string,
    taskInfo: any
  ): any {
    const task_start = taskInfo.plan_start_date.split('/').slice(1, 3).join('/');
    const pro_start = this.wbsService.projectInfo?.plan_start_date
      .split('/')
      .slice(1, 3)
      .join('/');
    const pro_end = this.wbsService.projectInfo?.plan_finish_date
      .split('/')
      .slice(1, 3)
      .join('/');
    return {
      userId: receive,
      tenantId: this.userService.getUser('tenantId'),
      type: 'task',
      subType: 'purchaseApproval_new', // 项目code, tmProjectId
      subTypeCategory: 'INTERNAL_REMIND',
      category: 'NOTICE',
      importance: 1,
      source: 'athena',
      state: 1,
      title: `${projectPersonName}(${projectPersonCode})提醒您关注:`, // title自己定义
      content: {
        id: '', // 项目id
        title: `${projectPersonName}(${projectPersonCode})提醒您关注:`,
        startTime: this.wbsService.projectInfo.plan_start_date, // 项目开始时间
        endTime: this.wbsService.projectInfo.plan_finish_date, // 项目截止时间
        name: this.wbsService.projectInfo.project_name, // 项目名称
        status: 0,
        msg: `${task_start}需完成${taskInfo.task_name}【${pro_start}-${pro_end}${this.wbsService.projectInfo?.project_name}】任务`, // msg自己定义
        messageBoard: [
          {
            comment: this.msgContentVal, // 留言内容
            commenter: {
              roles: [],
              sid: '', // this.userService.getUserInfo(), // 留言者用户sid
              tenantId: this.userService.getUser('tenantId'),
              tenantName: '雅典娜Paas-WF集團',
              tenantSid: this.userService.getUserInfo().tenantSid,
              token: '',
              userId: projectPersonCode,
              userName: `${projectPersonName}(${projectPersonCode})`,
            },
            date: moment().locale('zh-cn').format('YYYY-MM-DD HH:mm:ss'), // 留言日期
          },
        ],
      },
      sendDate: moment().locale('zh-cn').format('YYYY-MM-DD HH:mm:ss'), // 当前发送时间
      startTime: this.wbsService.projectInfo.plan_start_date, // 项目开始时间
      endTime: this.wbsService.projectInfo.plan_finish_date, // 项目截止时间
      noticeMobileApp: true,
    };
  }

  notifyExecutor($event): void {
    if (isEmpty(this.msgContentVal)) {
      this.msgContentVal = this.translateService.instant('dj-c-msg-content');
    }
    if (this.taskMemberList.length) {
      this.taskMemberList.forEach((member: string): void => {
        const data = this.handleInputParameter(
          member,
          this.projectPersonCode,
          this.wbsService.projectInfo.project_leader_name,
          this.taskInfo
        );
        this.wbsService.pushNewMessage(data).subscribe((res: any): void => {
          this.handleMsgCancel();
          this.changeRef.markForCheck();
          this.messageTipService.create(
            $event,
            this.translateService.instant('dj-pcc-已成功通知！'),
            20
          );
        });
      });
    } else {
      const data = this.handleInputParameter(
        this.liablePersonCode,
        this.projectPersonCode,
        this.wbsService.projectInfo.project_leader_name,
        this.taskInfo
      );
      this.wbsService.pushNewMessage(data).subscribe((res: any): void => {
        this.handleMsgCancel();
        this.changeRef.markForCheck();
        this.messageTipService.create(
          $event,
          this.translateService.instant('dj-pcc-已成功通知！'),
          20
        );
      });
    }
  }

  handleMsgCancel() {
    this.msgModalVisible = false;
    this.msgContentVal = null;
  }

  notifyMsgModal(item: any, e): void {
    e.stopPropagation();
    const tenantId = this.userService.getUser('tenantId');
    const param = {
      bizId: tenantId + ';' + item.project_no + ';' + item.task_no,
      id: tenantId + ';' + item.project_no + ';' + item.task_no,
      type: 2,
      source: 'pcc',
    };
    this.openImService.openIm(param);
  }

  // 获取负责人的useId
  getLiablePersonCode(liablePersonCode: string): void {
    this.wbsService.searchEmployeeId({ empId: liablePersonCode }).subscribe((res: any): void => {
      this.liablePersonCode = res.data;
    });
  }

  // 获取执行人的userId
  getTaskMemberInfo(taskMember: Array<any>): void {
    taskMember.forEach((member: any): void => {
      this.wbsService
        .searchEmployeeId({ empId: member.executor_no })
        .subscribe((res: any): void => {
          this.taskMemberList.push(res.data);
        });
    });
  }

  // 获取项目负责人userId
  getProjectPersonCode(): void {
    this.wbsService
      .searchEmployeeId({ empId: this.wbsService.projectInfo.project_leader_code })
      .subscribe((res: any): void => {
        this.projectPersonCode = res.data;
      });
  }

  closeErrorCard(id, event) {
    event.stopPropagation();
    this.closeList.push(id);
  }

  showTaskDetail(item: any): void {
    this.wbsService.taskDetail = item;
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
