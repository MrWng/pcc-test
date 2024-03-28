import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup } from '@angular/forms';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import {
  cloneDeep,
  DynamicFormLayout,
  DynamicTableModel,
  DynamicFormService,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';
import { ListOfDeliverableService } from './list-of-deliverable.service';
import { CommonService, Entry } from '../../service/common.service';
import { UploadAndDownloadService } from '../../service/upload.service';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicWbsService } from '../wbs/wbs.service';

@Component({
  selector: 'app-list-of-deliverable',
  templateUrl: './list-of-deliverable.component.html',
  styleUrls: ['./list-of-deliverable.component.less'],
  providers: [ListOfDeliverableService],
})
/**
 * 项目计划维护、计划协同排定
 */
export class ListOfDeliverableComponent implements OnInit, OnDestroy {

  @Input() source: Entry = Entry.card
  @Input() executeContext: any;


  @Input() tabIndex: any; // 页面中的tab页下标

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];

  attachmentList: any[] = [];
  sampleAttachmentList: any[] = [];
  allAttachmentList: any[] = [];
  nzExpandAll: boolean = true;

  allData = [];

  treeData = [
    {
      title: this.translatePccWord('专案名称'),
      key: '0',
      children: [],
    },
  ];
  defaultSelectedKeys = [];

  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    public listOfDeliverableService: ListOfDeliverableService,
    public uploadService: UploadAndDownloadService,
    private formService: DynamicFormService,
    private userService: DwUserService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    private messageService: NzMessageService,
    protected elementRef: ElementRef,
    public wbsService: DynamicWbsService,
  ) { }

  ngOnInit(): void {
    this.getWbsAllData();
  }

  ngOnDestroy(): void { }

  // 获取wbs的数据
  getWbsAllData(): void {
    const params = {
      project_info: [
        {
          control_mode: '1',
          project_no:
            this.wbsService.project_no ||
            this.executeContext?.taskWithBacklogData?.bpmData?.project_info[0]?.project_no,
        },
      ],
    };
    this.commonService.getInvData('task.info.get', params).subscribe((res: any): void => {
      this.allData = res.data.project_info ?? [];
      this.changeRef.markForCheck();
      this.getProjectAttachmentList();
    });
    this.commonService.getInvData('bm.pisc.project.get', { project_info: [{ project_no: this.wbsService.project_no }] })
      .subscribe((res) => {
        if (res.data && res.data.project_info && res.data.project_info[0]) {
          this.treeData[0].title = res.data.project_info[0].project_name ? res.data.project_info[0].project_name : this.treeData[0].title;
        }
        this.changeRef.markForCheck();
      });

  }

  getProjectAttachmentList(): void {
    const project_info = this.executeContext?.taskWithBacklogData?.bpmData?.attachment_project_info ?? [];
    const params = project_info.length
      ? { project_info }
      : {
        project_info: [
          {
            project_id: this.executeContext?.taskWithBacklogData?.bpmData?.project_id,
            task_id: this.executeContext?.taskWithBacklogData?.bpmData?.task_id,
            category: this.executeContext?.taskWithBacklogData?.bpmData?.category,
            project_no:
              this.wbsService.project_no ||
              this.executeContext?.taskWithBacklogData?.bpmData?.project_info[0]?.project_no,
          },
        ],
      };
    // this.messageService.info('交付物开始调用！');
    this.commonService
      .getInvData('project.attachment.info.get', params)
      .subscribe((res: any): void => {
        // this.messageService.info('交付物调用成功！');
        if (res.code === 0) {
          const attachmentList = [];
          const sampleAttachmentList = [];
          res.data.attachment_info?.forEach((list: any): void => {
            list.attachment?.data?.forEach((attachment: any): void => {
              attachment.uploadUserName = attachment.upload_user_name;
              attachment.uploadIdCopy = attachment.upload_user_id
                ? attachment.upload_user_id
                : attachment.uploadUserId;
              attachment.upload_user_id = '';
              attachment.createDate = attachment.create_date;
              switch (attachment.category) {
                case 'manualAssignmentDelivery':
                  attachment.categoryName = this.translateService.instant('dj-default-交付物');
                  break;
                case 'manualAssignmentAttachment':
                  attachment.categoryName = this.translateService.instant('dj-default-附件');
                  break;
                case 'mohDeliverable':
                  attachment.categoryName = this.translateService.instant('dj-default-交付物');
                  break;
                case 'mohAttachment':
                  attachment.categoryName = this.translateService.instant('dj-default-附件');
                  break;
                case 'athena_LaunchSpecialProject_create':
                  attachment.categoryName = this.translateService.instant('dj-pcc-专案附件');
                  break;
                case 'manualAssignmentSampleDelivery':
                  attachment.categoryName = this.translateService.instant('dj-default-交付物样板');
                  break;
              }
              list.categoryName = attachment.categoryName;
              list.category = attachment.category;
              list.taskId = attachment.taskId;
              list.categoryId = attachment.categoryId
                ? attachment.categoryId
                : attachment.category_id;
            });
            if (list.attachment?.data && list.attachment?.data.length) {
              list.attachment1 = {
                data: list.attachment.data,
                rowDataKey: list.project_no + ';' + list.task_no,
              };
              list.dataKey = list.project_no + ';' + list.task_no;
              if (list.category === 'manualAssignmentSampleDelivery') {
                sampleAttachmentList.push(list);
              } else {
                attachmentList.push(list);
              }
            }
          });
          let newArr = [];
          const attachmentList1 = JSON.parse(JSON.stringify(attachmentList));
          for (let i = 0; i < attachmentList1.length; i++) {
            const index = newArr.findIndex(function (item) {
              return (
                item.dataKey === attachmentList1[i].dataKey &&
                item.category === attachmentList1[i].category
              );
            });
            if (index !== -1) {
              newArr[index].attachment1.data.push(...attachmentList1[i].attachment1.data);
              newArr[index].attachment.data.push(...attachmentList1[i].attachment.data);
            } else {
              newArr.push(attachmentList1[i]);
            }
          }
          this.allAttachmentList = [...newArr, ...sampleAttachmentList];
          newArr = this.setParent(newArr);
          this.attachmentList = newArr;
          this.sampleAttachmentList = sampleAttachmentList;
          if (this.sampleAttachmentList && this.sampleAttachmentList.length) {
            this.treeData.push({
              title: this.translateWord('交付物样板'),
              key: '-1',
              children: [],
            });
          }
          if (this.treeData[0].children.length) {
            this.defaultSelectedKeys = [this.treeData[0].children[0].key];
            this.getSelectList(this.treeData[0].children[0].key);
          } else {
            if (this.attachmentList.length) {
              this.defaultSelectedKeys = ['0'];
              this.getSelectList('0');
            } else {
              if (this.sampleAttachmentList.length) {
                this.defaultSelectedKeys = ['-1'];
                this.getSelectList('-1');
              } else {
                this.getSelectList('-2');
              }
            }
          }
          this.changeRef.markForCheck();
        }
      });
  }

  getSelectList(key) {
    let list = [];
    if (key === '-1') {
      list = this.sampleAttachmentList;
    } else {
      for (const i in this.attachmentList) {
        if (this.attachmentList[i].parentId === key) {
          list.push(this.attachmentList[i]);
        }
      }
    }
    this.initTemplateJson(list);
    this.changeRef.markForCheck();
  }

  setParent(list) {
    for (const n in list) {
      if (list.hasOwnProperty(n)) {
        let parentId = '';
        const id = list[n].dataKey.split(';')[1];
        parentId = id ? this.getParentId(id) : '0';
        list[n].parentId = parentId;
      }
    }
    return list;
  }

  getParentId(id) {
    for (const i in this.allData) {
      if (this.allData[i].task_no === id) {
        if (this.allData[i].task_no === this.allData[i].upper_level_task_no) {
          const arr = {
            key: this.allData[i].task_no,
            title: this.allData[i].task_name,
            isLeaf: true,
          };
          const res = this.treeData[0].children.filter((num) => {
            return num.key === this.allData[i].task_no;
          });
          if (res && !res.length) {
            this.treeData[0].children.push(arr);
          }
          return this.allData[i].task_no;
        } else {
          return this.getParentId(this.allData[i].upper_level_task_no);
        }
      }
    }
  }

  initTemplateJson(data: Array<any>): void {
    const condition = this.wbsService.editable && this.source !== Entry.collaborate;
    const isEdit = condition ? true : false;
    const result = this.listOfDeliverableService.setTemplateJson(data, isEdit);
    result.layout = result.layout && Array.isArray(result.layout) ? result.layout : [];
    result.content = result.content || {};
    const initializedData = this.formService.initData(
      result.layout as any,
      result.pageData,
      result.rules as any,
      result.style,
      result.content
    );
    this.dynamicLayout = initializedData.formLayout; // 样式
    this.dynamicModel = initializedData.formModel; // 组件数据模型
    this.dynamicGroup = initializedData.formGroup; // formGroup
    this.changeRef.markForCheck();
  }
  nzEvent(event: NzFormatEmitEvent): void {
    const defaultSelectedKeys = cloneDeep(this.defaultSelectedKeys);
    if (!event.keys[0]) {
      this.defaultSelectedKeys = [];
      this.defaultSelectedKeys = defaultSelectedKeys;
    } else {
      this.defaultSelectedKeys = event.keys;
      this.getSelectList(event.keys[0]);
    }
  }

  // table变更附件时触发
  onChange(event) {
    if (!event) {
      return;
    }
    setTimeout(() => {
      if (event?.group?.value) {
        const value = event.group.value;
        this.updataValue(value);
      }
    }, 200);
  }

  updateFile(value) {
    const fileList = [];
    for (const i in value.attachment1.data) {
      if (value.attachment1.data.hasOwnProperty(i)) {
        const res = value.attachment1.data[i];
        const info = {
          id: res.id,
          name: res.name,
          category: value.category,
          categoryId: value.category,
          upload_user_name: res.upload_user_name,
          upload_user_id: res.upload_user_id ? res.upload_user_id : res.uploadIdCopy,
          size: res.size,
          create_date: res.create_date,
          row_data: value.attachment1.rowDataKey,
        };
        fileList.push(info);
      }
    }
    const param = {
      project_info: [
        {
          project_no: value.project_no,
          task_no: value.task_no,
          category: value.category,
          attachment: {
            row_data: value.attachment1.rowDataKey,
            data: fileList,
          },
        },
      ],
    };
    this.commonService
      .getInvData('project.attachment.info.update', param)
      .subscribe((res: any): void => { });
  }

  // 附件和交付物变更时触发
  updataValue(data) {
    let list, action, actionData;
    const listAction = [];
    data.attachment1.data.forEach((res) => {
      listAction.push({
        category: data.category,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        createDate: res.create_date,
        create_date: res.create_date,
        id: res.id,
        name: res.name,
        row_data: data.dataKey,
        size: res.size,
        uploadUserName: res.upload_user_name,
        upload_user_id: '',
        uploadIdCopy: res.uploadIdCopy ? res.uploadIdCopy : res.upload_user_id,
        upload_user_name: res.upload_user_name,
        projectId: 'task_Assignment',
        taskId: data.taskId,
      });
    });
    for (const i in this.allAttachmentList) {
      if (
        data.category === this.allAttachmentList[i].category &&
        data.dataKey === this.allAttachmentList[i].dataKey
      ) {
        list = JSON.parse(JSON.stringify(this.allAttachmentList[i].attachment1.data));
        this.allAttachmentList[i].attachment1.data = listAction;
        if (list.length > listAction.length) {
          action = 'delete';
          actionData = this.getArrDifference(list, listAction);
        } else {
          action = 'add';
          actionData = this.getArrDifference(listAction, list);
        }
        if (actionData.length > 0) {
          if (
            data.category === 'athena_LaunchSpecialProject_create' ||
            data.category === 'manualAssignmentSampleDelivery'
          ) {
            this.updateFile(data);
          } else {
            this.uploadApi(action, actionData[0]);
          }
        }
      }
    }
  }

  // 附件交付物变更时请求接口
  uploadApi(action, data) {
    let params, url;
    if (action === 'delete') {
      url = '/api/aam/v1/deleteAttachment';
      params = {
        category: data.category,
        categoryId: data.categoryId ? data.categoryId : data.category_id,
        id: data.id,
      };
    } else {
      url = '/api/aam/v1/uploadAttachment';
      params = {
        category: data.category,
        categoryId: data.categoryId,
        id: data.id,
        name: data.name,
        rowDataKey: data.row_data + ';', // 尾部要加;否则无法上传到athena库里
        size: data.size,
        tenantId: this.userService.getUser('tenantId'),
        projectId: data.projectId,
        taskId: data.taskId,
      };
    }
    this.uploadService.tableInfoToAi(url, params).subscribe((res: any): void => { });
  }

  // 实时获取表格数据改变的值
  getArrDifference(array2, array1) {
    const result = [];
    for (let i = 0; i < array2.length; i++) {
      const obj = array2[i];
      const num = obj.id;
      let isExist = false;
      for (let j = 0; j < array1.length; j++) {
        const aj = array1[j];
        const n = aj.id;
        if (n === num) {
          isExist = true;
          break;
        }
      }
      if (!isExist) {
        result.push(obj);
      }
    }
    return result;
  }

  downLoadAll() {
    const params = {
      fileIds: [],
    };
    if (this.dynamicGroup?.value?.inquiry?.length) {
      const fileList = this.dynamicGroup?.value?.inquiry;
      for (const i in fileList) {
        if (fileList[i].uibot_checked) {
          const att = fileList[i].attachment1.data;
          for (const n in att) {
            if (att.hasOwnProperty(n)) {
              params.fileIds.push(att[n].id);
            }
          }
        }
      }
      if (params.fileIds.length) {
        const time = this.getNowTime();
        const fileName = this.wbsService.project_no + '-' + time + '.zip';
        this.uploadService.downloadMultiUrl('Athena', params, fileName).subscribe((res) => { });
      } else {
        this.messageService.error(this.translateService.instant(`dj-pcc-请选择下载文件`));
      }
    }
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
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
