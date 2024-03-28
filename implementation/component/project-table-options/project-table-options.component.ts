import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { AthBasicComponent } from '@athena/design-ui/src/components/table';
import { ICellRendererParams } from 'ag-grid-community';
import { ButtonType } from '../add-subproject-card/add-subproject-card.interface';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { APIService } from '../../service/api.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { DwUserService } from '@webdpt/framework/user';
import { ProjectTableOptionsService } from './project-table-options.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TaskWbsListService } from '../../programs/task-detail/cooperation-task/components/task-wbs-list/task-wbs-list.service';
@Component({
  selector: 'app-project-table-options',
  templateUrl: './project-table-options.component.html',
  styleUrls: ['./project-table-options.component.less'],
  providers: [ProjectTableOptionsService],
})
export class ProjectTableOptionsComponent extends AthBasicComponent {
  @Input() source;
  @Input() tableEdit = true;
  @Input() root_task_card;
  @Input() signOff = false;
  @Input() taskChildrenNos: any = [];
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();
  @ViewChild('changeReason') changeReason: any;
  taskDetail: any = {};
  moreVisible: boolean = false;
  Entry = Entry;
  // 删除任务卡
  confirmDeleteVisible: boolean = false;

  finalList: any[] = [];

  // 变更状态
  change_status: string;
  // 原任务状态
  old_task_status: string;
  cancelCollaborationOk: boolean = false;
  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    public commonService: CommonService,
    private apiService: APIService,
    protected changeRef: ChangeDetectorRef,
    private athMessageService: AthMessageService,
    private userService: DwUserService,
    private messageService: NzMessageService,
    private projectTableOptionsService: ProjectTableOptionsService,
    private taskWbsListService: TaskWbsListService
  ) {
    super();
  }
  /**
   * 初始化勾子函数
   *
   * @param params
   */
  athOnInit(params: ICellRendererParams) {
    super.athOnInit(params);
    this.taskDetail = params.data.value;
  }

  preview(event) {
    this.addSubProjectCardService.isPreview = true;
    this.addSubProjectCardService.showAddTaskCard = false;
    event.stopPropagation();
    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(this.taskDetail); // 获取每列第一个任务卡
    const title =
      this.taskDetail.level === 0
        ? this.translateService.instant('dj-c-预览')
        : this.translateService.instant('dj-c-预览');
    this.addSubProjectCardService.openAddSubProjectCard(
      title,
      ButtonType.PREVIEW,
      firstLevelTaskCard,
      this.taskDetail,
      this.source
    );
  }

  mainOperateConditionAggregation() {
    if (this.signOff) {
      return false;
    }
    if (this.source === Entry.projectChange) {
      return true;
    }
    if (this.source === Entry.maintain) {
      return true;
    }
    // 协同定制页面
    if (this.source === Entry.collaborate) {
      if (!this.wbsService.editable) {
        return false;
      }
      // 任务的计划排定状态为1.进行中, 不禁用
      if (this?.root_task_card?.schedule_status !== '1') {
        return false;
      }
      // 协同排定计划的一级计划，禁用[...]
      if (this.taskDetail.isRootTaskCard) {
        return false;
      }
      // 任务状态 不是是10.未开始 或 不是20.进行中,禁用[...]
      return ['10', '20'].includes(this.taskDetail.old_task_status);
    }
    return (
      this.tableEdit &&
      !this.wbsService.needRefresh &&
      (this.taskDetail.task_status !== '30' || this.taskDetail.task_status !== 30)
    );
  }

  // 判断是否可编辑删除（不用）
  async editOrDelete(event: any): Promise<void> {
    event.stopPropagation();
    if (this.source === Entry.projectChange) {
      const result = await this.wbsService.checkChangeForbidden(this.taskDetail.task_no);
      const { change_status, old_task_status } = result;
      this.change_status = change_status;
      this.old_task_status = old_task_status;
      if (change_status === '1' && ['10', '20'].includes(old_task_status)) {
        this.getDesignStatus(this.taskDetail);
        const params = {
          excluded_already_deleted_task: true,
          project_change_task_detail_info: [
            {
              project_no: this.wbsService.project_no,
              change_version: this.wbsService.change_version,
              task_no: this.taskDetail.task_no,
            },
          ],
        };
        this.taskDetail.isOperationsShow = false;
        this.commonService
          .getInvData('bm.pisc.project.change.task.detail.get', params)
          .subscribe((res: any): void => {
            this.resetItemDateAndShow(
              this.taskDetail,
              res.data?.project_change_task_detail_info[0]
            );
            this.changeRef.markForCheck();
          });
      }
    } else if (this.source === Entry.collaborate) {
      this.getDesignStatus(this.taskDetail);
      this.taskDetail.isOperationsShow = false;
      // 代理卡片，则不做权限管控
      // await this.wbsService.setCollaborateAgentIdSameUserId();
      if (!this.wbsService.collaborateAgentIdSameUserId) {
        // 协同定制页面：当前登录员工是当前协同排定的一级计划的负责人才可继续操作
        const rootTaskInfo = await this.taskWbsListService.getRootTaskInfo(
          this.root_task_card?.root_task_no
        );
        if (!rootTaskInfo.isCollaboratePlanOwner) {
          this.messageService.error(this.translateService.instant('dj-pcc-非负责人'));
          this.moreVisible = false;
          this.changeRef.markForCheck();
          this.changeRef.detectChanges();
          return;
        }
        // 协同任务卡需要校验根任务协同计划排定状态为进行中才可以编辑
        const assistScheduleInfo = await this.taskWbsListService.getAssistScheduleInfo(
          this.root_task_card?.root_task_no
        );
        if (assistScheduleInfo[0]?.schedule_status !== '1') {
          this.messageService.error(this.translateService.instant('dj-pcc-不为进行中'));
          this.moreVisible = false;
          this.changeRef.markForCheck();
          this.changeRef.detectChanges();
          return;
        }
      }
      const assist_task_detail_info = await this.taskWbsListService.getAssistTaskDetailInfo(
        this.taskDetail
      );
      this.resetItemDateAndShow(this.taskDetail, assist_task_detail_info[0]);
    } else {
      // this.moreDisabled = true;
      this.getDesignStatus(this.taskDetail);
      const params = {
        project_info: [
          {
            control_mode: '1',
            task_property: '1',
            project_no: this.taskDetail.project_no,
            task_no: this.taskDetail.task_no,
          },
        ],
      };
      this.moreVisible = false;
      this.commonService.getInvData('task.info.get', params).subscribe((res: any): void => {
        const check_type = ['1', '2', '4', '5'];
        if (this.taskDetail.task_no !== this.taskDetail.upper_level_task_no) {
          check_type.push('3');
        }
        this.commonService
          .getProjectChangeStatus(
            this.taskDetail.project_no,
            check_type,
            '1',
            this.taskDetail.task_no
          )
          .subscribe(
            (resChange: any): void => {
              this.resetItemDateAndShow(this.taskDetail, res.data?.project_info[0]);
              this.changeRef.markForCheck();
            },
            (error) => {}
          );
      });
    }
  }

  /**
   * 控制负责人是否禁用：取得plm工作项数组后，判断是否全部为未启动，如果全部未启动，则禁用负责人
   */
  getDesignStatus(currentCardInfo) {
    const { task_status, task_category, project_no, task_no } = currentCardInfo;
    if ((task_status === 20 || task_status === '20') && task_category === 'PLM') {
      currentCardInfo['plmDisabledEdit'] = true;
      this.apiService
        .work_Item_Data_Get([{ project_no: project_no, task_no: task_no }])
        .then((plmResult) => {
          // 若PLM状态（其中一笔） = 已完成（completed），子项开窗所有栏位只读
          const completed =
            plmResult.filter((item) => item.design_status === 'completed').length > 0
              ? 'completed'
              : '';
          let notStart = '';
          if (!completed) {
            // 若PLM状态（多笔）全部 = 未启动（notStart） 则负责人、执行人可删除/新增；否则只能新增执行人，负责人不可修改
            notStart =
              plmResult.filter((item) => item.design_status === 'notStart').length ===
              plmResult.length
                ? 'notStart'
                : '';
          }
          currentCardInfo['designStatus'] = completed ? completed : notStart;
          currentCardInfo['plmDisabledEdit'] = false;
        });
    }
  }

  resetItemDateAndShow(item, data): void {
    item.task_dependency_info = data?.task_dependency_info;
    item.assist_task_dependency_info = data?.assist_task_dependency_info; // 协同排定任务依赖关系信息
    item.is_issue_task_card = data?.is_issue_task_card;
    item.attachment = data?.attachment;
    item.task_status = data?.task_status;
    item.old_task_status = data?.old_task_status;
    const task_status = Number(data.task_status);
    item.canEdit = task_status === 30 ? false : [10, 20].includes(task_status) || this.tableEdit;
    item.remarks = data?.remarks;
    item.upper_level_task_no = data?.upper_level_task_no;
    if (Number(data?.project_status) > 10) {
      this.wbsService.projectInfo.project_status = data.project_status;
    }
    item.unDelete = !!(item.task_status > 10 || item.unDelete || !this.tableEdit);
    this.showEditOrDelete();
    this.changeRef.markForCheck();
  }

  showEditOrDelete() {
    this.moreVisible = !this.moreVisible;
    this.changeRef.markForCheck();
    this.changeRef.detectChanges();
  }

  edit(e) {
    // plm项目需要调plm.work.item.status.process接口查询状态用于管控负责人栏位是否禁用，该接口比较慢会造成打开wbs卡片后还未请求返回导致管控失效
    if (
      (!this.taskDetail.canEdit && this.source !== Entry.maintain) ||
      this.taskDetail.plmDisabledEdit || !this.moreVisible
    ) {
      return;
    }
    this.addSubProjectCardService.showAddTaskCard = false;
    this.taskDetail.isOperationsShow = false;
    event.stopPropagation();
    const firstLevelTaskCard = this.wbsService.getCurrentCorridor(this.taskDetail); // 获取每列第一个任务卡
    const title =
      this.taskDetail.level === 0
        ? this.translateService.instant('dj-default-编辑一级计划')
        : this.translateService.instant('dj-default-编辑子项');
    this.moreVisible = false;
    this.addSubProjectCardService.openAddSubProjectCard(
      title,
      ButtonType.EDIT,
      firstLevelTaskCard,
      this.taskDetail,
      this.source
    );
  }

  /**
   * 删除按钮是否可用
   * @returns
   */
  isDisableDeleteButton() {
    //  协同定制页
    if (this.source === Entry.collaborate) {
      // 项目状态是10.未开始，按钮可用
      this.taskDetail.unDelete = false;
      if (this.wbsService.collaborateAgentIdSameUserId) {
        return false;
      }
      if (this.wbsService.projectInfo.project_status === '10') {
        return false;
      }
      // 项目状态是30.进行中，并且 当前任务不存在任务比重 < 100 % 的下阶任务，并且任务状态 = 10.未开始，按钮可用
      if (
        this.wbsService.projectInfo.project_status === '30' &&
        !this.hasTaskProportionCheck(this.taskDetail) &&
        this.taskDetail.old_task_status === '10'
      ) {
        return false;
      }
      this.taskDetail.unDelete = true;
      return true;
    } else if (this.source === Entry.projectChange) {
      // 项目变更状态是1.进行中 且 当前任务不存在任务比重<100%的下阶任务 且 任务状态是10.未开始
      return !(
        this.change_status === '1' &&
        this.old_task_status === '10' &&
        !this.hasTaskProportionCheckForPC(this.taskDetail)
      );
    } else {
      return (
        this.taskDetail.complete_rate !== 0 ||
        this.taskDetail.isCollaborationCard ||
        this.taskDetail.unDelete ||
        !this.taskDetail.canEdit ||
        this.getTaskProportionCheck() ||
        this.hasTaskProportionCheck(this.taskDetail)
      );
    }
  }

  async delete(e) {
    if(!this.moreVisible){
      return ;
    }
    if (this.source === Entry.collaborate) {
      if (this.taskDetail?.unDelete) {
        return;
      }
      // 点击‘...’，选择删除，删除可用条件，需要实时调用查询项目状态
      const res = await this.projectTableOptionsService.getProjectInfo();
      // 更新项目状态
      this.wbsService.projectInfo.project_status = res.project_status;
      // 项目状态是10.未开始,项目状态是30.进行中才有可能可用
      if (!['10', '30'].includes(this.wbsService.projectInfo.project_status)) {
        this.messageService.error(this.translateService.instant('dj-pcc-不可删除'));
        return;
      }
    } else {
      if (this.taskDetail?.noEdit || this.taskDetail?.unDelete) {
        return;
      }
    }
    if (this.taskDetail?.noEdit || this.taskDetail?.unDelete) {
      return;
    }
    if (this.source !== Entry.maintain) {
      const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
      this.wbsService.needRefresh = data.check_result;
    }
    if (this.wbsService.needRefresh && this.source !== Entry.collaborate) {
      this.athMessageService.error(this.wbsService.needRefresh);
      this.wbsService.changeWbs$.next();
      return;
    }
    if (this.getTaskProportionCheck() || this.hasTaskProportionCheck(this.taskDetail)) {
      return;
    }
    e.stopPropagation();
    this.moreVisible = false;
    this.confirmDeleteVisible = true;
    this.changeRef.markForCheck();
  }

  // 删除任务卡点击确定
  handleOk() {
    this.confirmDeleteVisible = false;
    const { project_status } = this.wbsService.projectInfo;
    // 项目状态30 project_status === 30 且 项目计划维护入口时需输入变更原因
    // if (Number(project_status) === 30 && ((this.source === Entry.card) || (this.source === Entry.collaborate))) {
    if (Number(project_status) === 30 && this.source === Entry.card) {
      this.changeReason.showModal();
    } else {
      this.deleteRequest();
    }
  }

  // 变更原因确定
  changeReasonOk(value) {
    this.deleteRequest(value);
  }

  // 删除任务卡点击删除
  handleCancel() {
    this.confirmDeleteVisible = false;
  }
  // 删除任务卡提交
  async deleteRequest(changeReason?: string): Promise<void> {
    const task_info = {
      task_no: this.taskDetail.task_no,
      project_no: this.wbsService.project_no,
      operation_no: this.userService.getUser('userId'),
      operation_name: this.userService.getUser('userName'),
      task_property: this.source === Entry.maintain ? '2' : '1',
    };
    if (changeReason) {
      task_info['change_reason'] = changeReason;
      task_info['record_task_change'] = true;
    } else {
      task_info['record_task_change'] = false;
    }
    if (this.source === Entry.collaborate) {
      task_info['record_task_change'] =
        Number(this.wbsService.projectInfo?.project_status) < 30 ? false : true;
    }
    if (this.source === Entry.maintain) {
      Reflect.deleteProperty(task_info, 'operation_no');
      Reflect.deleteProperty(task_info, 'operation_name');
    }
    // 若交付設計器.是否依賴地端=true傳入Y否則傳入N
    task_info['sync_steady_state'] = this.wbsService.hasGroundEnd !== 'Y' ? null : 'Y'; // 同步稳态	Y.同步；N.不同步 不传或传null，默认Y
    let res;
    if (this.source === Entry.collaborate) {
      const assist_task_detail_info = {
        // 协同排定任务明细信息
        can_delete_required_task: false,
        assist_task_detail_info: [
          {
            assist_schedule_seq: this.root_task_card.assist_schedule_seq, // 协助排定计划序号
            project_no: this.wbsService.project_no, // 项目编号
            root_task_no: this.root_task_card.root_task_no, // 根任务编号
            task_no: this.taskDetail.task_no, // 任务编号
          },
        ],
      };
      res = await this.projectTableOptionsService.deleteAssistTaskDetail(assist_task_detail_info);
      if (res?.error_msg) {
        this.messageService.error(res?.error_msg);
        return;
      }
    } else if (this.source === Entry.projectChange) {
      const deleteParams = {
        sync_steady_state: this.wbsService.hasGroundEnd !== 'Y' ? null : 'Y',
        project_change_task_detail_info: [
          {
            project_no: this.wbsService.project_no, // 项目编号
            change_version: this.wbsService.change_version,
            task_no: this.taskDetail.task_no, // 任务编号
          },
        ],
      };
      res = await this.projectTableOptionsService.deleteTaskChangeInfo(deleteParams);
      if (res?.error_msg) {
        this.messageService.error(res?.error_msg);
        return;
      }
    } else {
      let deleteParams;
      if (this.source === Entry.card) {
        deleteParams = {
          task_info: [task_info],
          is_sync_document: this.wbsService.is_sync_document,
        };
      } else {
        deleteParams = { task_info: [task_info] };
      }
      res = await this.projectTableOptionsService.deleteTaskInfo(deleteParams);
      if (res?.data?.task_info?.[0]?.project_no_mistake_message) {
        this.messageService.error(res?.data?.task_info?.[0]?.project_no_mistake_message);
        return;
      }
    }
    // 任务比重校验 -- delete
    this.changeTaskCardProportion();
    this.wbsService.pageChange.next(true);

    this.deleteCard(this.wbsService.pageDatas, this.taskDetail);
    this.wbsService.$newCardInfo.next({});
    this.wbsService.cardLevelHandle(this.wbsService.pageDatas, 0);
    this.wbsService.calculationChildrenLength(this.wbsService.pageDatas);
    this.messageService.success(this.translateService.instant('dj-default-删除成功'));

    // 可以协同的一级计划捞取方式:
    if (this.wbsService.projectInfo?.project_status === '30') {
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter((task) => {
        return (
          task.liable_person_code &&
          task.plan_start_date &&
          task.plan_finish_date &&
          task.complete_rate < 100 &&
          task.upper_level_task_no === task.task_no
        );
      });
      this.changeRef.markForCheck();
    } else {
      // 启动前(项目状态=10.未开始)
      this.wbsService.firstTaskCardList = this.wbsService.pageDatas.filter(
        (task: any): void =>
          task.liable_person_code && task.plan_start_date && task.plan_finish_date
      );
    }

    if (this.source === Entry.card) {
      this.finalList = [];
      for (const i in res.data.task_info) {
        if (res.data.task_info[i].task_no) {
          this.finalList.push({
            project_no: res.data.task_info[i].project_no,
            task_no: res.data.task_info[i].task_no,
          });
        }
      }
      const tenantId = this.userService.getUser('tenantId');
      if (this.finalList.length > 0) {
        if (this.wbsService.modelType.indexOf('DTD') !== -1) {
          const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
          const id = this.userService.getUser('userId');
          this.addSubProjectCardService
            .addOrDeleteTaskCardNew(
              DwUserInfo.acceptLanguage,
              id,
              this.finalList,
              this.commonService.content
            )
            .subscribe((res2) => {});
        } else {
          this.addSubProjectCardService
            .addOrDeleteTaskCard(tenantId, this.finalList, this.commonService.content)
            .subscribe((res2) => {});
        }
      }
    }

    this.changeRef.markForCheck();

    this.confirmDeleteVisible = false;
  }

  // 子项开窗，新增、编辑后，获取最新的任务比重信息
  changeTaskCardProportion(): void {
    this.changeWbsTaskCardProportion.emit();
    this.changeRef.markForCheck();
  }

  deleteCard(list, currentCard) {
    list.map((item, index) => {
      if (item.task_no === currentCard.task_no) {
        list.splice(index, 1);
        this.changeRef.markForCheck();
      } else {
        if (item.children && item.children.length) {
          this.deleteCard(item.children, currentCard);
        }
      }
    });
  }

  // 项目已启动，任务比重校验不通过，屏蔽按钮功能
  getTaskProportionCheck(): boolean {
    // 存在一级任务的任务比重<100% ==> 整个计划维护页面禁用WBS的删除功能、添加子项功能、新建一级计划
    if (
      Number(this.wbsService.projectInfo?.project_status) > 20 &&
      (this.source === Entry.card ||
        this.source === Entry.collaborate ||
        this.source === Entry.projectChange)
    ) {
      return this.wbsService.pageDatas.find((element) => element.task_proportion < 1) !== undefined;
    } else {
      return false;
    }
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no 项目变更
  hasTaskProportionCheckForPC(data): boolean {
    let taskNos: Set<string> = new Set();
    // + 检查各一级任务的整棵树下，是否存在任务比重<100%
    let array: Array<string> = [];
    this.wbsService.pageDatas.forEach((element) => {
      const arr: Array<string> = [];
      const flag: Array<string> = [];
      this.getUpperTask(element, arr, flag);
      if (flag[0]) {
        array = [...array, ...arr];
      }
    });
    taskNos = new Set([...array].filter((v) => v !== ''));
    return taskNos.has(data.task_no);
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  hasTaskProportionCheck(data): boolean {
    let taskNos: Set<string> = new Set();
    if (
      Number(this.wbsService.projectInfo?.project_status) > 20 &&
      (this.source === Entry.card || this.source === Entry.collaborate)
    ) {
      // + 检查各一级任务的整棵树下，是否存在任务比重<100%
      let array: Array<string> = [];
      this.wbsService.pageDatas.forEach((element) => {
        const arr: Array<string> = [];
        const flag: Array<string> = [];
        this.getUpperTask(element, arr, flag);
        if (flag[0]) {
          array = [...array, ...arr];
        }
      });
      taskNos = new Set([...array].filter((v) => v !== ''));
    }
    return taskNos.has(data.task_no);
  }

  // 找到每组计划中，下阶任务的任务比重<1的，返回每组计划的任务的task_no
  getUpperTask(children, array, flag) {
    if (children) {
      array.push(children.task_no);
      if (children.task_proportion < 1) {
        flag.push(true);
      }
      if (children.children.length) {
        children.children.forEach((v) => {
          this.getUpperTask(v, array, flag);
        });
      }
    }
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
  cancelCollaborationSuccess() {
    this.moreVisible = false;
    this.cancelCollaborationOk = true;
    this.wbsService.pageChange.next(true);
  }
  cancelCollaborationFullFail() {
    this.cancelCollaborationOk = false;
  }
}
