import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DynamicUserBehaviorCommService } from '@athena/dynamic-core';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { DwUserService } from '@webdpt/framework/user';
import { WbsTabsService } from 'app/implementation/component/wbs-tabs/wbs-tabs.service';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { AddSubProjectCardService } from '../../add-subproject-card.service';

@Component({
  selector: 'app-card-header',
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.less'],
})
export class CardHeaderComponent implements OnInit {
  // wbs入口
  @Input() source: Entry = Entry.card;
  @Input() sourceRealy: String = '';
  @Input() infoList: any[] = [];
  @Input() personList: any[] = [];
  @Input() root_task_card = {
    // 协同一级计划任务卡信息
    root_task_no: '', // 根任务卡编号
    schedule_status: '', // 协助计划排定状态
    assist_schedule_seq: '', // 协助排定计划序号
  };
  @Output() changStatus = new EventEmitter<any>();

  /**
   * 是否显示自动排期
   */
  get isShowAutoSchedule() {
    return (
      (this.addSubProjectCardService.isShowAutoSchedule &&
        ['maintain', 'card', 'projectChange'].includes(this.source)) ||
      (this.source === Entry.collaborate &&
        this.addSubProjectCardService.currentCardInfo?.task_status)
    );
  }

  /**
   * 是否显示使用模版
   */
  get isShowUseTaskTemplate() {
    return (
      (this.source !== Entry.maintain && this.addSubProjectCardService.buttonType === 'EDIT') ||
      (this.source === Entry.collaborate &&
        this.addSubProjectCardService.currentCardInfo.task_status === '10')
    );
  }

  valueNotUnique: boolean;
  // 项目模版编号
  projectTemplateNo: any;
  // 计划日期重排基准日期
  planRearrangeBaseDate: any;
  // 计划日期重排基准日期模态框
  isUseTemplateDateVisible: boolean = false;
  // 使用模版确认框
  isUseTemplateVisible: boolean = false;
  autoScheduleCode: string;

  constructor(
    private fb: FormBuilder,
    private userService: DwUserService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService,
    public wbsTabsService: WbsTabsService,
    protected changeRef: ChangeDetectorRef,
    private messageService: NzMessageService,
    private translateService: TranslateService,
    public openWindowService: OpenWindowService,
    public addSubProjectCardService: AddSubProjectCardService,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private modal: NzModalService
  ) {
    this.autoScheduleCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB001-PCC_BUTTON004';
  }

  ngOnInit(): void {}

  get isForbidden() {
    return (
      this.addSubProjectCardService.currentCardInfo?.someEdit ||
      (this.addSubProjectCardService.currentCardInfo?.old_task_status &&
        this.addSubProjectCardService.currentCardInfo?.old_task_status !== '10')
    );
  }

  get hasProportionInvalid() {
    // 前任务卡所属的树是否包含任务比重 < 1
    return this.wbsService.hasTaskProportionForThisTree(
      this.addSubProjectCardService.currentCardInfo.task_no
    );
  }

  /**
   * 显示人力资源负荷
   */
  showHRLoad() {
    if (this.wbsService.showHRLoad) {
      return;
    }
    const { validateForm } = this.addSubProjectCardService;
    this.wbsService.showHRLoad = true;
    this.wbsService.dateObject = {
      startDate: validateForm.getRawValue().plan_start_date,
      endDate: validateForm.getRawValue().plan_finish_date,
    };
    this.changeHRData();
  }

  changeHRData() {
    if (
      this.addSubProjectCardService.validateForm.getRawValue().liable_person_code ||
      this.addSubProjectCardService.validateForm.getRawValue().task_member_info?.length
    ) {
      const arr = [];
      const arrName = [];
      if (this.addSubProjectCardService.validateForm.getRawValue().liable_person_code) {
        arr.push({
          personnel_no: this.addSubProjectCardService.validateForm.getRawValue().liable_person_code,
        });
        arrName.push(this.addSubProjectCardService.validateForm.getRawValue().liable_person_name);
      }
      if (this.addSubProjectCardService.validateForm.getRawValue().task_member_info?.length) {
        this.addSubProjectCardService.validateForm
          .getRawValue()
          .task_member_info?.forEach((res) => {
            let hasPeople = false;
            this.infoList?.forEach((p): void => {
              if (p.bigId === res) {
                hasPeople = true;
                arr.push({ personnel_no: p.id });
                arrName.push(p.name);
              }
            });
            if (!hasPeople) {
              this.personList?.forEach((p): void => {
                p.list?.forEach((o): void => {
                  if (o.bigId === res) {
                    arr.push({ personnel_no: o.id });
                    arrName.push(o.name);
                  }
                });
              });
            }
          });
      }
      this.wbsService.peopleObject = {
        list: arr,
        name: arrName.join('、'),
      };
    }
  }

  /**
   * 点击【自动排期】按钮
   */
  autoScheduleFrontJudge(): void {
    // hasCollaborationCard，是否存在协同计划排定任务卡
    if (this.wbsService.hasCollaborationCard && this.source !== Entry.collaborate) {
      if (this.wbsService?.project_no) {
        this.commonService.getCollaborationCard(this.wbsService.project_no).subscribe((res) => {
          const returnInfo = res.data?.assist_schedule_info ?? res.data?.task_info;
          if (returnInfo && returnInfo?.length) {
            this.modal.info({
              nzTitle: this.translateService.instant('dj-c-提示'),
              nzContent: this.translateService.instant(
                'dj-pcc-存在协同任务未完成，不可使用自动排期功能！'
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
            this.autoSchedule();
          }
        });
      }
    } else {
      if (
        this.addSubProjectCardService.currentCardInfo?.old_task_status &&
        this.addSubProjectCardService.currentCardInfo?.old_task_status !== '10'
      ) {
        return;
      }
      this.autoSchedule();
    }
  }

  /**
   * 自动排期
   */
  autoSchedule(): void {
    this.changStatus.emit({ type: 'loading', value: true });
    const { task_no } = this.addSubProjectCardService.validateForm.getRawValue();
    const flag =
      this.source === Entry.collaborate &&
      this.addSubProjectCardService.currentCardInfo.task_status === '10';
    let url = '';
    let params: any = {};
    if (!flag) {
      const record_task_change =
        this.wbsService.projectInfo?.project_status === '30' ? true : false;
      url = 'bm.pisc.task.plan.date.reset.process';
      params = {
        reset_type: '2', // 重设类型	1.依上下阶关系；2.依前后置关系
        sync_steady_state: this.wbsService.hasGroundEnd, // 同步稳态	Y.同步；N.不同步 不传或传null，默认N
        task_property: this.source === Entry.maintain ? '2' : '1', // 任务属性	1.项目;2.项目模版。不传默认1.项目
        project_info: [
          {
            project_no: this.wbsService.project_no,
            task_no: task_no,
            record_task_change, // 记录任务变更	不传默认False
            change_source: '3', // 变更来源	1.怠工异常；2.计划时程异常；3.WBS计划维护；4.项目日期调整；0.其他
          },
        ],
      };
    } else {
      // 2023-S5，重设协同排定任务计划日期
      url = 'bm.pisc.assist.task.plan.date.reset.process';
      params = {
        date_check: this.addSubProjectCardService.dateCheck,
        reset_type: '2', // 重设类型	1.依上下阶关系；2.依前后置关系
        assist_task_detail_info: [
          {
            assist_schedule_seq: this.root_task_card?.assist_schedule_seq,
            project_no: this.wbsService.project_no,
            root_task_no: this.root_task_card?.root_task_no,
            task_no: task_no,
          },
        ],
      };
    }
    if (this.source === Entry.projectChange) {
      // 额外处理项目变更
      url = 'bm.pisc.project.change.task.plan.date.reset.process';
      params = {
        reset_type: '2', // 重设类型	1.依上下阶关系；2.依前后置关系
        project_change_task_detail_info: [
          {
            change_version: this.wbsService.change_version,
            project_no: this.wbsService.project_no,
            task_no: task_no,
          },
        ],
      };
    }
    if (!Object.keys(params).length && url) {
      return;
    }
    this.commonService
      .getInvData(url, params)
      .pipe(
        catchError((res) => {
          return of(res.error);
        })
      )
      .subscribe((res: any): void => {
        // 协同，调97API，业务校验不通过的信息，以“异常”方式抛出信息，页面数据不再做更新
        // wbs和模板，调50API，业务校验不通过的信息，以“异常”方式抛出信息，页面数据不再做更新
        if (res.code !== 0) {
          this.changStatus.emit({ type: 'loading', value: false });
          this.changeRef.markForCheck();
          return;
        }
        const taskInfo = res.data.task_info || res.data.project_change_task_detail_info || [];
        if (!taskInfo?.length) {
          this.changStatus.emit({ type: 'loading', value: false });
          return;
        }
        // 协同，调97API，业务校验不通过的信息，以“异常”方式抛出信息，页面数据不再做更新
        // wbs和模板，调50API，业务校验不通过的信息，以“异常”方式抛出信息，页面数据不再做更新
        // if (this.hasMistakeMessage(taskInfo[0])) {
        //   this.changStatus.emit({ type: 'loading', value: false });
        //   return;
        // }

        const currCardInfo = this.addSubProjectCardService.currentCardInfo;
        const replaceData = (arr: any): void => {
          arr.forEach((d) => {
            const curr = taskInfo.find(
              (s) => s.project_no === d.project_no && s.task_no === d.task_no
            );
            if (curr !== undefined) {
              d.plan_start_date = curr.plan_start_date || '';
              d.plan_finish_date = curr.plan_finish_date || '';
              if (
                curr.project_no === currCardInfo['project_no'] &&
                curr.task_no === currCardInfo['task_no']
              ) {
                this.addSubProjectCardService.currentCardInfo['plan_start_date'] =
                  curr.plan_start_date || '';
                this.addSubProjectCardService.currentCardInfo['plan_finish_date'] =
                  curr.plan_finish_date || '';
                this.addSubProjectCardService.validateForm
                  .get('plan_start_date')
                  .patchValue(curr.plan_start_date);
                this.addSubProjectCardService.validateForm
                  .get('plan_finish_date')
                  .patchValue(curr.plan_finish_date);
              }
            }
            if (d.children && d.children.length > 0) {
              replaceData(d.children);
            }
          });
        };
        replaceData(this.wbsService.pageDatas);
        if (
          this.source === Entry.maintain ||
          this.source === Entry.collaborate ||
          this.source === Entry.projectChange
        ) {
          if (this.wbsService.typeChange === 'table') {
            // 表格式维护处理完日期同值需要调一遍接口拉去数据才能刷新
            this.wbsService.pageChange.next(true);
          }
          this.changStatus.emit({ type: 'loading', value: false });
          this.changeRef.markForCheck();
          return;
        }
        // 只有【计划维护】需要重推流程
        this.pushProcess(taskInfo);
      });
  }

  hasMistakeMessage(taskInfo: any): boolean {
    if (taskInfo?.task_name_mistake_message) {
      this.messageService.error(taskInfo.task_name_mistake_message);
      return true;
    }
    return false;
  }

  /**
   * 推送流程
   */
  pushProcess(taskInfo: any): void {
    const tenantId = this.userService.getUser('tenantId');
    if (this.wbsService.modelType.indexOf('DTD') === -1) {
      this.addSubProjectCardService
        .postProcess(
          tenantId,
          [
            {
              task_info: taskInfo,
            },
          ],
          this.commonService.content.executeContext
        )
        .subscribe((response: any): void => {
          if (this.wbsService.typeChange === 'table') {
            // 表格式维护处理完日期同值需要调一遍接口拉去数据才能刷新
            this.wbsService.pageChange.next(true);
          }
          this.changStatus.emit({ type: 'loading', value: false });
          this.changeRef.markForCheck();
        });
    } else {
      const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo || '{}');
      this.addSubProjectCardService
        .postProcessNew(
          DwUserInfo.acceptLanguage,
          'Athena',
          taskInfo,
          this.commonService.content.executeContext
        )
        .subscribe((response: any): void => {
          if (this.wbsService.typeChange === 'table') {
            // 表格式维护处理完日期同值需要调一遍接口拉去数据才能刷新
            this.wbsService.pageChange.next(true);
          }
          this.changStatus.emit({ type: 'loading', value: false });
          this.changeRef.markForCheck();
        });
    }
  }

  /**
   * 使用模版
   * wbs子项开窗，获取开窗数据
   */
  useTemplate(): void {
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
      this.wbsTabsService.OpenWindowDefine = res.data;
      this.commonService.content.executeContext.pattern = 'com';
      this.commonService.content.executeContext.pageCode = 'task-detail';
      this.commonService.content.executeContext['openWindow'] = true; // 可控制列表展示列，roleAttention
      const roleAttention = ['project_template_name', 'project_template_no', 'project_type_name'];
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
              executeContext: this.commonService.content.executeContext,
            },
            roleAttention,
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
                      {
                        key: 'task_info',
                        valueScript: "selectedObject['task_info']",
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
      // 开窗--选择项目模版
      this.openWindowService.openWindow(
        selectRow,
        operations,
        [],
        '',
        '',
        (resData: Array<any>) => {
          const taskList = resData[0].project_template_info;
          this.valueNotUnique = true;
          this.changStatus.emit({ type: 'valueNotUnique', value: true });
          taskList.forEach((p): void => {
            if (
              p.task_category === 'MO_H' &&
              p.doc_no &&
              p.doc_type_no &&
              p.sub_type_condition_value &&
              p.type_condition_value
            ) {
              p.task_no = '';
              this.getOneMoTem(
                p,
                this.wbsService.pageDatas,
                this.addSubProjectCardService.currentCardInfo
              );
            }
          });
          if (!this.valueNotUnique) {
            this.messageService.error(
              this.translateService.instant(
                `dj-pcc-任务类型工单工时下单别、单号、类型条件值、次类型条件值非唯一性`
              )
            );
            return;
          }
          this.projectTemplateNo = resData[0].project_template_no;
          this.planRearrangeBaseDate = this.wbsService.projectInfo?.plan_start_date;
          this.isUseTemplateDateVisible = true;
          this.changeRef.markForCheck();
        }
      );
    });
  }

  getOneMoTem(params, data, query) {
    for (const i in data) {
      if (
        !data[i].upper_level_task_no ||
        data[i].upper_level_task_no === data[i].task_no ||
        data[i].upper_level_task_no !== query.task_no
      ) {
        if (
          params.doc_no === data[i].doc_no &&
          params.doc_type_no === data[i].doc_type_no &&
          params.sub_type_condition_value === data[i].sub_type_condition_value &&
          params.type_condition_value === data[i].type_condition_value
        ) {
          this.valueNotUnique = false;
          this.changStatus.emit({ type: 'valueNotUnique', value: false });
        } else {
          if (data[i].children.length) {
            this.getOneMoTem(params, data[i].children, query);
          }
        }
      }
    }
  }

  /**
   * 取消计划日期重排基准日期
   */
  templateDateCancel(): void {
    this.isUseTemplateDateVisible = false;
  }

  /**
   * 确认计划日期重排基准日期
   */
  templateDateConfirm(): void {
    this.isUseTemplateDateVisible = false;
    this.isUseTemplateVisible = true;
  }

  /**
   * 计划日期重排基准日期
   * @param $event
   */
  templateTimeChange($event) {
    const date = $event ? moment($event).format('YYYY/MM/DD') : '';
    this.planRearrangeBaseDate = date;
  }

  /**
   * 确认使用模版
   * 使用场景：
   * 1）编辑WBS子项开窗-【使用模板】
   * 2）计划维护/协同功能
   */
  async useTemplateHandleOk(): Promise<void> {
    this.isUseTemplateVisible = false;
    const task_no = (this.addSubProjectCardService.currentCardInfo as any).task_no;
    let url = '';
    let params: any = {};
    if (
      this.source === Entry.collaborate &&
      this.addSubProjectCardService.currentCardInfo.task_status === '10'
    ) {
      // 2023-S5 更换api名称 [入参、出参]：'task.component.afresh.create' ==> 'bm.pisc.assist.task.template.copy.process' (协同排定任务模版复制)
      // 增加入参：协助排定计划序号、项目编号、根任务编号=当前协同的一级任务编号、任务编号=当前使用模板的任务编号、项目模版编号=挑选的项目模板编号、计划重排基准日期=当前维护的计划日期重排基准日期
      // 使用场景：协同明细内的该任务的原始状态=10.未开始时，使用模板按钮可用
      url = 'bm.pisc.assist.task.template.copy.process';
      params = {
        date_check: this.addSubProjectCardService.dateCheck,
        assist_task_detail_info: [
          {
            assist_schedule_seq: this.root_task_card?.assist_schedule_seq, // 协助排定计划序号
            project_no: this.wbsService.project_no, // 项目编号
            root_task_no: this.root_task_card?.root_task_no, // 根任务编号
            task_no: task_no, // 任务编号
            project_template_no: this.projectTemplateNo, // 项目模版编号
            plan_rearrange_base_date: this.planRearrangeBaseDate
              ? moment(this.planRearrangeBaseDate).format('YYYY-MM-DD')
              : '', // 计划重排基准日期
          },
        ],
      };
    } else if (this.source === Entry.projectChange) {
      url = 'bm.pisc.project.change.task.template.copy.process';
      params = {
        project_change_task_detail_info: [
          {
            project_no: this.wbsService.project_no, // 项目编号
            task_no: task_no, // 任务编号
            change_version: this.wbsService.change_version,
            project_template_no: this.projectTemplateNo, // 项目模版编号
            plan_rearrange_base_date: this.planRearrangeBaseDate
              ? moment(this.planRearrangeBaseDate).format('YYYY-MM-DD')
              : '', // 计划重排基准日期
          },
        ],
      };
    } else {
      // spring 3.1 更换api名称 [入参、出参]：'task.component.afresh.create' ==> 'bm.pisc.project.template.copy.process'
      // 增加入参：同步稳态=若项目状态是10.未开始 或 20.签核中，传入N，否则传入 交付设计器参数.是否依赖地段
      // 使用场景：编辑WBS-使用模板开窗-挑选项目模板后点击确定按钮（涉及：计划维护/协同功能）
      const hasGroundEnd = await this.commonService
        .hasDependsGround()
        .toPromise()
        .then((res) => res.data.hasGroundEnd);
      // s6: 入参追加是否同步文档
      const syncDoc = await this.wbsService.getSyncDoc();
      url = 'task.component.afresh.create';
      params = {
        is_sync_document: syncDoc,
        sync_steady_state: ['10', '20'].includes(this.wbsService.projectInfo.project_status)
          ? 'N'
          : hasGroundEnd,
        project_info: [
          {
            project_no: this.wbsService.project_no,
            // 根任务编号，如果是修改项目的项目模版，则为空
            root_task_no: task_no ? task_no : null,
            project_template_no: this.projectTemplateNo,
            // 计划重排基准日期	yyyyMMdd
            plan_rearrange_base_date: this.planRearrangeBaseDate
              ? moment(this.planRearrangeBaseDate).format('YYYY-MM-DD')
              : '',
          },
        ],
      };
    }
    this.commonService.getInvData(url, params).subscribe((res: any): void => {
      this.wbsService.$checkProportion.next(true);
      if (
        this.source !== Entry.collaborate &&
        res.data &&
        res.data?.project_info &&
        res.data.project_info.length &&
        res.data.project_info[0]?.error_msg
      ) {
        this.messageService.error(res.data.project_info[0].error_msg);
        return;
      }
      if (
        this.source === Entry.collaborate &&
        res.data &&
        res.data?.assist_task_detail_info &&
        res.data.assist_task_detail_info.length &&
        res.data.assist_task_detail_info[0]?.error_msg
      ) {
        this.messageService.error(res.data.assist_task_detail_info[0].error_msg);
        return;
      }
      if (
        this.source === Entry.projectChange &&
        res.data &&
        res.data?.project_change_task_detail_info &&
        res.data.project_change_task_detail_info.length &&
        res.data.project_change_task_detail_info[0]?.error_msg
      ) {
        this.messageService.error(res.data.project_change_task_detail_info[0].error_msg);
        return;
      }
      // 重新get页面数据
      this.wbsService.pageChange.next(this.sourceRealy);
      this.cancel();

      // 清理【使用模板】更新的一组任务卡片的编辑标识 *
      const taskNo = (this.addSubProjectCardService.currentCardInfo as any).task_no;
      const taskChildrenNos = this.wbsService.getTreeTaskNo(
        this.wbsService.findChildrenTaskInfo(taskNo)
      );
      const hasEditFromTaskNoArr: Array<string> = sessionStorage.getItem(
        'hasEditFromTaskNoArr' + this.wbsService.project_no
      )
        ? sessionStorage.getItem('hasEditFromTaskNoArr' + this.wbsService.project_no).split(',')
        : [];
      if (hasEditFromTaskNoArr.length && taskChildrenNos.length) {
        const hasEditFromTaskNos = [];
        hasEditFromTaskNoArr.forEach((item) => {
          let flag = false;
          taskChildrenNos.forEach((element) => {
            if (item === element) {
              flag = true;
            }
          });
          if (!flag) {
            hasEditFromTaskNos.push(item);
          }
        });
        sessionStorage.setItem(
          'hasEditFromTaskNoArr' + this.wbsService.project_no,
          hasEditFromTaskNos.toString()
        );
      }
    });
  }

  useTemplateHandleCancel(): void {
    this.isUseTemplateVisible = false;
  }

  cancel(): void {
    this.changStatus.emit({ type: 'cancleUseTemplate', value: true });
    const { addSubProjectCardService } = this;
    addSubProjectCardService.firstLevelTaskCard = {};
    addSubProjectCardService.validateForm.reset();
    addSubProjectCardService.isShowAutoSchedule = false;
    addSubProjectCardService.showAddTaskCard = false;
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
