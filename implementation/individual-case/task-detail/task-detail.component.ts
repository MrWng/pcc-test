import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, SkipSelf } from '@angular/core';
import _ from 'lodash';

import {
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
  DynamicTableModel,
  multiple,
} from '@athena/dynamic-core';
import { TaskDetailService } from './task-detail.service';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/implementation/service/common.service';
import * as moment from 'moment';
import { cloneDeep } from '@athena/dynamic-core';
import { DwUserService } from '@webdpt/framework/user';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { AthModalService } from '@athena/design-ui/src/components/modal';
import { forkJoin, of } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { APIService } from 'app/implementation/service/api.service';
import { BasicTableCellService } from '@app-custom/ui/ac-table-cell';
import { ColDef } from 'ag-grid-community';
import { FROM_GROUP_KEY, columnDefs, rules } from './config';

@Component({
  selector: 'app-task-detail-individual-case',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.less'],
  providers: [TaskDetailService],
})
export class TaskDetailIndividualCaseComponent implements OnInit {
  state: string = '1';
  baseData: Array<any> = [];
  tabList: Array<any> = [
    {
      label: 'dj-default-待处理n项',
      sum: 0,
      code: '1',
      tableDataSource: [],
    },
    {
      label: 'dj-default-已完成n项',
      sum: 0,
      code: '2',
      tableDataSource: [],
    },
  ];
  isShowSpin: boolean = true;
  waittingData = [];
  completedData = [];
  frameworkComponents: any = this.basicCelleService.getDefaultTableCellComponent();
  columnDefs = columnDefs;
  rules = rules;
  athTableProps = {
    suppressClickEdit: false,
    rowIndex: false,
  };
  constructor(
    @SkipSelf()
    public wbsService: DynamicWbsService,
    public apiService: APIService,
    protected changeRef: ChangeDetectorRef,
    private formService: DynamicFormService,
    public taskDetailService: TaskDetailService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    protected translateService: TranslateService,
    private userService: DwUserService,
    private configService: DwSystemConfigService,
    public commonService: CommonService,
    private modalService: AthModalService,
    private messageService: NzMessageService,
    public basicCelleService: BasicTableCellService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData(): Promise<any> {
    try {
      this.isShowSpin = true;
      const taskDetail = cloneDeep(this.wbsService.taskDetail);
      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.getWorkReport({ taskDetail, process_status: '1' }),
        completed: this.taskDetailService.getWorkReport({ taskDetail, process_status: '2' }),
      }).toPromise();
      this.waittingData = waitting;
      this.completedData = completed;
      this.baseData = waitting.concat(completed);
      this.buildPageInfo();
      this.initData();
    } catch (error) {
    } finally {
      this.isShowSpin = false;
      this.changeRef.markForCheck();
    }
  }

  /**
   * 待处理和已完成数量
   */
  buildPageInfo(): void {
    this.baseData.forEach((o, i) => {
      this.statisticsSum(o);
    });
  }

  /**
   * 统计待处理和已完成的总数量
   * @param o
   */
  statisticsSum(o): void {
    if (o.state === '1') {
      this.tabList[0].sum++;
    } else {
      this.tabList[1].sum++;
    }
  }

  changeTab(state: string): void {
    this.state = state;
    this.changeRef.markForCheck();
  }

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj - pcc - ${val} `);
  }
  translateWord(val: string): String {
    return this.translateService.instant(`dj -default -${val} `);
  }

  pageData = {
    [FROM_GROUP_KEY]: [],
  };

  initData = () => {
    // 初始化数据
    this.tabList[0].tableDataSource = this?.formService
      ?.buildFormGroupForCustom(
        this.taskDetailService.createTreeField(this.waittingData),
        this.commonService.content,
        this.rules
      )
      // @ts-ignore
      ?.get(FROM_GROUP_KEY)?.controls as unknown as FormGroup[];
    this.tabList[1].tableDataSource = this?.formService
      ?.buildFormGroupForCustom(
        this.taskDetailService.createTreeField(this.completedData),
        this.commonService.content,
        this.rules
      )
      // @ts-ignore
      ?.get(FROM_GROUP_KEY)?.controls as unknown as FormGroup[];
  };
}
