import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../../service/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PccRiskMaintenanceService } from './risk-maintenance.service';
import {
  DwFormArray,
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormService,
  DynamicTableModel,
  cloneDeep,
  isEmpty,
  isEqual,
} from '@athena/dynamic-core';
import { PccRiskDetailMaintenanceComponent } from './component/maintenance.component';
import DataModel from './data-model';
import { Subscription } from 'rxjs';
import { DynamicWbsService } from '../../../wbs/wbs.service';
import { DwUserService } from '@webdpt/framework/user';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import * as moment from 'moment';
import { Scroll } from '../../../../utils/Scroll';

@Component({
  selector: 'app-pcc-risk-maintenance',
  templateUrl: './risk-maintenance.component.html',
  styleUrls: ['./risk-maintenance.component.less'],
  providers: [PccRiskMaintenanceService],
})
export class PccRiskMaintenanceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tabIndex: any;
  @Input() tabName: String;
  @Input() model: any;
  @ViewChild('maintenanceModal') maintenanceModal: PccRiskDetailMaintenanceComponent;
  public formGroup: DwFormGroup;
  public formLayout: DynamicFormLayout;
  public formModel: DynamicTableModel[];
  loading: boolean = false;
  delLoading: boolean = false;
  saveLoading: boolean = false;
  showMaintenanceModel: boolean = false;
  maintenanceModelTitle: string = '';
  useMaintenanceModelFromType: string;
  curUseRowGroup: DwFormGroup;
  // 新增行数据
  newRowGroups: Set<DwFormGroup> = new Set();
  removeRowGroups: Set<DwFormGroup> = new Set();
  rowSelectedGroups: Set<DwFormGroup> = new Set();
  editedRowGroups: Set<DwFormGroup> = new Set();
  subs: Subscription = new Subscription();

  // 项目变更记录
  projectChangeStatus: boolean = false;

  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private messageService: NzMessageService,
    private pccRiskMaintenanceService: PccRiskMaintenanceService,
    private formService: DynamicFormService,
    public wbsService: DynamicWbsService,
    private userService: DwUserService,
    private athModalService: AthModalService
  ) {}

  /**
   * 控制【新增、删除、保存】按钮显示false/隐藏true
   * 控制【维护、派送、失效】按钮高亮false/置灰true
   */
  get pageDisabled() {
    if (!this.wbsService.projectChangeStatus['check_type_risk']) {
      return true;
    } else {
      const projectInfo = this.wbsService.riskMaintenanceProjectInfo;
      // 添加【项目变更中】的状态
      return !(
        projectInfo.project_status === '30' &&
        (projectInfo.curUserId === projectInfo.project_leader_code ||
          (projectInfo.agentId && projectInfo.curUserId === projectInfo.agentId))
      );
    }
  }
  get tableGroup(): DwFormArray {
    return this.formGroup.get('riskMaintenance') as DwFormArray;
  }
  get tableComp() {
    return this.tableGroup['_component'];
  }
  get saveDisabled() {
    if (this.rowSelectedGroups.size) {
      const { needNewGroups, needUpdateGroups } = this.getWaitHandleGroups();
      if (!needNewGroups.size && !needUpdateGroups.size) {
        return true;
      }
      return false;
    }
    return true;
  }
  ngOnInit(): void {
    // this.init();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    Scroll.destroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tabName === 'app-pcc-risk-maintenance') {
      this.commonService
        .getProjectChangeStatus(this.wbsService.project_no, ['1', '4'], '2')
        .subscribe(
          (res: any): void => {
            this.wbsService.projectChangeStatus['check_type_risk'] =
              res.data?.project_info[0]?.check_result;
            this.changeRef.markForCheck();
            this.init();
          },
          (error) => {
            this.wbsService.projectChangeStatus['check_type_risk'] = true;
            this.changeRef.markForCheck();
            this.init();
          }
        );
    }
  }

  async init(): Promise<any> {
    let pageData = null;
    try {
      this.loading = true;
      this.pccRiskMaintenanceService.content = this.model?.content || {};
      pageData = await this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_GET([
        {
          project_no: this.wbsService.riskMaintenanceProjectInfo.project_no,
        },
      ]);
    } catch (error) {
      console.error(error.message);
    } finally {
      this.loading = false;
      Scroll.destroy();
      this.initDynamicCop(pageData.map((item) => new DataModel.RiskMaintenance(item)) || []);
      this.changeRef.markForCheck();
    }
  }

  initDynamicCop(pageData = []) {
    const source = this.pccRiskMaintenanceService.getJSONTemplate(pageData, !this.pageDisabled);
    source.layout = Array.isArray(source?.layout) ? source.layout : [];
    source.content = source.content || {};
    const initializedData = this.formService.initData(
      source.layout as any,
      source.pageData,
      source.rules as any,
      source.style,
      source.content
    );
    this.formLayout = initializedData.formLayout; // 样式
    this.formModel = initializedData.formModel; // 组件数据模型
    this.formGroup = initializedData.formGroup; // formGroup
    this.subs.add(
      this.formGroup.valueChanged.subscribe((e) => {
        const operate = e.operate,
          ctr = e.control;
        switch (operate) {
          case 'remove':
            if (!ctr.isNewRow) {
              this.removeRowGroups.add(ctr);
            }
            break;
        }
      })
    );
  }
  maintenanceConfirm(data) {
    switch (this.useMaintenanceModelFromType) {
      case 'addRisk':
        this.tableComp.addRow(new DataModel.RiskMaintenance(data));
        const newRowGroup: DwFormGroup = this.tableGroup.controls[
          this.tableGroup.controls.length - 1
        ] as DwFormGroup;
        newRowGroup.get('uibot_checked').setValue(true);
        newRowGroup.get('isChanged').setValue(1);
        this.rowSelectedGroups.add(newRowGroup);
        this.newRowGroups.add(newRowGroup);
        const tableWrapper = Scroll.el
          ? Scroll.el
          : document.querySelector('.ag-force-vertical-scroll');
        if (tableWrapper) {
          const scroll = Scroll.getScrollInstance(tableWrapper);
          scroll.scrollTop(scroll.getScrollHeight());
        }
        break;
      case 'maintenance':
        // 去掉勾选标识
        const { uibot_checked, ...newData } = data;
        const curUseRowData = this.curUseRowGroup.getRawValue();
        const { uibot_checked: _uibot_checked, ...newCurUseRowData } = curUseRowData;
        const _isEqual = isEqual(newData, newCurUseRowData);
        this.curUseRowGroup['isDataChanged'] = !_isEqual;
        if (!_isEqual) {
          this.curUseRowGroup.patchValue(data);
          this.commonService.pushFormArray(
            this.curUseRowGroup.get('risk_notifier_info') as DwFormArray,
            data.risk_notifier_info.map((item) => new DataModel.RiskNotifierInfo(item))
          );
        }
        if (!_isEqual && !this.newRowGroups.has(this.curUseRowGroup)) {
          this.curUseRowGroup.get('uibot_checked').setValue(true);
          this.curUseRowGroup.get('isChanged').setValue(2);
          this.transEmptyString(this.curUseRowGroup);
          this.rowSelectedGroups.add(this.curUseRowGroup);
          this.editedRowGroups.add(this.curUseRowGroup);
        }
        break;
      default:
        break;
    }
  }
  async onDispatch(): Promise<any> {
    let originData = [{}];
    try {
      const { project_no, project_risk_seq, notice_mode } = this.curUseRowGroup.getRawValue();
      await this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_UPDATE([
        {
          project_no,
          project_risk_seq,
          notice_mode,
          is_dispatch: true,
          dispatch_time: moment(Date.now()).format('YYYY/MM/DD HH:mm:ss'),
        },
      ]);
      originData = await this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_GET([
        {
          project_no,
          project_risk_seq,
        },
      ]);
      // 发送流程
      const publishParam = JSON.parse(JSON.stringify(originData));
      await this.commonService.publishTaskCark(publishParam).toPromise();
      this.messageService.success(this.translateService.instant('dj-pcc-派送成功'));
    } catch (error) {
    } finally {
      this.curUseRowGroup.patchValue(originData[0]);
      this.commonService.pushFormArray(
        this.curUseRowGroup.get('risk_notifier_info') as DwFormArray,
        originData[0]['risk_notifier_info'] || []
      );
      this.curUseRowGroup.get('UIBOT_BUTTON_GROUP')['_component'].changeRef.markForCheck();
    }
  }
  async onLoseEfficacy(): Promise<any> {
    let originData = [{}];
    try {
      const { project_no, project_risk_seq, is_dispatch } = this.curUseRowGroup.getRawValue();
      let risk_handle_status = null;
      switch (is_dispatch) {
        case false:
          risk_handle_status = '1';
          break;
        case true:
          risk_handle_status = '4';
          break;
        default:
          break;
      }
      await this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_UPDATE([
        {
          project_no,
          project_risk_seq,
          risk_handle_status,
          risk_status: '3',
          expiration_date: moment(Date.now()).format('YYYY/MM/DD'),
        },
      ]);
      const promiseApis = [
        this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_GET([
          {
            project_no,
            project_risk_seq,
          },
        ]),
      ];
      if (is_dispatch) {
        // 回收卡片
        promiseApis.push(this.pccRiskMaintenanceService.recoveryCard(project_risk_seq));
      }
      const [_originData] = await Promise.all(promiseApis);
      this.messageService.success(this.translateService.instant('dj-pcc-失效成功'));
      originData = _originData;
    } catch (error) {
      console.error(error.message);
    } finally {
      this.curUseRowGroup.patchValue(originData[0]);
      this.commonService.pushFormArray(
        this.curUseRowGroup.get('risk_notifier_info') as DwFormArray,
        originData[0]['risk_notifier_info'] || []
      );
      this.curUseRowGroup.get('UIBOT_BUTTON_GROUP')['_component'].changeRef.markForCheck();
    }
  }
  async onDel(): Promise<any> {
    this.athModalService.confirm({
      nzTitle: null,
      nzContent: `<span class="tip-text">${this.translateService.instant(
        'dj-pcc-是否确认删除?'
      )}</span>`,
      nzClassName: 'confirm-modal-center-sty pcc-confirm-modal-center',
      nzOnOk: async (): Promise<any> => {
        try {
          this.delLoading = true;
          this.clearTableRowAfterHandle();
          const delData = this.getValuesFormSet(this.removeRowGroups);
          if (delData.length) {
            // 调接口删除数据
            await this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_DELETE(delData);
          }
          this.clearTableRowBeforeHandle();
          this.messageService.success(this.translateService.instant('dj-default-删除成功'));
        } catch (error) {
          console.error(error.message);
        } finally {
          this.delLoading = false;
          this.removeRowGroups.clear();
          this.changeRef.markForCheck();
        }
      },
    });
  }
  onSave() {
    this.prevSave(async (needNewGroups, needUpdateGroups): Promise<any> => {
      try {
        this.saveLoading = true;
        const apiPromise = [],
          addData = this.getValuesFormSet(needNewGroups),
          updateData = this.getValuesFormSet(needUpdateGroups, 'update');
        if (addData.length) {
          // 调用新增接口
          apiPromise.push(this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_CREATE(addData));
        }
        if (updateData.length) {
          // 调用修改接口
          apiPromise.push(this.pccRiskMaintenanceService.BM_PISC_PROJECT_RISK_UPDATE(updateData));
        }
        const res = await Promise.all(apiPromise);
        this.resetFlag();
        this.init();
        this.messageService.success(this.translateService.instant('dj-default-保存成功'));
      } catch (error) {
        console.error(error.message);
      } finally {
        this.saveLoading = false;
        this.changeRef.markForCheck();
      }
    });
  }
  private prevSave(callback = (needNewGroups, needUpdateGroups) => {}) {
    const { needNewGroups, needUpdateGroups } = this.getWaitHandleGroups();
    if (
      this.newRowGroups.size !== needNewGroups.size ||
      this.editedRowGroups.size !== needUpdateGroups.size
    ) {
      this.athModalService.confirm({
        nzTitle: null,
        nzContent: `<span class="tip-text">${this.translateService.instant(
          'dj-pcc-存在修改或者新增的数据未勾选，保存后数据可能会丢失，是否继续？'
        )}</span>`,
        nzClassName: 'confirm-modal-center-sty pcc-confirm-modal-center',
        nzOnOk: () => {
          callback(needNewGroups, needUpdateGroups);
        },
      });
      return;
    }
    callback(needNewGroups, needUpdateGroups);
  }
  clearTableRowAfterHandle() {
    this.rowSelectedGroups.forEach((delGroup: DwFormGroup) => {
      if (!delGroup['isNewRow']) {
        // delGroup.get('isChanged').setValue(3);
        this.removeRowGroups.add(delGroup);
      } else {
        this.tableComp.removeRow(delGroup.uuid);
      }
      this.newRowGroups.delete(delGroup);
      this.editedRowGroups.delete(delGroup);
    });
  }
  clearTableRowBeforeHandle() {
    this.removeRowGroups.forEach((delGroup: DwFormGroup) => {
      delGroup.get('isChanged').setValue(3);
      this.tableComp.removeRow(delGroup.uuid);
    });
    this.removeRowGroups.clear();
    this.rowSelectedGroups.clear();
  }

  getWaitHandleGroups(): { needNewGroups: Set<any>; needUpdateGroups: Set<any> } {
    const needNewGroups = new Set(),
      needUpdateGroups = new Set();
    this.rowSelectedGroups.forEach((item) => {
      if (this.newRowGroups.has(item)) {
        needNewGroups.add(item);
        return;
      }
      if (this.editedRowGroups.has(item)) {
        needUpdateGroups.add(item);
      }
    });
    return {
      needNewGroups,
      needUpdateGroups,
    };
  }

  resetFlag() {
    this.rowSelectedGroups.clear();
    this.newRowGroups.clear();
    this.editedRowGroups.clear();
    this.saveLoading = false;
    this.saveLoading = false;
  }

  transEmptyString(group: DwFormGroup) {
    ['happen_date', 'prevention_measure', 'reply_measure'].forEach((key) => {
      if (isEmpty(group.get(key).value)) {
        group.get(key).setValue('');
      }
    });
  }

  private getValuesFormSet(set: Set<DwFormGroup>, type = 'create') {
    const res = [];
    set.forEach((group: DwFormGroup) => {
      const rowRes = group.getRawValue();
      res.push({
        ...rowRes,
        is_dispatch: type === 'create' ? rowRes.is_dispatch : false,
      });
    });
    return res;
  }
  getChanges(e) {
    const type = e.$event?.type || '',
      group = e.$event?.group;
    switch (type) {
      case 'addRisk':
        this.maintenanceModal.showModal({
          modalTitle: this.translateService.instant('dj-pcc-新增风险项'),
        });
        this.useMaintenanceModelFromType = type;
        break;
      case 'maintenance':
        this.curUseRowGroup = group;
        this.maintenanceModal.showModal({
          modalTitle: this.translateService.instant('dj-pcc-维护风险项'),
          pageData: group.getRawValue(),
        });
        this.useMaintenanceModelFromType = type;
        break;
      case 'dispatch':
        this.curUseRowGroup = group;
        this.curUseRowGroup.get('UIBOT_BUTTON_GROUP')['_component'].dispatchLoading = true;
        this.onDispatch().finally(() => {
          this.curUseRowGroup.get('UIBOT_BUTTON_GROUP')['_component'].dispatchLoading = false;
        });
        this.useMaintenanceModelFromType = type;
        break;
      case 'loseEfficacy':
        this.curUseRowGroup = group;
        this.curUseRowGroup.get('UIBOT_BUTTON_GROUP')['_component'].loseEfficacyLoading = true;
        this.onLoseEfficacy().finally(() => {
          this.curUseRowGroup.get('UIBOT_BUTTON_GROUP')['_component'].loseEfficacyLoading = false;
        });
        this.useMaintenanceModelFromType = type;
        break;
      case 'rowSelected':
        const isSelected = e.$event.isSelected;
        if (isSelected) {
          this.rowSelectedGroups.add(e.$event.formGroup);
        } else {
          this.rowSelectedGroups.delete(e.$event.formGroup);
        }
        this.useMaintenanceModelFromType = type;
        break;
      default:
        break;
    }
  }
}
