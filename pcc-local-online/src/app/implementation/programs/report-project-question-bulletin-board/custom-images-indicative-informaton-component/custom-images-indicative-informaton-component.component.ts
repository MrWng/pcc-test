import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import { DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicFormLayoutService, DynamicFormValidationService } from '@athena/dynamic-core';
// eslint-disable-next-line max-len
import { DynamicCustomImagesIndicativeInformationComponentModel } from '../../../model/custom-images-indicative-informaton-component/custom-images-indicative-informaton-component.model';
import { CustomImagesIndicativeInformatonService } from './custom-images-indicative-informaton-component.service';
import { HttpClient } from '@angular/common/http';
import { CommonService } from 'app/implementation/service/common.service';
import { DwSystemConfigService } from '@webdpt/framework';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { ColDef } from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { AcExportComponent } from '@app-custom/ui/export';

@Component({
  selector: 'app-images-indicative-information',
  templateUrl: './custom-images-indicative-informaton-component.component.html',
  styleUrls: ['./custom-images-indicative-informaton-component.component.less'],
  providers: [CustomImagesIndicativeInformatonService, AthMessageService]
})
export class CustomImagesIndicativeInformatonComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicCustomImagesIndicativeInformationComponentModel;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  @ViewChild('export') export!: AcExportComponent;

  pccContent: any;
  dataSource: [] = [];
  fileName: string = this.translateService.instant('dj-pcc-项目问题看板');
  chosenList: any = [];
  isExport: boolean = false;
  isLoading: boolean = true;

  public columnDefs: ColDef[] | any[] = [
    {
      headerName: this.translateService.instant('dj-pcc-看板状态'),
      field: 'kanban_status',
      minWidth: 180,
      filter: true,
      pinned: 'left'
    },
    {
      headerName: this.translateService.instant('dj-pcc-问题编号'),
      field: 'question_no',
      minWidth: 180,
      filter: true,
      pinned: 'left',
      exportRequired: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-问题描述'),
      field: 'question_description',
      valueType: '',
      width: 280,
      filter: true,
      resizable: true,
      sortable: true,
      exportRequired: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-问题类型'),
      minWidth: 200,
      field: 'question_type_name',
      filter: true,
      sortable: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-问题提出人'),
      field: 'initiator_name',
      minWidth: 150,
      filter: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-问题负责人'),
      minWidth: 150,
      field: 'process_person_name',
      filter: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-发生日期'),
      field: 'question_happen_datetime',
      minWidth: 200,
      filter: true,
      sortable: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-期望关闭日期'),
      field: 'desire_finish_datetime',
      minWidth: 200,
      filter: true,
      sortable: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-实际关闭日期'),
      field: 'actual_finish_datetime',
      minWidth: 200,
      filter: true,
      sortable: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-延迟天数'),
      field: 'delay_days',
      minWidth: 150,
      filter: true,
      sortable: true
    },
    {
      headerName: this.translateService.instant('dj-default-项目编号'),
      field: 'project_no',
      minWidth: 180,
      filter: true
    },
    {
      headerName: this.translateService.instant('dj-default-项目名称'),
      field: 'project_name',
      minWidth: 180,
      filter: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-任务'),
      field: 'task_name',
      minWidth: 180,
    },
    {
      headerName: this.translateService.instant('dj-default-状态'),
      field: 'status',
      minWidth: 180,
      exportRequired: true
    },
    {
      headerName: this.translateService.instant('dj-pcc-处理事项'),
      minWidth: 180,
      field: 'question_do_desc',
    },
    {
      headerName: this.translateService.instant('dj-pcc-处理人'),
      minWidth: 180,
      field: 'd_process_person_name',
    },
    {
      headerName: this.translateService.instant('dj-pcc-计划完成日期'),
      minWidth: 180,
      field: 'plan_finish_datetime',
      disabled: true,
    },
    {
      headerName: this.translateService.instant('dj-pcc-处理状态'),
      minWidth: 180,
      field: 'process_status',
      isCustom: true,
      useType: 'status',
    },
    {
      headerName: this.translateService.instant('dj-pcc-实际完成日期'),
      minWidth: 180,
      field: 'd_actual_finish_datetime',
      disabled: true,
    },
    {
      headerName: this.translateService.instant('dj-pcc-处理说明'),
      minWidth: 280,
      field: 'process_description',
    }
  ];

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private customImagesIndicativeInformatonService: CustomImagesIndicativeInformatonService,
    public commonService: CommonService,
    private http: HttpClient,
    private configService: DwSystemConfigService,
    protected translateService: TranslateService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    this.pccContent = this.model.pccContent ?? [];
    const question_list_info = [];
    this.pccContent?.forEach(item => {
      question_list_info.push({ question_no: item?.question_no });
    });
    const date = new Date();
    const dateStr = date.toLocaleDateString().replace(/\//g, '');
    this.fileName += dateStr;
    if (question_list_info && question_list_info.length) {
      this.commonService.getInvData('project.question.detail.list.get', {question_list_info}).subscribe(res => {
        this.dataSource = res.data?.question_list_info ?? [];
        this.isLoading = false;
        this.isExport = !this.dataSource?.length;
        this.changeRef.markForCheck();
      }, (err) => {
        this.isLoading = false;
        this.isExport = true;
        this.changeRef.markForCheck();
      });
    } else {
      this.isLoading = false;
      this.isExport = true;
    }
  }

  beforeOk(): boolean {
    // this.msgService.info('下载成功的提示信息');
    return true;
  }

  clickOnExport = async () => {
    if (this.isExport) {
      this.export.openExportModel(null, 'all');
    }
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
