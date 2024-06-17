import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ElementRef,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ComponentFactoryResolver,
  Injector,
  Output,
  EventEmitter,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup } from '@angular/forms';
import { OpenWindowService } from '@athena/dynamic-ui';
import {
  cloneDeep,
  DynamicFormLayout,
  DynamicTableModel,
  DynamicFormService,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DwFormGroup,
} from '@athena/dynamic-core';
import { DwUserService } from '@webdpt/framework/user';
import { ListOfDeliverableV2Service } from './list-of-deliverable.service';
import { CommonService, Entry } from '../../service/common.service';
import { UploadAndDownloadService } from '../../service/upload.service';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicWbsService } from '../wbs/wbs.service';
import { ProjectFileComponent } from './project-file/project-file.component';
import { ProjectChangeFileComponent } from './project-change-file/project-change-file.component';
import { TaskFileComponent } from './task-file/task-file.component';
import { fileKeyMap } from './config';
import { audit, debounceTime, last, switchMap, take, takeLast } from 'rxjs/operators';
import { of } from 'rxjs';
@Component({
  selector: 'app-list-of-deliverable-v2',
  templateUrl: './list-of-deliverable.component.html',
  styleUrls: ['./list-of-deliverable.component.less'],
  providers: [ListOfDeliverableV2Service],
})
/**
 * 项目计划维护、计划协同排定
 */
export class ListOfDeliverableV2Component implements OnInit, OnDestroy, OnChanges {
  @Input() source: Entry = Entry.card;
  @Input() executeContext: any;
  @Input() tabName: String;
  @Input() tabIndex: any; // 页面中的tab页下标
  @Output() callTabLoading = new EventEmitter();
  projectChangeAttachment = [];
  taskAttachment = [];
  projectAttachment = [];
  tabs = [];
  tabsPageData = [];
  tabSelecedIndex = 0;
  loading = true;
  downloadLoading = false;
  Entry = Entry;
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    public listOfDeliverableService: ListOfDeliverableV2Service,
    public uploadService: UploadAndDownloadService,
    private formService: DynamicFormService,
    private userService: DwUserService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    private messageService: NzMessageService,
    protected elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private resolver: ComponentFactoryResolver,
    public injector: Injector
  ) {}

  ngOnInit(): void {
    this.loadData();
    const sourceSubject = this.listOfDeliverableService.subscribeToOutput();
    sourceSubject.subscribe((e: any) => {
      if (e.type && e.type === 'loading') {
        this.callTabLoading.emit(e);
        return;
      }
      this.filterChanged(e);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tabName === 'app-list-of-deliverable') {
      this.loadData();
    }
  }
  ngOnDestroy(): void {}
  async loadData(
    onlyGetData = false,
    params: { query_scope: string; project_no?: string } = {
      query_scope: 'ALL',
      project_no: this.wbsService.project_no,
    }
  ): Promise<void> {
    try {
      this.loading = true;
      if (!onlyGetData) {
        this.tabSelecedIndex = 0;
      }
      const res = await this.listOfDeliverableService.getDeliverableData({
        query_scope: params.query_scope,
        project_no: this.wbsService.project_no,
        // project_no: '20240410000001',
      });
      this.projectAttachment = res.project_attachment || this.projectAttachment;
      this.taskAttachment = res.task_attachment || this.taskAttachment;
      this.projectChangeAttachment = res.project_change_attachment || this.projectChangeAttachment;
      this.tabsPageData = [
        this.projectAttachment,
        this.taskAttachment,
        this.projectChangeAttachment,
      ];
      this.listOfDeliverableService.source = this.source;
      // eslint-disable-next-line no-unused-expressions
      onlyGetData || this.initComponent();
      this.changeRef.markForCheck();
    } catch (error) {
    } finally {
      this.loading = false;
      this.changeRef.markForCheck();
    }
  }
  initComponent() {
    this.tabs = [
      {
        title: this.translatePccWord('项目文件'),
        componentRef: ProjectFileComponent,
        props: Injector.create({
          providers: [
            {
              provide: 'data',
              useValue: {
                pageData: this.projectAttachment,
                source: this.source,
              },
            },
          ],
          parent: this.injector,
        }),
      },
      {
        title: this.translatePccWord('任务文件'),
        componentRef: TaskFileComponent,
        props: Injector.create({
          providers: [
            { provide: 'data', useValue: { pageData: this.taskAttachment, source: this.source } },
          ],
          parent: this.injector,
        }),
      },
      {
        title: this.translatePccWord('项目变更文件'),
        componentRef: ProjectChangeFileComponent,
        props: Injector.create({
          providers: [
            {
              provide: 'data',
              useValue: {
                pageData: this.projectChangeAttachment,
                source: this.source,
              },
            },
          ],
          parent: this.injector,
        }),
      },
    ];
    // 协同计划剔除任务附件
    if (this.source === Entry.collaborate) {
      this.tabs.splice(1, 1);
    }
    // if (this.projectAttachment.length) {
    //   this.tabs.push({
    //     title: this.translatePccWord('项目文件'),
    //     componentRef: ProjectFileComponent,
    //     props: Injector.create({
    //       providers: [
    //         {
    //           provide: 'data',
    //           useValue: {
    //             pageData: this.projectAttachment,
    //             source: this.source,
    //           },
    //         },
    //       ],
    //       parent: this.injector,
    //     }),
    //   });
    // }
    // if (this.taskAttachment.length) {
    //   this.tabs.push({
    //     title: this.translatePccWord('任务文件'),
    //     componentRef: TaskFileComponent,
    //     props: Injector.create({
    //       providers: [
    //         { provide: 'data', useValue: { pageData: this.taskAttachment, source: this.source } },
    //       ],
    //       parent: this.injector,
    //     }),
    //   });
    // }
    // if (this.projectChangeAttachment.length) {
    //   this.tabs.push({
    //     title: this.translatePccWord('项目变更文件'),
    //     componentRef: ProjectChangeFileComponent,
    //     props: Injector.create({
    //       providers: [
    //         {
    //           provide: 'data',
    //           useValue: {
    //             pageData: this.projectChangeAttachment,
    //             source: this.source,
    //           },
    //         },
    //       ],
    //       parent: this.injector,
    //     }),
    //   });
    // }
  }
  filterChanged(e) {
    const { type, file, removeFiles, fileList } = e;
    const category = type === 'delete' ? removeFiles[0].category : file.category;
    if (category === 'manualAssignmentAttachment' || category === 'manualAssignmentDelivery') {
      this.attachmentChange(e.rowData);
    }
    this.updateValue(e);
  }
  attachmentChange(rowData: any) {
    // 若交付设计器.文档同步至知识中台 = true
    if (!this.wbsService.is_sync_document || this.source !== Entry.card) {
      return;
    }
    const params = { project_info: [{ project_no: this.wbsService.project_no }] };
    this.commonService.getInvData('bm.pisc.project.get', params).subscribe((res: any): void => {
      const status = res.data.project_info[0].project_status;
      if (status === '30') {
        const processParams = {
          data_type: '1',
          project_info: [
            {
              project_no: rowData.project_no,
              root_task_no: rowData?.['root_task_no'] || '',
            },
          ],
        };
        this.commonService
          .getInvData('document.info.sync.process', processParams)
          .subscribe((res1: any): void => {});
      }
    });
  }

  updateFile({ type, rowData, file: curExecFile, removeFiles, fileList }) {
    const newFileList = fileList.map((file) => ({
        id: file.id,
        name: file.name,
        category: file.category,
        categoryId: file.categoryId || file.category_id,
        upload_user_name: file.upload_user_name,
        upload_user_id: file.upload_user_id,
        size: file.size,
        create_date: file.create_date,
        row_data: file.row_data,
      })),
      { project_no, task_no, root_task_no } = rowData;
    const param = {
      is_sync_document: this.source === Entry.card ? this.wbsService.is_sync_document : false,
      project_info: [
        {
          project_no,
          task_no,
          category: type !== 'delete' ? curExecFile.category : removeFiles[0].category,
          attachment: {
            row_data: type !== 'delete' ? curExecFile.row_data : removeFiles[0].row_data,
            data: newFileList,
          },
          root_task_no: this.source === Entry.card ? root_task_no : null,
        },
      ],
    };
    this.commonService.getInvData('project.attachment.info.update', param).subscribe(
      (res: any): void => {
        this.callTabLoading.emit({ type: 'loading', value: false });
      },
      () => {
        this.callTabLoading.emit({ type: 'loading', value: false });
      }
    );
  }

  // 附件和交付物变更时触发
  updateValue({ type, rowData, file, fileList, removeFiles }) {
    // 1、任务附件  2、项目附件  3、项目变更附件
    const tabIndexApiMap = ['2', '1', '3'];
    // 协同计划剔除任务附件
    if (this.source === Entry.card) {
      tabIndexApiMap.splice(1, 1);
    }
    this.callTabLoading.emit({ type: 'loading', value: true });
    const category = type === 'delete' ? removeFiles[0].category : file.category;
    if (
      category === 'athena_LaunchSpecialProject_create' ||
      category === 'manualAssignmentSampleDelivery'
    ) {
      const check_type = ['1', '2', '4', '5'];
      if ('manualAssignmentSampleDelivery' === category) {
        check_type.push('3');
      }
      this.commonService
        .getProjectChangeStatus(rowData.project_no, check_type, '1', rowData.task_no)
        .subscribe(
          async (result: any) => {
            if (result.data?.project_info[0]?.check_result) {
              this.updateFile({ type, rowData, file, removeFiles, fileList });
            } else {
              await this.loadData(true, { query_scope: tabIndexApiMap[this.tabSelecedIndex] });
              this.updateCompProps();
              this.callTabLoading.emit({ type: 'loading', value: false });
            }
          },
          async (error) => {
            await this.loadData(true, { query_scope: tabIndexApiMap[this.tabSelecedIndex] });
            this.updateCompProps();
            this.callTabLoading.emit({ type: 'loading', value: false });
          }
        );
    } else {
      this.uploadApi(type, file, removeFiles);
    }
  }
  // 附件交付物变更时请求接口
  uploadApi(action, data, removeFiles) {
    const apiHandler = (url, params) => {
      this.uploadService.tableInfoToAi(url, params).subscribe(
        (res: any): void => {
          this.callTabLoading.emit({ type: 'loading', value: false });
        },
        () => {
          this.callTabLoading.emit({ type: 'loading', value: false });
        }
      );
    };
    let params, url;
    if (action === 'delete') {
      url = '/api/aam/v1/deleteAttachment';
      removeFiles.forEach((file) => {
        params = {
          category: file.category,
          categoryId: file.categoryId,
          id: file.id,
        };
        apiHandler(url, params);
      });
    } else {
      url = '/api/aam/v1/uploadAttachment';
      params = {
        category: data.category,
        categoryId: data.categoryId,
        id: data.id,
        name: data.name,
        rowDataKey: data.row_data, // 尾部要加;否则无法上传到athena库里
        size: data.size,
        tenantId: this.userService.getUser('tenantId'),
        projectId: data.projectId,
        taskId: data.task_id || 'reply_quotation_task', // 临时类型
      };
      apiHandler(url, params);
    }
  }
  updateCompProps(id?: number) {
    if (id) {
      this.tabs[id].props = Injector.create({
        providers: [
          {
            provide: 'data',
            useValue: { pageData: this.tabsPageData[id], source: this.source },
          },
        ],
        parent: this.injector,
      });
      return;
    }
    this.tabs.forEach((tab, index) => {
      tab.props = Injector.create({
        providers: [
          {
            provide: 'data',
            useValue: { pageData: this.tabsPageData[index], source: this.source },
          },
        ],
        parent: this.injector,
      });
    });
  }
  downLoadAll() {
    this.downloadLoading = true;
    const params = {
      fileIds: [],
    };
    const allSelectData = [...this.listOfDeliverableService.batchDownloadsData],
      fileKeys = Object.keys(fileKeyMap);
    allSelectData.forEach((data: any) => {
      fileKeys.forEach((key) => {
        if (data[key] && data[key].length) {
          params.fileIds = params.fileIds.concat(data[key].map((file) => file.id));
        }
      });
    });
    if (params.fileIds.length) {
      const time = this.getNowTime();
      const fileName =
        this.wbsService.project_no +
        '-' +
        this.tabs[this.tabSelecedIndex].title +
        '-' +
        time +
        '.zip';
      this.uploadService.downloadMultiUrl('Athena', params, fileName).subscribe(
        (res) => {
          this.downloadLoading = false;
          this.messageService.success(this.translatePccWord('下载成功'));
          this.changeRef.markForCheck();
        },
        (e) => {
          this.downloadLoading = false;
          this.changeRef.markForCheck();
        }
      );
    } else {
      this.messageService.error(this.translateService.instant(`dj-pcc-请选择下载文件`));
      this.downloadLoading = false;
    }
  }
  onTabChange() {
    const batchDownloadsData = this.listOfDeliverableService.batchDownloadsData;
    if (!batchDownloadsData.size) {
      return;
    }
    [...batchDownloadsData.values()].forEach((e: any) => {
      const node = e.node;
      node.setSelected(false);
    });
    batchDownloadsData.clear();
  }
  // 获取当前时间串
  getNowTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
    const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    const hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    const minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    const second = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    const currentTime =
      String(year) + String(month) + String(day) + String(hour) + String(minute) + String(second);
    return currentTime;
  }
  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): string {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translatePccWord(val: string): string {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
