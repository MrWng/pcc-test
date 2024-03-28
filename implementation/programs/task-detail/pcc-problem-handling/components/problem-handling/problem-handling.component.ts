import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProblemHandlingService } from './problem-handling.service';
import { PccProblemHandlingService } from '../../pcc-problem-handling.service';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { HandlingMattersTableComponent } from './components/handling-matters-table/handling-matters-table.component';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { IssueJourneyDetailsTableComponent } from './components/issue-journey-details/issue-journey-details.component';
import { APIService } from 'app/implementation/service/api.service';
import { CommonService } from 'app/implementation/service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { TransferReturnService } from '@app-custom/ui/transfer-return';
import { DwFormControl, DwFormGroup, isNotEmpty } from '@athena/dynamic-core';
import { ProblemExecutionMethod, QuestPageDataStatus, QuestPageType } from '../../config';
@Component({
  selector: 'app-problem-handling',
  templateUrl: './problem-handling.component.html',
  styleUrls: ['./problem-handling.component.less'],
  providers: [ProblemHandlingService],
})

/**
 * 项目计划维护
 */
export class ProblemHandlingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() copModel: any;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  @ViewChild('handingMatterTable') handingMatterTable: HandlingMattersTableComponent;
  get canBatchDeletion(): boolean {
    return this.tableSelectRows.length !== 0;
  }
  get canBatchToTask(): boolean {
    return this.canBatchDeletion;
  }
  get pageReadonly(): boolean {
    return !!this.copModel.content.pageReadonly;
  }
  get pageCanSubmit(): boolean {
    return !!this.copModel.content.pageCanSubmit;
  }
  get pageType(): string {
    return this.copModel.content.pageType;
  }
  QuestPageDataStatus = QuestPageDataStatus;
  QuestPageType = QuestPageType;
  ProblemExecutionMethod = ProblemExecutionMethod;
  setRightBtnDisabled = this._setRightBtnDisabled.bind(this);
  leftBtnInfo = {
    btnText: '',
    modalTitle: '',
    employeePlaceHolder: '',
    descPlaceHolder: '',
    execute_mode: '',
    defaultData: {},
  };
  rightBtnInfo = {
    btnText: '',
    modalTitle: '',
    employeePlaceHolder: '',
    descPlaceHolder: '',
    execute_mode: '',
    defaultData: {},
    btnSubmitBefore: () => {},
  };
  collapseActive: boolean = true;
  tableSelectRows: any[] = [];
  pageData: any = {};
  isNotEmpty = isNotEmpty;
  rightBtnDisabled: boolean = true;
  pageLoading: boolean = true;
  pageCardInfo = {
    hasPageCardInfo: false,
    type: 'success',
    message: this.translateService.instant('dj-pcc-暂无'),
  };
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
    private apiService: APIService,
    private pccProblemHandlingService: PccProblemHandlingService,
    public problemHandlingService: ProblemHandlingService,
    public modalService: AthModalService,
    private transferReturnService: TransferReturnService
  ) {}
  ngOnInit() {
    this.initPage();
  }
  ngOnChanges() {}
  ngOnDestroy() {
    this.problemHandlingService.pageDataChangeEmitter.unsubscribe();
  }
  async initPage(): Promise<any> {
    this.pageLoading = true;
    try {
      const pageData = await this.problemHandlingService.getQuestionDetail(
        this.copModel.content?.pageData.map((item) => ({
          question_no: item.question_no,
        }))
      );
      this.pageData = this.pccProblemHandlingService.pageData = pageData;
      this.initSubmitBtnInfo();
      this.initPageCardInfo();
      // 生成问题附件
      this.problemHandlingService.generateDynamicCop(pageData.attachment || {});
    } catch (error) {
    } finally {
      this.pageLoading = false;
      this.changeRef.markForCheck();
    }
  }

  viewJourneys() {
    this.modalService.create({
      nzTitle: this.commonService.translatePccWord('问题历程详情'),
      nzKeyboard: false,
      nzMaskClosable: false,
      nzWrapClassName: 'ath-grid-modal-wrap',
      nzFooter: null,
      nzBodyStyle: { height: '600px' },
      nzContent: IssueJourneyDetailsTableComponent,
      nzComponentParams: {
        pageData: this.pageData.question_list_process_info || [],
      },
      gridConfig: {
        span: 12,
        modalType: 'table-modal',
      },
    });
  }
  viewAttachment() {}
  addItem() {
    this.pccProblemHandlingService.startMaintenanceInformation({
      onOk: async (e) => {
        const successInfo = await this.problemHandlingService.createQuestionDoList(
          [e],
          this.copModel.content?.pageData.map((item) => ({
            question_no: item.question_no,
          }))
        );
        this.handingMatterTable.addRow(
          Object.assign(
            {},
            {
              ...e,
              plan_finish_datetime: this.pccProblemHandlingService.formatDateTransform(
                e.plan_finish_datetime,
                'yyyy/MM/dd'
              ),
              actual_finish_datetime: this.pccProblemHandlingService.formatDateTransform(
                e.actual_finish_datetime,
                'yyyy/MM/dd'
              ),
            },
            successInfo
          )
        );
        this.athMessageService.success(this.commonService.translatePccWord('新增成功'));
        this.changeRef.markForCheck();
      },
    });
  }
  async batchDeleteHandler(): Promise<any> {
    const delUUID = [],
      delParams = [];
    this.tableSelectRows.forEach((row) => {
      delUUID.push(row.uuid);
      delParams.push({
        question_no: this.pageData.question_no,
        question_do_no: row.get('question_do_no').value,
      });
    });
    await this.pccProblemHandlingService.deleteQuestionDo(delParams);
    this.handingMatterTable.removeRows(delUUID);
    this.athMessageService.success(this.commonService.translatePccWord('删除成功'));
  }
  async employeeNameVerifyFn(e: DwFormControl): Promise<any> {
    const employeeInfo = (e.parent.get('employeeInfo') as DwFormGroup)?.getRawValue();
    let errorMsg = '';
    if (!employeeInfo.employee_no || !employeeInfo.employee_name) {
      return Promise.resolve(null);
    }
    try {
      errorMsg = await this.problemHandlingService.checkEmployee([
        {
          employee_no: employeeInfo.employee_no,
          employee_name: employeeInfo.employee_name,
        },
      ]);
    } catch (error) {
    } finally {
      if (isNotEmpty(errorMsg)) {
        return Promise.resolve({
          error: true,
          errorMsg,
        });
      }
      return Promise.resolve(null);
      // if (errorMsg) {
      //   this.athMessageService.error(errorMsg);
      //   // !有问题
      //   this.transferReturnService.verifySubject.next(true);
      //   return false;
      // }
      // this.transferReturnService.verifySubject.next(true);
      // return true;
    }
  }
  async transfer({ employeeInfo, description }): Promise<any> {
    try {
      const DwUserInfo = JSON.parse(sessionStorage.DwUserInfo ?? '{}');
      const userInfo = await this.problemHandlingService.getUserInfoAndAgentInfo();
      await this.problemHandlingService.submitProcess([
        {
          question_no: this.pageData.question_no,
          execution_date: this.pccProblemHandlingService.formatDateTransform(new Date()),
          execute_mode: this.leftBtnInfo.execute_mode,
          executive_person_no: userInfo[0].id,
          executive_person_name: userInfo[0].name,
          execution_instructions: description,
          execution_object_no: employeeInfo.employee_no,
          execution_object_name: employeeInfo.employee_name,
        },
      ]);
      await this.commonService.submitDispatchForQuestion({
        variables: {
          isHandle: false,
          reassigner: employeeInfo.employee_no,
          reassignerName: employeeInfo.employee_name,
        },
        dispatchData: [
          {
            question_no: this.pageData.question_no,
          },
        ],
      });
      this.athMessageService.success(this.commonService.translatePccWord('操作成功'));
      this.submitAfterHandler();
    } catch (error) {
    } finally {
      this.transferReturnService.submitSubject.next(true);
    }
  }
  async processingIsComplete({ employeeInfo, description }) {
    try {
      const userInfo = await this.problemHandlingService.getUserInfoAndAgentInfo();

      await this.problemHandlingService.submitProcess([
        {
          question_no: this.pageData.question_no,
          execution_date: this.pccProblemHandlingService.formatDateTransform(new Date()),
          execute_mode: this.rightBtnInfo.execute_mode,
          executive_person_no: userInfo[0].id,
          executive_person_name: userInfo[0].name,
          execution_instructions: description,
          execution_object_no: employeeInfo.employee_no,
          execution_object_name: employeeInfo.employee_name,
        },
      ]);
      await this.commonService.submitDispatchForQuestion({
        variables: {
          isHandle: true,
          reassigner: '',
        },
        dispatchData: [
          {
            question_no: this.pageData.question_no,
          },
        ],
      });
      this.athMessageService.success(this.commonService.translatePccWord('操作成功'));
      this.submitAfterHandler('2');
    } catch (error) {
    } finally {
    }
  }
  private _setRightBtnDisabled(disabled: boolean) {
    this.rightBtnDisabled = disabled;
    this.changeRef.markForCheck();
  }
  private initPageCardInfo() {
    const front_execute_illustrate = this.pageData.front_execute_illustrate;
    switch (this.pageData.front_execute_mode) {
      case ProblemExecutionMethod.TRANSFER:
        this.pageCardInfo.hasPageCardInfo = true;
        this.pageCardInfo.type = 'warning';
        this.pageCardInfo.message = this.translateService.instant('dj-pcc-显示转派说明', {
          info: front_execute_illustrate || this.commonService.translatePccWord('暂无'),
        });

        break;
      case ProblemExecutionMethod.HANDLE:
        this.pageCardInfo.hasPageCardInfo = true;
        this.pageCardInfo.message = this.translateService.instant('dj-pcc-显示处理说明', {
          info: front_execute_illustrate || this.commonService.translatePccWord('暂无'),
        });
        break;
      case ProblemExecutionMethod.NO_PASS:
        this.pageCardInfo.hasPageCardInfo = true;
        this.pageCardInfo.type = 'warning';
        this.pageCardInfo.message = this.translateService.instant('dj-pcc-显示退回说明', {
          info: front_execute_illustrate || this.commonService.translatePccWord('暂无'),
        });
        break;
    }
  }
  private initSubmitBtnInfo() {
    switch (this.pageType) {
      case QuestPageType.PROBLEM_HANDLING:
      case QuestPageType.THE_ISSUE_IS_BOUNCED:
        this.leftBtnInfo.btnText = this.commonService.translatePccWord('问题转派');
        this.leftBtnInfo.modalTitle = this.commonService.translatePccWord('问题转派');
        this.leftBtnInfo.employeePlaceHolder = this.commonService.translatePccWord('转派至');
        this.leftBtnInfo.descPlaceHolder = this.commonService.translatePccWord('转派说明');
        this.leftBtnInfo.execute_mode = ProblemExecutionMethod.TRANSFER;
        //
        this.rightBtnInfo.btnText = this.commonService.translatePccWord('处理完成');
        this.rightBtnInfo.modalTitle = this.commonService.translatePccWord('处理完成');
        this.rightBtnInfo.descPlaceHolder = this.commonService.translatePccWord('处理说明');
        this.rightBtnInfo.btnSubmitBefore = () => {
          this.athMessageService.error(
            this.commonService.translatePccWord('仅所有处理事项状态为已完成时，按钮可用')
          );
        };
        this.rightBtnInfo.execute_mode = ProblemExecutionMethod.HANDLE;

        break;
      case QuestPageType.PROBLEM_ACCEPTANCE:
        this.leftBtnInfo.btnText = this.commonService.translatePccWord('退回重办');
        this.leftBtnInfo.modalTitle = this.commonService.translatePccWord('退回重办');
        this.leftBtnInfo.employeePlaceHolder = this.commonService.translatePccWord('退回至');
        this.leftBtnInfo.descPlaceHolder = this.commonService.translatePccWord('退回说明');
        this.leftBtnInfo.execute_mode = ProblemExecutionMethod.NO_PASS;
        this.leftBtnInfo.defaultData = {
          employeeInfo: {
            employee_name: this.pageData.process_person_name,
            employee_no: this.pageData.process_person_no,
          },
        };

        //
        this.rightBtnInfo.btnText = this.commonService.translatePccWord('验收通过');
        this.rightBtnInfo.modalTitle = this.commonService.translatePccWord('验收通过');
        this.rightBtnInfo.descPlaceHolder = this.commonService.translatePccWord('验收说明');
        this.rightBtnInfo.execute_mode = ProblemExecutionMethod.PASS;
        break;
    }
  }

  submitAfterHandler(submitType: string = '1') {
    const accFn = () => {
      if (submitType === '2') {
        this.refreshPage(2000);
      } else {
        this.closePage(2000);
      }
    };
    switch (this.pageType) {
      case QuestPageType.PROBLEM_HANDLING:
      case QuestPageType.THE_ISSUE_IS_BOUNCED:
        this.closePage(2000);
        break;
      case QuestPageType.PROBLEM_ACCEPTANCE:
        accFn();
        break;
    }
  }
  private closePage(second = 300) {
    setTimeout(() => {
      try {
        this.change.emit({
          type: 'close-page',
        });
      } catch (error) {}
    }, second);
  }
  // 刷新页面
  private refreshPage(second = 300) {
    setTimeout(() => {
      try {
        this.change.emit({
          type: 'application-submit',
          isDrawClose: true,
        });
      } catch (error) {}
    }, second);
  }
}
