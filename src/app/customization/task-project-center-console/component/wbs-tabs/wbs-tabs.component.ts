import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
  PluginLanguageStoreService,
  reportedUserBehavior,
  UserBehaviorOperation,
} from '@ng-dynamic-forms/core';
import { DynamicProjectPlanManageModel } from '../../model/project-plan-manage/project-plan-manage.model';
import { WbsTabsService } from './wbs-tabs.service';
import { CommonService, Entry } from '../../service/common.service';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { forkJoin, Subject } from 'rxjs';
import { DynamicWbsService } from '../wbs/wbs.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DynamicWbsComponent } from '../wbs/wbs.component';
import { debounceTime, map } from 'rxjs/operators';
import { DynamicCustomizedService } from '../../service/dynamic-customized.service';

@Component({
  selector: 'app-dynamic-wbs-tabs',
  templateUrl: './wbs-tabs.component.html',
  styleUrls: ['./wbs-tabs.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicWbsTabsComponent
  extends DynamicFormControlComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProjectPlanManageModel;
  // wbs 入口
  @Input() source: Entry = Entry.card;

  private startProject$ = new Subject<string>();

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();
  @ViewChild('wbsComponent')
  private dynamicWbsComponent!: DynamicWbsComponent;

  // wbs 入口
  Entry = Entry;
  // 是否是新发起的项目
  isNewProcess = '';
  tabIndex: number = 0;
  changeConfigData = null;
  hasGroundEnd: string;

  isCanDelete: boolean = false;

  /** 光斯奥项目计划维护其他信息 */
  gongsiaoProjPlanOthInfoDynamicModel: any;
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsTabsService: WbsTabsService,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    private translateService: TranslateService,
    private userService: DwUserService,
    public fb: FormBuilder,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private pluginLanguageStoreService: PluginLanguageStoreService,
    public wbsService: DynamicWbsService,
    private modal: NzModalService,
    private dynamicCustomizedService: DynamicCustomizedService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    this.wbsTabsService.isShowStart = true;
  }

  ngOnDestroy(): void {
    this.wbsTabsService.potentialStatus = 0;
  }
  // 计划维护
  async ngOnInit() {
    this.commonService.content = this.model?.content ?? {};
    this.wbsService.group = this.group ?? {};
    this.wbsService.modelType = this.model.type ?? '';
    this.wbsService.project_no =
      this.model.content?.executeContext?.taskWithBacklogData?.bpmData?.project_info[0]
        ?.project_no ?? '';
    this.isNewProcess =
      this.model.content?.executeContext?.taskWithBacklogData?.bpmData?.isNewProcess ?? '';
    this.hasGroundEnd = await this.getHasGroundEnd();
    this.wbsTabsService.hasGroundEnd = this.hasGroundEnd;
    this.checkpTaskProportion();
    this.getProjectData();
    this.queryChargePersonList();
    this.monitorStart();
    this.monitorNeedChangeWbs();
    this.initIndividualCaseComp();
  }
  /**
   * 初始化个案
   */
  initIndividualCaseComp() {
    const curTenantId = JSON.parse(window.sessionStorage.getItem('DwUserInfo')).tenantId;
    // 项目计划维护才执行
    if (this.model.type === 'maintenanceProject_DTD-project-detail') {
      this.gongsiaoProjPlanOthInfoDynamicModel = this.dynamicCustomizedService.getComponent({
        tenantIdComponent: curTenantId + '-proj-plan-other-info',
        // disabled: this.source === this.Entry.card && this.taskStatus > 10 ? true : false,
        _component: this,
      });
    }
  }
  monitorNeedChangeWbs(): void {
    this.wbsService.changeWbs$.subscribe((res) => {
      this?.dynamicWbsComponent?.markForCheck();
    });
  }

  /**
   * 是否依赖地端
   * hasGroundEnd:是否依赖地端
   */
  getHasGroundEnd(): Promise<string> {
    return this.commonService
      .hasDependsGround()
      .toPromise()
      .then((res) => res.data.hasGroundEnd);
  }

  monitorStart(): void {
    this.startProject$.pipe(debounceTime(500)).subscribe((res) => {
      this.getTeamworkTaskInfo();
      this?.dynamicWbsComponent?.markForCheck();
    });
  }

  /**
   * 任务比重检查
   * 检查项目下任务占比是否符合100%的规则(敏态)
   */
  checkpTaskProportion(): void {
    this.commonService
      .getInvData('task.proportion.check', {
        project_info: [{ project_no: this.wbsService.project_no }],
        check_all_task: '2',
      })
      .subscribe((res: any): void => {
        if (res.data) {
          const { project_info, task_info } = res.data ?? {};
          this.wbsService.taskProportionCheck = {
            project_info,
            task_info,
            taskInfoTip: !!task_info.length,
            projectInfoTip: !!project_info.length,
            tip: !!task_info.length || !!project_info.length,
          };
          this.changeRef.markForCheck();
        }
      });
  }

  /**
   * 获取业务中台项目基础资料
   * project_status项目状态：1.未报价；2.需求维护；3.完成报价；4.需求变更；10.未开始；20.签核中；30.进行中；40.已结案 ；50 暂停 ；60.指定结案；
   */
  getProjectData(isNeedQueryPermissions: boolean = true): void {
    this.wbsTabsService
      .getProjectInfo(this.wbsService.project_no)
      .then(async (res: any): Promise<any> => {
        this.wbsService.projectInfo = res;
        const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
        this.wbsService.needRefresh = data.check_result;
        this.changeRef.markForCheck();
        this.isEditable(isNeedQueryPermissions);
        this.canDeleteHandle();
      });
  }

  /**
   * 判断任务卡是否可编辑
   * @param leader_code
   */
  isEditable(isNeedQueryPermissions: boolean = true): void {
    if (!isNeedQueryPermissions) {
      return;
    }
    if (this.wbsService.projectInfo?.approve_status === 'N') {
      this.wbsService.editable = false;
      this.changeRef.markForCheck();
      return;
    }
    const personInCharge =
      this.userBehaviorCommService.commData?.workContent?.personInCharge ?? 'wfgp001';
    forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: personInCharge }),
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)))
      .subscribe((value) => {
        if (value[0].id === value[1].agentId) {
          this.wbsService.editable = true;
          this.changeRef.markForCheck();
          return;
        }
        const isHistory =
          this.source !== Entry.plan &&
            this.wbsService.projectInfo?.project_status !== '40' &&
            this.wbsService.projectInfo?.project_status !== '60'
            ? false
            : true;
        // project_leader_code 发起项目的人员编号
        // 登录的人和发起项目的人，是否一致
        const hasPermission =
          value[0].id === this.wbsService.projectInfo?.project_leader_code ? true : false;
        this.wbsService.editable = hasPermission && !isHistory;
        this.changeRef.markForCheck();
      });
  }

  /**
   * 获取EOC(鼎捷云端端组织)符合授权及用户关联之员工信息 (敏态)
   */
  queryChargePersonList(): void {
    const params = { project_member_info: [{ project_no: this.wbsService.project_no }] };
    this.commonService.getInvData('employee.info.process', params).subscribe((res: any): void => {
      this.wbsTabsService.personList = res.data.project_member_info;
      this.changeRef.markForCheck();
    });
  }

  changTabIndex(): void {
    this.tabIndex = 1;
  }

  successTransfer($event: any): void {
    this.wbsTabsService.potentialStatus = $event;
    this.wbsService.projectInfo.to_be_formal_project = true;
  }

  changeConfig($event: any): void {
    this.changeConfigData = $event;
  }

  /**
   * 获取任务量为0的任务名称
   * @param data
   * @returns
   */
  getNameString(data: any): string {
    let nameString = '';
    data?.forEach((item: any): any => {
      if (item.workload_qty === 0) {
        nameString += '【' + item.task_name + '】、';
      }
    });
    return nameString;
  }

  /**
   * 启动项目
   * @returns
   */
  startProject(): void {
    if (this.wbsTabsService.potentialStatus === 1) {
      return;
    }
    this.wbsTabsService.isShowStart = false;
    this.startProject$.next();
  }

  /**
   * 是否有协同计划未完成
   */
  getTeamworkTaskInfo(): void {
    // 点击【启动项目】按钮，校验项目是否协同中
    const params = {
      assist_schedule_info: [{ schedule_status: '1', project_no: this.wbsService.project_no }],
    };
    // 取得协同合作任务计划信息
    // spring 3.2 更换api名称 [入参、出参]：'teamwork.task.plan.info.get' ==> 'bm.pisc.assist.schedule.get'
    this.commonService
      .getInvData('bm.pisc.assist.schedule.get', params)
      .subscribe((res1: any): void => {
        const { assist_schedule_info } = res1?.data ?? {};
        assist_schedule_info?.length
          ? this.collaborativeTaskCardNotCompletedTip()
          : this.checkTaskProportion();
      });
  }

  /**
   * 协同计划未完成，不允许提交
   */
  collaborativeTaskCardNotCompletedTip(): void {
    this.modal.info({
      nzTitle: this.translateService.instant('dj-c-提示'),
      nzContent: this.translateService.instant('dj-default-协同计划未完成，不能启动专案！'),
      nzOkText: this.translateService.instant('dj-default-我知道了'),
      nzClassName: 'confirm-modal-center-sty',
      nzOnOk: (): void => {
        this.setIsShowStart();
      },
      nzOnCancel: (): void => {
        this.setIsShowStart();
      },
    });
  }

  setIsShowStart(): void {
    this.wbsTabsService.isShowStart = true;
    this.wbsService.projectInfo.project_status = '10';
    this.changeRef.markForCheck();
  }

  /**
   * 任务比重校验: 任务比重校验不通过，不允许启动
   */
  checkTaskProportion(): void {
    this.commonService
      .getInvData('task.proportion.check', {
        project_info: [{ project_no: this.wbsService.project_no }],
        check_all_task: '2',
      })
      .subscribe(
        (res: any): void => {
          if (res.data) {
            const { project_info, task_info } = res.data ?? {};
            this.wbsService.taskProportionCheck = {
              project_info,
              task_info,
              taskInfoTip: !!task_info.length,
              projectInfoTip: !!project_info.length,
              tip: !!task_info.length || !!project_info.length,
            };
            if (this.wbsService.taskProportionCheck.tip) {
              this.setIsShowStart();
              return;
            }
            const { bpmData } =
              this.commonService.content.executeContext?.taskWithBacklogData || {};
            bpmData?.checkPlanCompleteness
              ? this.checkWorkloadAndDependencies()
              : this.pushProcessOrUpdate();
          }
        },
        (err: any): void => {
          this.setIsShowStart();
        }
      );
  }

  /**
   * 校验任务量和依赖关系
   */
  checkWorkloadAndDependencies(): void {
    forkJoin([
      this.wbsService.checkTask('', this.source),
      this.wbsService.getDependencyInfo(this.source),
    ]).subscribe(
      (res) => {
        let nameSting = this.getNameString(res[0].data?.project_info);
        nameSting = nameSting
          ? nameSting.slice(0, nameSting.length - 1) +
          this.translateService.instant('dj-default-的工作量为0！')
          : nameSting;
        const dependencyInfoData = res[1].data?.task_info?.length
          ? null
          : this.translateService.instant('dj-default-此项目需至少存在一条前后置关系！');
        const hasTip = nameSting || dependencyInfoData;
        hasTip
          ? this.taskLoadAndDependencyTip(nameSting, dependencyInfoData)
          : this.pushProcessOrUpdate();
      },
      (err: any): void => {
        this.setIsShowStart();
      }
    );
  }

  /**
   * 存在任务量和依赖关系给出提示
   */
  taskLoadAndDependencyTip(nameSting: any, dependencyInfoData: any): void {
    this.modal.confirm({
      nzClosable: false,
      nzContent: `
        <p>${nameSting ? nameSting : ''} </p>
        <p>${dependencyInfoData ? dependencyInfoData : ''} </p>`,
      nzOkText: this.translateService.instant('dj-default-继续'),
      nzOnOk: (): void => {
        this.pushProcessOrUpdate();
      },
      nzOnCancel: (): void => {
        this.setIsShowStart();
      },
    });
  }

  pushProcessOrUpdate(): void {
    const params = {
      project_type_no: this.wbsService.projectInfo?.project_type_no,
    };
    this.wbsService.bmPiscProjectTypeGet(params).then((result) => {
      this.wbsService.projectInfo.project_status = result.project_is_approve ? '20' : '30';
      if (!result.project_is_approve) {
        this.wbsService.needRefresh = this.translateService.instant('dj-default-刷新');
      }
      this?.dynamicWbsComponent?.markForCheck();
      // isNewProcess === 'Y' 代表bpm流程
      this.isNewProcess === 'Y' ? this.pushDtdOrBpmProcess('20') : this.updataProjectStatus();
    });
  }

  /**
   * 更新项目状态
   */
  updataProjectStatus(): void {
    const sync_steady_state =
      this.wbsService.projectInfo.project_property === '10'
        ? 'N'
        : this.wbsTabsService.hasGroundEnd;
    const params = {
      project_info: [
        {
          project_no: this.wbsService.project_no,
          project_status: '30',
          sync_steady_state: sync_steady_state,
        },
      ],
    };
    this.commonService
      .getInvData('project.status.info.update', params, this.wbsService.projectInfo.eoc_company_id)
      .subscribe(
        (res: any): void => {
          this.pushDtdOrBpmProcess('30');
        },
        (err: any): void => {
          this.setIsShowStart();
        }
      );
  }

  /**
   * 推DTD或BPM流程:场景--启动项目
   */
  pushDtdOrBpmProcess(status: string) {
    if (this.model.type.indexOf('DTD') !== -1) {
      this.commonService.pushDTDProcess(this.wbsService.project_no);
      const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
      const id = this.userService.getUser('userId');
      const param = [
        {
          project_no: this.wbsService.project_no,
        },
      ];

      this.wbsTabsService
        .createProject(DwUserInfo.acceptLanguage, id, param, this.model.content)
        .subscribe((res) => {
          this.change.emit({
            type: 'application-submit',
          });
        });
    } else {
      this.pushBpmProcess();
      const tenantId = this.userService.getUser('tenantId');
      const param = [
        {
          project_no: this.wbsService.project_no,
        },
      ];
      this.wbsTabsService.executionEngine(tenantId, param, this.model.content).subscribe((res) => {
        this.change.emit({
          type: 'application-submit',
        });
      });
    }
  }

  /**
   * 推bpm流程
   */
  pushBpmProcess(): void {
    const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
    const { taskWithBacklogData } = this.model.content?.executeContext ?? {};
    const workitemListItem = taskWithBacklogData?.backlog[0]?.workitemList[0];
    const submit_params = {
      comment: '',
      locale: DwUserInfo.acceptLanguage,
      performerId: workitemListItem?.performerId,
      workitemId: workitemListItem?.workitemId,
      processSerialNumber: taskWithBacklogData?.processSerialNumber,
    };
    this.commonService.submit(submit_params).subscribe((res: any): void => { });
  }

  changeIndex($event: any): void {
    this.tabIndex = $event;
    const tabMenu = new Map([
      [0, 'dj-default-计划维护'],
      [1, 'dj-pcc-专案基础信息维护'],
      [2, 'dj-default-账款分期信息'],
      [3, 'dj-default-交付物清单'],
      [4, 'dj-default-参与部门人员'],
      [5, 'dj-default-其他信息'],
    ]);
    const tabCode = new Map([
      [0, '-PCC_TAB001-PCC_BUTTON000'],
      [1, '-PCC_TAB002-PCC_BUTTON000'],
      [2, '-PCC_TAB003-PCC_BUTTON000'],
      [3, '-PCC_TAB004-PCC_BUTTON000'],
      [4, '-PCC_TAB005-PCC_BUTTON000'],
      [5, '-PCC_TAB006-PCC_BUTTON000'],
    ]);
    const behaviorCommData = this.userBehaviorCommService.generateBehaviorCommData({
      operation: UserBehaviorOperation.OPEN_TAB,
      attachData: {
        name: this.pluginLanguageStoreService.getAllI18n(tabMenu.get(this.tabIndex)),
        appCode: 'PCC',
        code: 'PCC-' + this.userBehaviorCommService.commData.workType + tabCode.get(this.tabIndex),
      },
    });
    reportedUserBehavior(behaviorCommData);
    this?.dynamicWbsComponent?.markForCheck();
  }

  getProjectStatustypeNo(): boolean {
    return (
      this.wbsService.projectInfo?.project_status === '10' &&
      !this.wbsService.projectInfo.project_type_no
    );
  }

  /**
   * 判断删除按钮是否可用
   */
  canDeleteHandle(): void {
    const projectInfo = this.wbsService?.projectInfo ?? null;
    const performerId =
      this.userBehaviorCommService.commData?.workContent?.performerId ?? 'wfgp001';
    forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: performerId }),
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)))
      .subscribe((value) => {
        if (value[0].id === projectInfo.project_leader_code || value[0].id === value[1].agentId) {
          this.isCanDelete = true;
        }
        this.changeRef.markForCheck();
      });
  }
}
