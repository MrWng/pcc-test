import { Component, EventEmitter, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { AttachmentComponent } from '../attachment/attachment.component';
import { BasicTableCellService } from '@app-custom/ui/ac-table-cell';
import { CommonService } from 'app/implementation/service/common.service';
import { DwFormGroup, DynamicFormService, TableTreeDataOption } from '@athena/dynamic-core';
import { DefaultToolbar } from '@athena/dynamic-ui';
import { ListOfDeliverableV2Service } from '../list-of-deliverable.service';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup } from '@angular/forms';
import { fileKeyMap } from '../config';
import { AcEditableTableComponent } from '@app-custom/ui/ac-table';
const FROM_GROUP_KEY = 'company_check';

@Component({
  selector: 'app-task-file',
  templateUrl: './task-file.component.html',
  styleUrls: ['./task-file.component.less'],
})
export class TaskFileComponent implements OnInit {
  @ViewChild('editableTable', { static: false }) editableTable!: AcEditableTableComponent;
  @Output() fileChanged = new EventEmitter();
  frameworkComponents: any = {
    ...this.basicCelleService.getDefaultTableCellComponent(),
    attachment: AttachmentComponent,
  };
  toolbarConfig: DefaultToolbar = {
    // 打开列设置和多条件排序
    icons: [],
  };
  treeDataOption = {
    schema: 'treePath',
    rowAllExpanded: true,
    addChildrenRow: false,
    addChildrenRowText: '新增子行',
    suppressRemoveParentRow: false,
  };
  columnDefs = [
    {
      headerName: this.translateService.instant('dj-pcc-任务名称'),
      field: 'task_name',
      valueType: '',
      width: 200,
      flex: 1,
      filter: true,
      sortable: false,
      resizable: true,
      pinned: 'left',
      cellRendererParams: {
        models: [{}],
        componentType: 'cascade',
        compProps: {
          hideIcon: false,
          editable: false,
          // 父子层级缩进
          // indentation: 0,
          // 层级展示字段
          orgHierarchy: 'treePath',
          fromGroupKey: FROM_GROUP_KEY,
        },
      },
    },
    {
      headerName: this.translateService.instant('dj-pcc-交付物样板'),
      field: 'manual_assignment_sample_delivery',
      filter: false,
      sortable: false,
      width: 250,
      flex: 1,
      resizable: true,
      cellRendererParams: {
        componentType: 'attachment',
        compProps: {
          disabled: false,
          fileChanged: this.fileChangedHandler.bind(this),
        },
      },
    },
    {
      headerName: this.translateService.instant('dj-pcc-交付物'),
      field: 'manual_assignment_delivery',
      valueType: '',
      filter: false,
      sortable: false,
      width: 250,
      flex: 1,
      resizable: true,
      cellRendererParams: {
        componentType: 'attachment',
        compProps: {
          disabled: false,
          // 复合字段，从后往前匹配
          matchPath: new Set([
            'moh_deliverable',
            'manual_assignment_delivery_plm',
            'manual_assignment_delivery',
          ]),
          fileChanged: this.fileChangedHandler.bind(this),
        },
      },
    },
    {
      headerName: this.translateService.instant('dj-pcc-任务附件'),
      field: 'manual_assignment_attachment',
      valueType: '',
      filter: false,
      sortable: false,
      resizable: true,
      width: 250,
      flex: 1,
      cellRendererParams: {
        componentType: 'attachment',
        compProps: {
          disabled: false,
          matchPath: new Set(['moh_attachment', 'manual_assignment_attachment']),
          fileChanged: this.fileChangedHandler.bind(this),
        },
      },
    },
    {
      headerName: this.translateService.instant('dj-pcc-任务变更附件'),
      field: 'pcc_wbs_plan_changes',
      filter: false,
      width: 250,
      flex: 1,
      resizable: true,
      sortable: false,
      cellRendererParams: {
        componentType: 'attachment',
        compProps: {
          disabled: true,
        },
      },
    },
  ];
  dataSource = [];
  public athTableProps = {
    suppressClickEdit: false,
    rowIndex: false,
    pagination: false,
    frontPagination: false,
    toolbarConfig: null,
    defaultToolbarConfig: null,
  };
  constructor(
    @Inject('data') public props: any,
    public basicCelleService: BasicTableCellService,
    public commonService: CommonService,
    private formService: DynamicFormService,
    private translateService: TranslateService,
    public listOfDeliverableV2Service: ListOfDeliverableV2Service
  ) {}

  ngOnInit() {
    const data = this.transformData(
      this.props.pageData.map((item) => {
        return {
          ...item,
        };
      })
    );
    // this.dataSource = data;
    this.dataSource = this.formService
      .buildFormGroupForCustom(
        {
          [FROM_GROUP_KEY]: data,
        },
        this.commonService.content,
        []
      )
      // @ts-ignore
      ?.get(FROM_GROUP_KEY)?.controls as unknown as FormGroup[];
  }
  rowSelected(e) {
    setTimeout(() => {
      this.listOfDeliverableV2Service.batchDownloadsData.clear();
      const selectedRows = this.editableTable._selectedNodes;
      selectedRows.forEach((row: DwFormGroup) => {
        this.listOfDeliverableV2Service.batchDownloadsData.add(row.getRawValue());
      });
    });
  }
  fileChangedHandler(e) {
    this.fileChanged.emit(e);
    this.listOfDeliverableV2Service.sendOutputEvent(e);
  }
  transformData(data: any[]) {
    const map = Object.create(null),
      fileKeys = Object.keys(fileKeyMap);
    data.forEach((item) => {
      item['treePath'] = [item.task_no];
      map[item.task_no] = item;
      if (item['manual_assignment_delivery_plm'] && item['manual_assignment_delivery_plm'].length) {
        // plm类型附件
        item['$$_disableChecked'] = true;
      } else {
        item['$$_disableChecked'] = fileKeys.every(
          (key) => item[key]?.length === 0 || item[key] === undefined
        );
      }
    });
    let res = [];
    data.forEach((item) => {
      if (item.is_root_task) {
        res.push(item);
        return;
      }
      const wrapper = [item];
      handler(item, wrapper);
      res = res.concat(wrapper);
    });
    function handler(item, wrapper = []) {
      let parentNode = map[item.upper_level_task_no];
      item.treePath.unshift(parentNode.task_no);
      wrapper.unshift(parentNode);
      while (hasParentNode(parentNode)) {
        parentNode = map[parentNode.upper_level_task_no];
        item.treePath.unshift(parentNode.task_no);
        wrapper.unshift(parentNode);
      }
    }
    function hasParentNode(item) {
      return !item.is_root_task && map[item.upper_level_task_no];
    }
    return [...new Set(res)];
  }
}
