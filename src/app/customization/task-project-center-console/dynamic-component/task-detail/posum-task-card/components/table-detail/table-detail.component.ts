import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DynamicFormService,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicFormModel,
  cloneDeep,
  multiple
} from '@ng-dynamic-forms/core';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { TranslateService } from '@ngx-translate/core';
import { UploadAndDownloadService } from 'app/customization/task-project-center-console/service/upload.service';
import { WbsTabsService } from '../../../../../component/wbs-tabs/wbs-tabs.service';
import { PosumTaskCardService } from '../../posum-task-card.service';

@Component({
  selector: 'app-table-detail',
  templateUrl: './table-detail.component.html',
  styleUrls: ['./table-detail.component.less']
})
export class TableDetailComponent implements OnInit {

  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public openWindowService: OpenWindowService,
    public wbsTabsService: WbsTabsService,
    public uploadService: UploadAndDownloadService,
    private formService: DynamicFormService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public posumTaskCardService: PosumTaskCardService
  ) { }

  @Input() listData: any[];
  @Input() type: string;
  @Input() isShowSpin: boolean;

  public group: FormGroup;
  public model: DynamicFormModel;
  public emptyData: boolean = false;
  public tableList: any[] = [];

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.listData && Array.isArray(changes.listData.currentValue)) {
      const list = cloneDeep(changes.listData.currentValue);
      this.tableList = this.formatData(list); // 格式化
      if (!changes.isShowSpin || !changes.isShowSpin.currentValue) {
        this.setTableJson(this.formatTableData(list));
      }
    }
    this.changeRef.markForCheck();
  }
  formatData(list) {
    // 格式化数据
    let names = [];
    const baseData = cloneDeep(list);
    if (['MOOP'].includes(this.posumTaskCardService?.taskInfo?.task_category)) {
      names = [
        'status',
        'production_control_name',
        'wo_no',
        'item_no',
        'item_name_spec',
        'item_spec',
        'production_qty',
      ];
    }

    for (let i = 0; i < baseData.length; i++) {
      if (i > 0) {
        if (this.checkData(baseData[i], baseData[i - 1], names)) {
          for (const n in names) {
            if (names[n] === 'complete_rate') {
              list[i][names[n]] = '-1';
            } else {
              list[i][names[n]] = '';
            }
          }
        }
      }
    }
    return list;
  }
  checkData(list, list1, nameList) {
    let isSome = true;
    for (const i in nameList) {
      if (list[nameList[i]] === list1[nameList[i]]) {
        isSome = true;
      } else {
        return false;
      }
    }
    return isSome;
  }

  setTableJson(list): void {
    const { layout, pageData, rules, content } = this.initTemplate(list);
    const initializedData = this.formService.initData(layout, pageData, rules, content);
    this.model = initializedData.formModel;
    this.group = initializedData.formGroup;
    this.changeRef.markForCheck();
  }

  initTemplate(tableList): any {
    const list = this.filterMProcessAssignmentColumnDefs();
    return {
      pageData: {
        table_list: tableList,
      },
      layout: [
        {
          id: 'table_list',
          type: 'GRID_TABLE',
          schema: 'table_list',
          editable: false,
          setting: {},
          index: false,
          checkbox: false,
          scriptFilters: [],
          columnDefs: list,
          operations: [],
          details: [],
        },
      ],
      content: {
        pattern: 'DATA_ENTRY',
        category: 'SIGN-DOCUMENT',
      },
      rules: [],
      style: {},
    };
  }

  formatTableData(list) {
    const status = {
      key_1: '未生产',
      key_2: '已发料',
      key_3: '生产中',
      key_Y: '已完工',
      key_y: '指定完工',
      key_N: '未完工',
    };
    const op_type = {
      key_1: '厂内制程',
      key_2: '托外制程',
      key_3: '二者皆有',
    };
    list.forEach((o) => {
      o.status = o.status ? status[`key_${o.status}`] : '';
      o.op_type = o.op_type ? op_type[`key_${o.op_type}`] : '';
      if (!isNaN(o.complete_rate)) {
        o.complete_rate = `${multiple(o.complete_rate.toFixed(4), 100)}%`;
      }
      o.out_plan_time === 'Y' ? (o.out_plan_time = '*') : (o.out_plan_time = '');
    });
    return list;
  }

  filterMProcessAssignmentColumnDefs(): any[] {
    const { translateService: ts } = this;
    const list = [
      {
        headerName: ts.instant('dj-default-状态码'),
        columns: [
          {
            schema: 'status',
            headerName: ts.instant('dj-default-状态码'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-生管人员'),
        columns: [
          {
            schema: 'production_control_name',
            headerName: ts.instant('dj-default-生管人员'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-pcc-工单号码'),
        columns: [
          {
            schema: 'wo_no',
            headerName: ts.instant('dj-pcc-工单号码'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-料号'),
        columns: [
          {
            schema: 'item_no',
            headerName: ts.instant('dj-default-料号'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-品名规格'),
        columns: [
          {
            schema: 'item_name_spec',
            headerName: '品名',
          },
          {
            schema: 'item_spec',
            headerName: '规格',
          }
        ],
      },
      {
        headerName: ts.instant('dj-default-生产数量'),
        columns: [
          {
            schema: 'production_qty',
            headerName: ts.instant('dj-default-生产数量'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-加工顺序'),
        columns: [
          {
            schema: 'process_seq',
            headerName: ts.instant('dj-default-加工顺序'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-制程代号'),
        columns: [
          {
            schema: 'process_no',
            headerName: ts.instant('dj-default-制程代号'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-制程名称'),
        columns: [
          {
            schema: 'op_name',
            headerName: ts.instant('dj-default-制程名称'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-性质'),
        columns: [
          {
            schema: 'op_type',
            headerName: ts.instant('dj-default-性质'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-线别/厂商名称'),
        columns: [
          {
            schema: 'supplier_name',
            headerName: ts.instant('dj-default-线别/厂商名称'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-投入数量'),
        columns: [
          {
            schema: 'feed_qty',
            headerName: ts.instant('dj-default-投入数量'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-完成数量'),
        columns: [
          {
            schema: 'complete_qty',
            headerName: ts.instant('dj-default-完成数量'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-预计开工日'),
        columns: [
          {
            schema: 'plan_date_s',
            headerName: ts.instant('dj-default-预计开工日'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-预计完工日'),
        columns: [
          {
            schema: 'plan_date_e',
            headerName: ts.instant('dj-default-预计完工日'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-实际开工日'),
        columns: [
          {
            schema: 'actual_date_s',
            headerName: ts.instant('dj-default-实际开工日'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-实际完工日'),
        columns: [
          {
            schema: 'actual_date_e',
            headerName: ts.instant('dj-default-实际完工日'),
          },
        ],
      },
      {
        headerName: ts.instant('dj-default-完成率'),
        columns: [
          {
            schema: 'complete_rate',
            headerName: ts.instant('dj-default-完成率'),
          },
        ],
      },
    ];
    return list;
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}

