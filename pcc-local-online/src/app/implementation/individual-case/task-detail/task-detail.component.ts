import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  SkipSelf,
  ViewChild,
  ViewChildren,
} from '@angular/core';
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
import { FROM_GROUP_KEY, ORGHIERARCHY, rules } from './config';
import { AcEditableTableComponent } from '@app-custom/ui/ac-table';
import { CustomFilter } from 'app/implementation/utils/commonCustomFilter';
import { ButtonOperationType, ButtonOperation } from '@athena/design-ui';
import { ExportComponent } from './export/export.component';
import { AcFullScreenComponent } from '@app-custom/ui/full-screen';
import { TaskDetailComponent } from 'app/implementation/component/wbs/components/task-detail/task-detail.component';
import { CompletionStatusComponent } from './completion-status/completion-status.component';
import { FullScreenComponent } from './full-screen/full-screen.component';
import { PercentComponent } from './percent/percent.component';
import { WorkstationTypeComponent } from './workstation-type/workstation-type.component';

@Component({
  selector: 'app-task-detail-individual-case',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.less'],
  providers: [TaskDetailService],
})
export class TaskDetailIndividualCaseComponent implements OnInit, AfterViewInit {
  @Input() data: {
    tenantIdComponent: string;
    _component: TaskDetailComponent;
  };
  @Input() showCloseBtn: boolean = true;
  @ViewChildren(AcEditableTableComponent) editableTables: QueryList<AcEditableTableComponent>;
  state: string = '1';
  baseData: Array<any> = [];
  tabList: Array<any> = [];
  columnDefs: Array<any> = [];
  isShowSpin: boolean = true;
  waittingData = [];
  completedData = [];
  completedParams = {};
  waittingParams = {};
  frameworkComponents: any = {
    ...this.basicCelleService.getDefaultTableCellComponent(),
    'completion-status': CompletionStatusComponent,
    'percent-display': PercentComponent,
    'workstation-type': WorkstationTypeComponent,
  };
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
  getRowClass(params: any) {
    const data = params.data;
    if (data.get(ORGHIERARCHY).value.length === 1) {
      return ['parent-node-flag'];
    }
    return [''];
  }
  ngOnInit() {
    this.loadData();
  }
  ngAfterViewInit() {}
  initTabList() {
    const fullScreenDom = this.elementRef.nativeElement;
    this.tabList = [
      {
        label: 'dj-default-待处理n项',
        sum: 0,
        code: '1',
        tableDataSource: [],
        tableColumnDefs: [],
        taleButtonOperations: [
          {
            type: ButtonOperationType.component,
            component: ExportComponent,
            props: {
              isShow: this.waittingData.length,
              backendParams: this.waittingParams,
            },
          },
          {
            type: ButtonOperationType.component,
            component: FullScreenComponent,
            props: {
              fullScreenDom,
            },
          },
        ],
      },
      {
        label: 'dj-default-已完成n项',
        sum: 0,
        code: '2',
        tableDataSource: [],
        tableColumnDefs: [],
        taleButtonOperations: [
          {
            type: ButtonOperationType.component,
            component: ExportComponent,
            props: {
              isShow: this.completedData.length,
              backendParams: this.completedParams,
            },
          },
          {
            type: ButtonOperationType.component,
            component: FullScreenComponent,
            props: {
              fullScreenDom,
            },
          },
        ],
      },
    ];
  }
  test(e) {
    // console.log(e, 'ee');
  }
  closeTaskDetail() {
    this.wbsService.taskDetail = null;
    if (document.fullscreenElement === this.elementRef.nativeElement) {
      document.exitFullscreen();
      this.taskDetailService.isFullScreen = false;
    }
  }
  async loadData(): Promise<any> {
    try {
      this.isShowSpin = true;
      if (!this.wbsService.taskDetail) {
        const taskInfo = await this.commonService
          .getInvData('task.info.get', {
            project_info: [
              {
                control_mode: '1',
                ...(this.commonService.content.executeContext?.bpmData?.project_info?.[0] || {}),
              },
            ],
          })
          .toPromise();
        this.wbsService.taskDetail = taskInfo.data?.project_info?.[0];
      }
      const taskDetail = cloneDeep(this.wbsService.taskDetail);
      const waittingParams = {
          master: [
            this.taskDetailService.transformParams({
              ...taskDetail,
              process_status: '1',
            }),
          ],
        },
        completedParams = {
          master: [
            this.taskDetailService.transformParams({
              ...taskDetail,
              process_status: '2',
            }),
          ],
        };
      const { waitting, completed } = await forkJoin({
        waitting: this.taskDetailService.getWorkReport(waittingParams, taskDetail.eoc_company_id),
        completed: this.taskDetailService.getWorkReport(completedParams, taskDetail.eoc_company_id),
      }).toPromise();
      this.waittingData = waitting;
      this.completedData = completed;
      this.completedParams = completedParams;
      this.waittingParams = waittingParams;
      this.baseData = waitting.concat(completed);
      this.initTabList();
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
  selectedIndexChange() {
    // this.changeRef.markForCheck();
  }
  initData() {
    // 初始化数据
    const data = [this.waittingData, this.completedData];
    this.taskDetailService.pageData = data;
    data.forEach((tableData, index) => {
      const customFilter = new CustomFilter(ORGHIERARCHY, this.translateService);
      this.tabList[index]['customFilter'] = customFilter;
      this.tabList[index].sum = tableData.length;
      // this.tabList[index].taleButtonOperations[0].props.isShow = tableData.length;
      this.tabList[index].tableColumnDefs = this.taskDetailService.getColumnDefs(
        customFilter,
        this.translateService
      );
      this.tabList[index].tableDataSource = this?.formService
        ?.buildFormGroupForCustom(
          this.taskDetailService.createTreeField(data[index]),
          this.commonService.content,
          rules
        )
        // @ts-ignore
        ?.get(FROM_GROUP_KEY)?.controls as unknown as FormGroup[];
    });
    setTimeout(() => {
      this.editableTables.forEach((table, index) => {
        this.tabList[index]['customFilter'].setGridApi(table.gridApi);
      });
    }, 100);
  }
}
