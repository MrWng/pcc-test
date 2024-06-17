import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
} from '@athena/dynamic-core';
import { DynamicProjectPlanManageModel } from '../../model/project-plan-manage/project-plan-manage.model';
import { WbsTabsService } from './wbs-tabs.service';
import { CommonService, Entry } from '../../service/common.service';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { forkJoin, Subject } from 'rxjs';
import { DynamicWbsService } from '../wbs/wbs.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DynamicWbsComponent } from '../wbs/wbs.component';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { DynamicCustomizedService } from '../../service/dynamic-customized.service';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';

@Component({
  selector: 'app-dynamic-wbs-tabs',
  templateUrl: './wbs-tabs.component.html',
  styleUrls: ['./wbs-tabs.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicWbsTabsComponent
  extends DynamicFormControlComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProjectPlanManageModel;
  // wbs 入口
  @Input() source: Entry = Entry.card;
  // 动态赋值，从最上层的父组件入值
  @Input() sourceRealy = '';

  private startProject$ = new Subject<string>();

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();
  @Output() parentChangeFn: EventEmitter<any> = new EventEmitter();
  @ViewChild('wbsComponent')
  private dynamicWbsComponent!: DynamicWbsComponent;
  // loading蒙层组件
  @ViewChild('loadingModal') loadingModal: any;

  // wbs 入口
  Entry = Entry;
  // 是否是新发起的项目
  isNewProcess = '';
  tabIndex: number = 0;
  changeConfigData = null;
  hasGroundEnd: string;
  enableInstalment: boolean;
  isCanDelete: boolean = false;
  tabName: string = '';
  tabLoading: boolean = false;
  isShowInitiateProjectChangesBtn: boolean = false;
  startTipInfo = this.translateService.instant(
    'dj-default-请维护项目类型，项目类型为空，不可进行计划维护/启动项目！'
  );
  taskTipInfo = this.translateService.instant(
    'dj-pcc-存在一级任务的任务比重 < 100%，则所有一级任务的任务比重累计必须等于100%！'
  );

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
    private dynamicCustomizedService: DynamicCustomizedService,
    private addSubProjectCardService: AddSubProjectCardService,
    private zone: NgZone
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    this.wbsTabsService.isShowStart = true;
  }

  changeFn() {
    this.parentChangeFn.emit({
      type: 'close-project',
    });
    this.changeRef.markForCheck();
  }

  ngOnDestroy(): void {
    this.wbsTabsService.potentialStatus = 0;
  }
  // 计划维护
  async ngOnInit() {
    console.log('wbsTbs-sourceRealy：', this.sourceRealy);
    this.commonService.content = this.model?.content ?? {};
    this.wbsService.group = this.group ?? {};
    this.wbsService.modelType = this.model.type ?? '';
    this.enableInstalment =
      this.model.content?.executeContext?.taskWithBacklogData?.bpmData?.enableInstalment;
    this.wbsService.project_no =
      this.model.content?.executeContext?.taskWithBacklogData?.bpmData?.project_info[0]
        ?.project_no ?? '';
    this.isNewProcess =
      this.model.content?.executeContext?.taskWithBacklogData?.bpmData?.isNewProcess ?? '';
    this.hasGroundEnd = await this.getHasGroundEnd();
    this.wbsTabsService.hasGroundEnd = this.hasGroundEnd;
    if (this.source === Entry.collaborate) {
      this.addSubProjectCardService.getDateCheck();
    }
    this.checkTaskProportion();
    this.getProjectData();
    this.queryChargePersonList();
    this.monitorStart();
    this.monitorNeedChangeWbs();
    this.initIndividualCaseComp();
  }
  refreshPageChange() {
    this.checkTaskProportion();
    this.getProjectData();
  }
  /**
   * 项目变更记录
   */
  // getProjectChangeStatus(project_no) {
  //   if ((this.source === Entry.card) && project_no) {
  //     // 【项⽬基础信息维护】⻚签头部信息，增加显⽰信息：项⽬变更中
  //     this.commonService.getProjectChangeStatus(project_no, ['1'], '2').subscribe((res: any): void => {
  //       this.wbsService.projectChangeStatus['check_type_init'] = res.data?.project_info[0]?.check_result;
  //       this.changeRef.markForCheck();
  //     },(error) => {
  //       this.wbsService.projectChangeStatus['check_type_init'] = true;
  //       this.changeRef.markForCheck();
  //     });
  //   }
  // }

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
   * 1、项目基础维护，页面初始化
   * 2、项目基础维护，启动项目
   * 检查项目下任务占比是否符合100%的规则(敏态)
   */
  checkTaskProportion(goSchedule?: string): void {
    this.commonService.getTaskProportionInfo(this.source, this.wbsService.project_no).subscribe(
      (res: any): void => {
        if (res.data && res.data?.project_info) {
          const project_info = res.data?.project_info;
          const task_no = [];
          project_info.forEach((item) => {
            if (item.upper_level_task_no) {
              task_no.push(item.upper_level_task_no);
            }
          });
          this.wbsService.taskProportionCheck = {
            project_info,
            task_no: task_no,
            taskInfoTip: !!task_no.length,
            projectInfoTip: task_no.length < project_info.length && project_info.length,
            tip: !!task_no.length || !!project_info.length,
          };
          if (goSchedule === 'schedule_teamwork') {
            if (this.wbsService.taskProportionCheck.tip) {
              this.setIsShowStart();
              return;
            }
            const { bpmData } =
              this.commonService.content.executeContext?.taskWithBacklogData || {};
            // 任务比重校验: 任务比重校验不通过，不允许启动
            bpmData?.checkPlanCompleteness
              ? this.checkWorkloadAndDependencies()
              : this.pushProcessOrUpdate();
          }
        }
        this.changeRef.markForCheck();
      },
      (err: any): void => {
        if (goSchedule === 'schedule_teamwork') {
          this.setIsShowStart();
        }
      }
    );
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
        this.initiateProjectChangesBtn();
        const { data } = await this.wbsService.getInfoCheck(this.wbsService.project_no).toPromise();
        this.wbsService.needRefresh = data.check_result;
        this.changeRef.markForCheck();
        this.isEditable(isNeedQueryPermissions);
        this.canDeleteHandle();
      });
  }

  initiateProjectChangesBtn() {
    this.commonService
      .getTaskInfo(this.wbsService.project_no, this.source)
      .subscribe((resData: any): void => {
        // 当项目状态=30.进行中且项目类型不为空且项目下至少有一个任务，调用API-4.bm.pisc.project.type.get，入参：项目类型，取得启用项目变更
        const { project_status, project_type_no } = this.wbsService.projectInfo;
        if (
          project_status === '30' &&
          project_type_no &&
          resData.data?.project_info &&
          resData.data.project_info?.length
        ) {
          const params = { project_type_info: [{ project_type_no: project_type_no }] };
          this.commonService
            .getInvData('bm.pisc.project.type.get', params)
            .subscribe((res: any): void => {
              // 启用项目变更
              if (res.data?.project_type_info && res.data.project_type_info[0]?.is_project_change) {
                this.isShowInitiateProjectChangesBtn = true;
                this.changeRef.markForCheck();
              }
            });
        }
      });
  }

  /**
   * 判断任务卡是否可编辑
   * @param leader_code
   */
  isEditable(isNeedQueryPermissions: boolean = true): void {
    this.getUserInfoAndAgentInfo((value) => {
      // 临时存储,防止后面projectInfo对象被篡改
      this.wbsService.riskMaintenanceProjectInfo = this.wbsService.projectInfo;
      // 存储代理人编号
      this.wbsService.projectInfo['agentId'] = value[1].agentId || '';
      // 存储当前登陆用户员工编号
      this.wbsService.projectInfo['curUserId'] = value[0].id || '';
      if (!isNeedQueryPermissions) {
        return;
      }
      if (this.wbsService.projectInfo?.approve_status === 'N') {
        this.wbsService.editable = false;
        this.changeRef.markForCheck();
        return;
      }
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
  private getUserInfoAndAgentInfo(callback = (value) => {}) {
    const personInCharge =
      this.userBehaviorCommService.commData?.workContent?.personInCharge ?? 'wfgp001';
    forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: personInCharge }),
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)))
      .subscribe((value) => {
        callback(value);
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
          : this.checkTaskProportion('schedule_teamwork');
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

  /**
   * 启动专案
   * 点击按钮后，进行显影管控 --> 显示
   */
  setIsShowStart(): void {
    this.wbsTabsService.isShowStart = true;
    this.wbsService.projectInfo.project_status = '10';
    this.changeRef.markForCheck();
  }

  /**
   * 校验任务量和依赖关系
   */
  checkWorkloadAndDependencies(): void {
    forkJoin([
      this.commonService.checkTask(this.wbsService.project_no, '', this.source),
      this.commonService.getDependencyInfo(this.wbsService.project_no, this.source),
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

  /**
   * 发起项目
   * 推流程
   */
  pushProcessOrUpdate(): void {
    this.loadingModal.createLoadingModal();
    const params = {
      project_type_no: this.wbsService.projectInfo?.project_type_no,
    };
    this.wbsService
      .bmPiscProjectTypeGet(params)
      .then((result) => {
        // this.wbsService.projectInfo.project_status = result.project_is_approve ? '20' : '30';
        // if (!result.project_is_approve) {
        //   this.wbsService.needRefresh = this.translateService.instant('dj-default-刷新');
        // }
        // this?.dynamicWbsComponent?.markForCheck();
        // isNewProcess === 'Y' 代表DTD流程，bpm流程已取消
        this.isNewProcess === 'Y'
          ? this.pushDtdOrBpmProcess('20', result?.project_is_approve)
          : this.updataProjectStatus();
      })
      .catch((err) => {
        // 启动专案，失败，关闭loading，重新显示按钮
        this.setIsShowStart();
        this.changeRef.markForCheck();
        this?.dynamicWbsComponent?.markForCheck();
        this.loadingModal.closeLoadingModal();
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
      is_sync_document: this.wbsService.is_sync_document,
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
  pushDtdOrBpmProcess(status: string, project_is_approve?: boolean) {
    if (this.model.type.indexOf('DTD') !== -1) {
      const params_info = {
        is_sync_document: this.wbsService.is_sync_document,
        project_info: [
          {
            project_no: this.wbsService.project_no,
            project_status: project_is_approve ? '20' : '30',
            sync_steady_state: this.wbsService.hasGroundEnd, // 同步稳态	Y.同步；N.不同步 不传或传null，默认N
          },
        ],
      };
      this.commonService
        .getInvData(
          'project.status.info.update',
          params_info,
          this.wbsService.projectInfo.eoc_company_id
        )
        .subscribe(
          (res: any): void => {
            if (project_is_approve === false) {
              this.wbsService.needRefresh = this.translateService.instant('dj-default-刷新');
            }
            this.wbsService.projectInfo.project_status = project_is_approve ? '20' : '30';
            const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
            const id = this.userService.getUser('userId');
            const param = [{ project_no: this.wbsService.project_no }];

            // console.log('启动项目，开始调用流程：', new Date().toTimeString());
            forkJoin([
              this.wbsTabsService.createProject(
                DwUserInfo.acceptLanguage,
                id,
                param,
                this.model.content
              ),
              this.commonService.pushDTDProcessForStartProject(this.wbsService.project_no),
            ])
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                (res) => {
                  // console.log('启动项目，调用流程结束：', new Date().toTimeString());
                  setTimeout(() => {
                    this.changeRef.markForCheck();
                    this.wbsService.changeWbs$.next();
                    this.loadingModal.closeLoadingModal();
                  }, 500);
                },
                (err) => {
                  // 启动专案，失败，关闭loading，重新显示按钮
                  this.setIsShowStart();
                  this.changeRef.markForCheck();
                  this.dynamicWbsComponent?.markForCheck();
                  this.loadingModal.closeLoadingModal();
                }
              );
          },
          (err: any): void => {
            // 启动专案，失败，关闭loading，重新显示按钮
            this.setIsShowStart();
            this.changeRef.markForCheck();
            this?.dynamicWbsComponent?.markForCheck();
            this.loadingModal.closeLoadingModal();
          }
        );
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
    this.commonService.submit(submit_params).subscribe((res: any): void => {});
  }

  tabClickHandle(type) {
    if (
      type &&
      this.wbsService?.project_no &&
      (this.source === Entry.card ||
        this.source === Entry.collaborate ||
        this.source === Entry.plan)
    ) {
      switch (type) {
        case 'app-dynamic-wbs': {
          this.queryChargePersonList();
          this.tabName = 'app-dynamic-wbs';
          break;
        }
        case 'app-project-creation': {
          // 【项⽬基础信息维护】页面栏位管控
          this.tabName = 'app-project-creation';
          break;
        }
        case 'app-list-of-department': {
          // 【参与部⻔与⼈员】
          this.tabName = 'app-list-of-department';
          break;
        }
        case 'app-pcc-risk-maintenance': {
          // 【⻛险维护】⻚签按钮管控
          this.tabName = 'app-pcc-risk-maintenance';
          break;
        }
        case 'app-list-of-deliverable': {
          // 【⻛险维护】⻚签按钮管控
          this.tabName = 'app-list-of-deliverable';
          break;
        }
        case 'app-accounts-periodization': {
          // 【账款分期】⻚签按钮管控
          this.tabName = 'app-accounts-periodization';
          break;
        }
        default: {
          this.tabName = '';
          break;
        }
      }
    }
  }

  changeIndex($event: any): void {
    this.tabIndex = $event;
    const tabMenu = new Map([
      [0, 'dj-default-计划维护'],
      [1, 'dj-pcc-专案基础信息维护'],
      [2, 'dj-pcc-账款分期信息'],
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

  callTabLoadingFun(event: any): void {
    this.zone.run(() => {
      if (event.type === 'loading') {
        this.tabLoading = event.value;
      }
    });
  }
}
