import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BasicTableCellService } from '@app-custom/ui/ac-table-cell';
import { ColDef } from 'ag-grid-community';
import { AttachmentComponent } from '../attachment/attachment.component';
import { DynamicFormService } from '@athena/dynamic-core';
import { FormGroup } from '@angular/forms';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { DynamicWbsService } from '../../wbs/wbs.service';
import { ListOfDeliverableV2Service } from '../list-of-deliverable.service';
import { DefaultToolbar } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { AcEditableTableComponent } from '@app-custom/ui/ac-table';

@Component({
  selector: 'app-project-file',
  templateUrl: './project-file.component.html',
  styleUrls: ['./project-file.component.less'],
})
export class ProjectFileComponent implements OnInit, OnChanges {
  @ViewChild('acTable', { static: false }) acTable!: AcEditableTableComponent;
  @Output() fileChanged = new EventEmitter();
  frameworkComponents: any = {
    ...this.basicCelleService.getDefaultTableCellComponent(),
    attachment: AttachmentComponent,
  };
  public columnDefs: ColDef[] | any[] = [
    {
      headerName: this.translateService.instant('dj-pcc-项目'),
      field: 'project_name',
      valueType: '',
      width: 200,
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
      headerName: this.translateService.instant('dj-pcc-项目附件'),
      field: 'athena_launch_special_project_create',
      filter: false,
      resizable: true,
      sortable: false,
      width: 240,
      flex: 1,
      cellRendererParams: {
        models: [{}],
        componentType: 'attachment',
        compProps: {
          disabled: false,
          fileChanged: this.fileChangedHandler.bind(this),
        },
      },
    },
    {
      headerName: this.translateService.instant('dj-pcc-项目状态变更附件2'),
      field: 'pcc_project_status_change',
      filter: false,
      width: 240,
      flex: 1,
      resizable: true,
      sortable: false,
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
    public injector: Injector,
    private formService: DynamicFormService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService,
    public listOfDeliverableV2Service: ListOfDeliverableV2Service,
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.dataSource = this.props.pageData;
  }
  ngOnChanges(change: SimpleChanges) {}
  rowSelected(e) {
    setTimeout(() => {
      this.listOfDeliverableV2Service.batchDownloadsData.clear();
      const selectedRows = this.acTable._selectedNodes;
      selectedRows.forEach((row) => {
        this.listOfDeliverableV2Service.batchDownloadsData.add(row);
      });
    });
  }
  fileChangedHandler(e) {
    this.fileChanged.emit(e);
    this.listOfDeliverableV2Service.sendOutputEvent(e);
  }
}
