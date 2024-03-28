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
import { ProblemHandlingService, pageDataChangeEmitterType } from '../../problem-handling.service';
import { HandlingMattersTableService } from './handling-matters-table.service';
import { DwFormArray, DwFormGroup } from '@athena/dynamic-core';
import { Subscription } from 'rxjs';
import { CommonService } from 'app/implementation/service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { QuestDoStatus, QuestPageType } from '../../../../config';
import { PccProblemHandlingService } from '../../../../pcc-problem-handling.service';

@Component({
  selector: 'app-handling-matters-table',
  templateUrl: './handling-matters-table.component.html',
  styleUrls: ['./handling-matters-table.component.less'],
  providers: [HandlingMattersTableService],
})
export class HandlingMattersTableComponent implements OnInit, OnChanges, OnDestroy {
  @Output() selectRowChange = new EventEmitter();
  @Input() setRightBtnDisabled?: (disabled: boolean) => void;
  selectedRows = new Set();
  subs: Subscription = new Subscription();
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
    public handlingMattersTableService: HandlingMattersTableService,
    private problemHandlingService: ProblemHandlingService,
    private pccProblemHandlingService: PccProblemHandlingService
  ) {}
  ngOnInit() {
    this.problemHandlingService.pageDataChangeEmitter.subscribe(({ data, type }) => {
      const readonly =
        this.pccProblemHandlingService?.content?.pageType === QuestPageType.PROBLEM_ACCEPTANCE ||
        this.pccProblemHandlingService?.content?.pageReadonly;
      const formatQuestionDoInfo = () => {
        const { question_do_info = [] } = data;
        return question_do_info.map((item) => {
          item.actual_finish_datetime =
            item.actual_finish_datetime === '9998-12-31' ||
            item.actual_finish_datetime === '9998/12/31'
              ? ''
              : item.actual_finish_datetime;
          return item;
        });
      };
      switch (type) {
        case pageDataChangeEmitterType.INIT:
          this.handlingMattersTableService.generateDynamicCop(formatQuestionDoInfo(), !readonly);
          this.handlingMattersTableService.tableGroup['pageData'] = data;
          this.handlingMattersTableService.tableGroup.get(this.handlingMattersTableService.tableId)[
            'pageData'
          ] = data;
          this.initFormValueChangedHandler();
          this.changeRef.markForCheck();
          return;
        case pageDataChangeEmitterType.UPDATE:
          this.handlingMattersTableService.generateDynamicCop(formatQuestionDoInfo(), !readonly);
          this.handlingMattersTableService.tableGroup.get(this.handlingMattersTableService.tableId)[
            'pageData'
          ] = data;
          this.initFormValueChangedHandler();
          return;
      }
    });
  }
  ngOnChanges() {}
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  get tableFormGroup() {
    return this.handlingMattersTableService.tableGroup.get(
      this.handlingMattersTableService.tableId
    ) as DwFormArray;
  }
  get tableComponent() {
    return (this.tableFormGroup as any)._component;
  }
  private initFormValueChangedHandler() {
    const sub = this.handlingMattersTableService.tableGroup.valueChanged.subscribe((e) => {
      const operate = e.operate,
        control = e.control;
      if (operate === 'remove') {
        const uibotCheckedCtr = control.get('uibot_checked'),
          tableData = control.parent.getRawValue() as any[];
        uibotCheckedCtr.value
          ? this.rowSelectedHandler({
              formGroup: control,
              isSelected: false,
            })
          : this.selectedRows.delete(control);
        uibotCheckedCtr.isRemoved = true;
        if (tableData) {
          this.setRightBtnDisabled(
            tableData.length === 0 ||
              !tableData.every((item) => item.process_status === QuestDoStatus.DONE)
          );
        }
        return;
      }

      if (operate !== 'add' && control.getName() === 'uibot_checked' && !control.isRemoved) {
        this.rowSelectedHandler({
          formGroup: e.control.parent,
          isSelected: e.newValue,
        });
      }
      if (operate === 'add' || control.getName() === 'process_status') {
        const tableData = control?.root
          ?.get(this.handlingMattersTableService.tableId)
          ?.getRawValue();
        if (tableData && Array.isArray(tableData)) {
          this.setRightBtnDisabled(
            tableData.length === 0 ||
              !tableData.every((item) => item.process_status === QuestDoStatus.DONE)
          );
        }
      }
    });
    this.subs.add(sub);
  }
  rowSelectedHandler({ formGroup, isSelected }: { formGroup: DwFormGroup; isSelected: boolean }) {
    isSelected ? this.selectedRows.add(formGroup) : this.selectedRows.delete(formGroup);
    this.selectRowChange.emit([...this.selectedRows]);
  }
  addRow(data) {
    this.tableComponent?.addRow(data);
  }
  removeRows(rows: string[]) {
    this.tableComponent?.removeRows(rows);
  }
}
