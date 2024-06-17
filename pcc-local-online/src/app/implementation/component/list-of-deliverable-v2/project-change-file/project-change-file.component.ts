import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { BasicTableCellService } from '@app-custom/ui/ac-table-cell';
import { AttachmentComponent } from '../attachment/attachment.component';
import { ColDef } from 'ag-grid-community';
import { DynamicFormService } from '@athena/dynamic-core';
import { CommonService } from 'app/implementation/service/common.service';
import { DefaultToolbar } from '@athena/dynamic-ui';
import { ListOfDeliverableV2Service } from '../list-of-deliverable.service';
import { TranslateService } from '@ngx-translate/core';
import { AcEditableTableComponent } from '@app-custom/ui/ac-table';

@Component({
  selector: 'app-project-change-file',
  templateUrl: './project-change-file.component.html',
  styleUrls: ['./project-change-file.component.less'],
})
export class ProjectChangeFileComponent implements OnInit {
  @ViewChild('acTable', { static: false }) acTable!: AcEditableTableComponent;
  frameworkComponents: any = {
    ...this.basicCelleService.getDefaultTableCellComponent(),
    attachment: AttachmentComponent,
  };
  public columnDefs: ColDef[] | any[] = [
    {
      headerName: this.translateService.instant('dj-pcc-项目'),
      field: 'project_name',
      valueType: '',
      width: 250,
      filter: true,
      resizable: true,
      sortable: true,
      flex: 1,
      // cellRendererParams: {
      //   models: [{}],
      //   componentType: 'containExplicit',
      //   compProps: {
      //     columns: [{ field: 'project_name' }, { field: 'project_no' }],
      //   },
      // },
    },
    {
      headerName: this.translateService.instant('dj-pcc-原版本'),
      field: 'old_change_version',
      width: 100,
      filter: true,
      resizable: true,
      sortable: true,
      repairWidth: false,
    },
    {
      headerName: this.translateService.instant('dj-pcc-版本'),
      field: 'change_version',
      filter: true,
      width: 100,
      resizable: true,
      sortable: true,
      repairWidth: false,
    },
    {
      headerName: this.translateService.instant('dj-pcc-项目变更附件2'),
      field: 'pcc_project_change_task',
      filter: false,
      resizable: true,
      sortable: false,
      width: 240,
      flex: 2,
      cellRendererParams: {
        models: [{}],
        componentType: 'attachment',
        compProps: {},
      },
    },
  ];

  public dataSource: any[] = [];

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
    private formService: DynamicFormService,
    public commonService: CommonService,
    public listOfDeliverableV2Service: ListOfDeliverableV2Service,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.dataSource = this.props.pageData;
  }
  rowSelected(e) {
    setTimeout(() => {
      this.listOfDeliverableV2Service.batchDownloadsData.clear();
      const selectedRows = this.acTable._selectedNodes;
      selectedRows.forEach((row) => {
        this.listOfDeliverableV2Service.batchDownloadsData.add(row);
      });
    });
  }
}
