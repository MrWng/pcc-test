import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ElementRef,
  OnDestroy,
  OnChanges,
  SimpleChanges,
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
} from '@athena/dynamic-core';
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
export class ListOfDeliverableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() source: Entry = Entry.card;
  @Input() executeContext: any;
  @Input() tabName: String;
  @Input() tabIndex: any; // 页面中的tab页下标

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];

  attachmentList: any[] = [];
  sampleAttachmentList: any[] = [];
  planChanges: any[] = [];
  projectChangeTask: any[] = [];
  projectStatusChange: any[] = [];
  plmList: any[] = [];
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
    public wbsService: DynamicWbsService
  ) {}

  ngOnInit(): void {
    // this.getWbsAllData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tabName === 'app-list-of-deliverable') {
      this.getWbsAllData();
    }
  }

  ngOnDestroy(): void {}

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
    this.commonService
      .getInvData('task.info.get', params)
      .subscribe(async (res: any): Promise<void> => {
        this.allData = res.data.project_info ?? [];
        this.changeRef.markForCheck();
        const allAttachmentList = await this.getAllAttachmentList();
        if (Object.keys(allAttachmentList).length) {
          const resPlmData =
            allAttachmentList.resPlm && allAttachmentList.resPlm?.data
              ? allAttachmentList.resPlm?.data?.attachment_info
              : [];
          const resProjectData =
            allAttachmentList.resProject && allAttachmentList.resProject?.data
              ? allAttachmentList.resProject?.data?.attachment_info
              : [];
          const attachment_info = cloneDeep(resProjectData);
          if (resPlmData.length) {
            resPlmData.forEach((element) => {
              const data = [];
              element?.deliverable_info.forEach((info) => {
                data.push({
                  id: info.delivery_no,
                  name: info.delivery_name,
                  category: info.category,
                  categoryId: info.category,
                  upload_user_name: '',
                  upload_user_id: '',
                  size: 0,
                  create_date: '',
                  row_data: element.project_no + element.task_no,
                });
              });
              const elementTmp = cloneDeep(element);
              Reflect.deleteProperty(elementTmp, 'deliverable_info');
              attachment_info.push({
                ...elementTmp,
                attachment: { data },
              });
            });
          }
          this.processingData(attachment_info);
        }
        // this.getProjectAttachmentList();
      });
    this.commonService
      .getInvData('bm.pisc.project.get', {
        project_info: [{ project_no: this.wbsService.project_no }],
      })
      .subscribe((res) => {
        if (res.data && res.data.project_info && res.data.project_info[0]) {
          this.treeData[0].title = res.data.project_info[0].project_name
            ? res.data.project_info[0].project_name
            : this.treeData[0].title;
        }
        this.changeRef.markForCheck();
      });
  }

  async getAllAttachmentList(): Promise<any> {
    try {
      const project_info =
        this.executeContext?.taskWithBacklogData?.bpmData?.attachment_project_info ?? [];
      const params = project_info.length
        ? { query_scope: '1', project_info }
        : {
            query_scope: '1',
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
      const resProject: any = await this.commonService
        .getInvData('project.attachment.info.get', params)
        .toPromise();
      const paramsPlm = {
        // 1.PCC文档 2.PLM文档
        query_scope: '2',
        project_info: [
          {
            project_no:
              this.wbsService.project_no ||
              this.executeContext?.taskWithBacklogData?.bpmData?.project_info[0]?.project_no,
          },
        ],
      };
      const resPlm: any = await this.commonService
        .getInvData('project.attachment.info.get', paramsPlm)
        .toPromise();
      return { resProject, resPlm };
    } catch (err) {
      return Promise.reject(err.description);
    }
  }

  processingData(attachment_info: any) {
    const attachmentList = [];
    const sampleAttachmentList = []; // 交付物样板
    const planChanges = []; // 计划变更
    const projectChangeTask = []; // 项目变更任务 pcc_project_change_task
    const plmList = []; // PLM
    const projectStatusChange = []; // 项目状态变更
    attachment_info?.forEach((list: any): void => {
      if (list.attachment && list.attachment.category === 'pcc_wbs_planChanges') {
        list.attachment.categoryName = this.translateService.instant('dj-pcc-计划变更');
        planChanges.push(cloneDeep(list));
      }

      if (list.attachment?.data && list.attachment?.data.length) {
        list.attachment?.data?.forEach((attachment: any): void => {
          attachment.uploadUserName = attachment.upload_user_name;
          attachment.uploadIdCopy = attachment.upload_user_id
            ? attachment.upload_user_id
            : attachment.uploadUserId;
          attachment.upload_user_id = '';
          attachment.createDate = attachment.create_date;
          attachment.root_task_no = list?.root_task_no;
          // category 文件类型标识符
          switch (attachment.category) {
            case 'pcc_project_status_change':
              attachment.categoryName = this.translateService.instant('dj-pcc-项目状态变更附件');
              break;
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
            case 'pcc_wbs_planChanges':
              attachment.categoryName = this.translateService.instant('dj-pcc-计划变更');
              break;
            case 'pcc_project_change_task':
              attachment.categoryName = this.translateService.instant('dj-pcc-项目变更附件');
              break;
            case 'manualAssignmentDelivery_PLM':
              attachment.categoryName = this.translateService.instant('dj-default-PLM交付物');
              break;
          }
          // 提取信息--begin
          // 附件的类型标识符名称
          list.categoryName = attachment.categoryName;
          // 附件的类型标识符
          list.category = attachment.category;
          list.taskId = attachment.taskId; // 没有..
          // 附件的类型标识符
          list.categoryId = attachment.categoryId ? attachment.categoryId : attachment.category_id;
        });

        list.attachment1 = {
          data: list.attachment.data,
          rowDataKey: list.project_no + ';' + list.task_no,
        };
        list.dataKey = list.project_no + ';' + list.task_no;
        if (list.category === 'manualAssignmentSampleDelivery') {
          // 交付物样板
          sampleAttachmentList.push(list);
        } else if (list.category === 'pcc_wbs_planChanges') {
          planChanges.push(list);
        } else if (list.category === 'pcc_project_change_task') {
          projectChangeTask.push(list);
        } else if (list.category === 'manualAssignmentDelivery_PLM') {
          plmList.push(list);
        } else if (list.category === 'pcc_project_status_change') {
          projectStatusChange.push(list);
          attachmentList.push(list);
        } else {
          // category : "athena_LaunchSpecialProject_create"
          attachmentList.push(list);
        }
      }
    });
    let newArr = [];
    // 其它category类型
    const attachmentList1 = JSON.parse(JSON.stringify(attachmentList));
    for (let i = 0; i < attachmentList1.length; i++) {
      const index = newArr.findIndex(function (item) {
        if (attachmentList1[i].category === 'pcc_project_status_change') {
          return (
            item.dataKey === attachmentList1[i].dataKey &&
            item.category === attachmentList1[i].category &&
            item.task_name === attachmentList1[i].task_name &&
            item.task_no === attachmentList1[i].task_no
          );
        }
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
    this.allAttachmentList = [...newArr, ...sampleAttachmentList]; // 项目附件、交付物样板
    newArr = this.setParent(newArr);
    this.attachmentList = newArr;
    // 交付物样板
    this.sampleAttachmentList = sampleAttachmentList;
    if (this.sampleAttachmentList && this.sampleAttachmentList.length) {
      this.treeData.push({
        title: this.translateWord('交付物样板'),
        key: '-1',
        children: [],
      });
    }

    // 计划变更
    const planChangesList = [];
    if (planChanges && planChanges.length) {
      planChanges.forEach((item) => {
        const attachment = cloneDeep(item.attachment);
        if (attachment) {
          attachment.uploadUserName = item.attachment.upload_user_name;
          attachment.uploadIdCopy = item.attachment.upload_user_id
            ? item.attachment.upload_user_id
            : item.attachment.uploadUserId;
          attachment.upload_user_id = '';
          attachment.createDate = item.attachment.create_date;
          attachment.categoryName = item.attachment.categoryName;

          let flag = false;
          planChangesList.forEach((val) => {
            if (val.task_name === item.task_name && val.task_no === item.task_no) {
              flag = true;
              val.attachment.data.push(attachment);
            }
          });

          if (!flag) {
            item.category = item.attachment.category;
            item.categoryId = item.attachment.categoryId
              ? item.attachment.categoryId
              : item.attachment.category_id;
            item.categoryName = item.attachment.categoryName;
            item.dataKey = item.project_no + ';' + item.task_no;
            item.attachment = {
              data: [],
              row_data: attachment.row_data,
            };
            item.attachment['data'].push(attachment);
            // 显示文件内容
            item['attachment1'] = {
              data: item.attachment.data,
              rowDataKey: item.project_no + ';' + item.task_no,
            };
            planChangesList.push(item);
          }
        }
      });
      this.planChanges = planChangesList;

      this.treeData.push({
        title: this.translatePccWord('计划变更'),
        key: '-2',
        children: [],
      });
    }

    // 项目变更
    if (projectChangeTask && projectChangeTask.length) {
      this.projectChangeTask = projectChangeTask;
      this.treeData.push({
        title: this.translatePccWord('项目变更'),
        key: '-4',
        children: [],
      });
    }

    // plm
    if (plmList && plmList.length) {
      this.plmList = plmList;
      this.treeData.push({
        title: this.translateWord('PLM任务'),
        key: '-5',
        children: [],
      });
    }

    // 项目状态变更
    if (projectStatusChange && projectStatusChange.length) {
      // this.projectStatusChange = projectStatusChange;
      // this.treeData.push({
      //   title: this.translatePccWord('项目状态变更附件'),
      //   key: '0',
      //   children: [],
      // });
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
        } else if (this.planChanges && this.planChanges.length) {
          this.defaultSelectedKeys = ['-2'];
          this.getSelectList('-2');
        } else if (this.projectChangeTask && this.projectChangeTask.length) {
          this.defaultSelectedKeys = ['-4'];
          this.getSelectList('-4');
        } else if (this.plmList && this.plmList.length) {
          this.defaultSelectedKeys = ['-5'];
          this.getSelectList('-5');
        } else if (this.projectStatusChange && this.projectStatusChange.length) {
          this.defaultSelectedKeys = ['-6'];
          this.getSelectList('-6');
        } else {
          this.getSelectList('-3');
        }
      }
    }
    this.changeRef.markForCheck();
  }

  getProjectAttachmentList(): void {
    const project_info =
      this.executeContext?.taskWithBacklogData?.bpmData?.attachment_project_info ?? [];
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
          const sampleAttachmentList = []; // 交付物样板
          const planChanges = []; // 计划变更
          const projectChangeTask = []; // 项目变更任务 pcc_project_change_task
          res.data.attachment_info?.forEach((list: any): void => {
            if (list.attachment && list.attachment.category === 'pcc_wbs_planChanges') {
              list.attachment.categoryName = this.translateService.instant('dj-pcc-计划变更');
              planChanges.push(cloneDeep(list));
            }

            if (list.attachment?.data && list.attachment?.data.length) {
              list.attachment?.data?.forEach((attachment: any): void => {
                attachment.uploadUserName = attachment.upload_user_name;
                attachment.uploadIdCopy = attachment.upload_user_id
                  ? attachment.upload_user_id
                  : attachment.uploadUserId;
                attachment.upload_user_id = '';
                attachment.createDate = attachment.create_date;
                attachment.root_task_no = list?.root_task_no;
                // category 文件类型标识符
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
                    attachment.categoryName =
                      this.translateService.instant('dj-default-交付物样板');
                    break;
                  case 'pcc_wbs_planChanges':
                    attachment.categoryName = this.translateService.instant('dj-pcc-计划变更');
                    break;
                  case 'pcc_project_change_task':
                    attachment.categoryName = this.translateService.instant('dj-pcc-项目变更附件');
                    break;
                }
                // 提取信息--begin
                // 附件的类型标识符名称
                list.categoryName = attachment.categoryName;
                // 附件的类型标识符
                list.category = attachment.category;
                list.taskId = attachment.taskId; // 没有..
                // 附件的类型标识符
                list.categoryId = attachment.categoryId
                  ? attachment.categoryId
                  : attachment.category_id;
              });

              list.attachment1 = {
                data: list.attachment.data,
                rowDataKey: list.project_no + ';' + list.task_no,
              };
              list.dataKey = list.project_no + ';' + list.task_no;
              if (list.category === 'manualAssignmentSampleDelivery') {
                // 交付物样板
                sampleAttachmentList.push(list);
              } else if (list.category === 'pcc_wbs_planChanges') {
                planChanges.push(list);
              } else if (list.category === 'pcc_project_change_task') {
                projectChangeTask.push(list);
              } else {
                attachmentList.push(list);
              }
            }
          });
          let newArr = [];
          // 其它category类型
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

          // 因为【计划变更】没有上传、删除功能，所以没有放入
          this.allAttachmentList = [...newArr, ...sampleAttachmentList]; // 所以的附件信息

          newArr = this.setParent(newArr);
          this.attachmentList = newArr;
          // 交付物样板
          this.sampleAttachmentList = sampleAttachmentList;
          if (this.sampleAttachmentList && this.sampleAttachmentList.length) {
            this.treeData.push({
              title: this.translateWord('交付物样板'),
              key: '-1',
              children: [],
            });
          }

          // 计划变更
          const planChangesList = [];
          if (planChanges && planChanges.length) {
            planChanges.forEach((item) => {
              const attachment = cloneDeep(item.attachment);
              if (attachment) {
                attachment.uploadUserName = item.attachment.upload_user_name;
                attachment.uploadIdCopy = item.attachment.upload_user_id
                  ? item.attachment.upload_user_id
                  : item.attachment.uploadUserId;
                attachment.upload_user_id = '';
                attachment.createDate = item.attachment.create_date;
                attachment.categoryName = item.attachment.categoryName;

                let flag = false;
                planChangesList.forEach((val) => {
                  if (val.task_name === item.task_name && val.task_no === item.task_no) {
                    flag = true;
                    val.attachment.data.push(attachment);
                  }
                });

                if (!flag) {
                  item.category = item.attachment.category;
                  item.categoryId = item.attachment.categoryId
                    ? item.attachment.categoryId
                    : item.attachment.category_id;
                  item.categoryName = item.attachment.categoryName;
                  item.dataKey = item.project_no + ';' + item.task_no;
                  item.attachment = {
                    data: [],
                    row_data: attachment.row_data,
                  };
                  item.attachment['data'].push(attachment);
                  // 显示文件内容
                  item['attachment1'] = {
                    data: item.attachment.data,
                    rowDataKey: item.project_no + ';' + item.task_no,
                  };
                  planChangesList.push(item);
                }
              }
            });
            this.planChanges = planChangesList;

            this.treeData.push({
              title: this.translatePccWord('计划变更'),
              key: '-2',
              children: [],
            });
          }

          // 项目变更
          if (projectChangeTask && projectChangeTask.length) {
            this.projectChangeTask = projectChangeTask;
            this.treeData.push({
              title: this.translatePccWord('项目变更'),
              key: '-4',
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
              } else if (this.planChanges && this.planChanges.length) {
                this.defaultSelectedKeys = ['-2'];
                this.getSelectList('-2');
              } else if (this.projectChangeTask && this.projectChangeTask.length) {
                this.defaultSelectedKeys = ['-4'];
                this.getSelectList('-4');
              } else {
                this.getSelectList('-3');
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
      this.initTemplateJson(list);
    } else if (key === '-2') {
      list = this.planChanges;
      this.initTemplateJson(list, false);
    } else if (key === '-4') {
      list = this.projectChangeTask;
      this.initTemplateJson(list, false);
    } else if (key === '-5') {
      list = this.plmList;
      this.initTemplateJson(list, false);
    } else if (key === '-6') {
      list = this.projectStatusChange;
      this.initTemplateJson(list, false);
    } else {
      for (const i in this.attachmentList) {
        if (this.attachmentList[i].parentId === key) {
          list.push(this.attachmentList[i]);
        }
      }
      this.initTemplateJson(list);
    }

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

  initTemplateJson(data: Array<any>, isEditFlag?: boolean): void {
    const condition = this.wbsService.editable && this.source !== Entry.collaborate;
    const isEdit = condition ? true : false;
    const flag = isEditFlag !== undefined ? isEditFlag : isEdit;
    const result = this.listOfDeliverableService.setTemplateJson(data, flag);
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
        if (event.type !== 'rowClicked' && event.type !== 'blur') {
          debugger;
        }
        const value = event.group.value;
        this.updataValue(value);
        this.attachmentChange(event);
      }
    }, 200);
  }

  attachmentChange(event) {
    // 若交付设计器.文档同步至知识中台 = true
    if (!this.wbsService.is_sync_document || this.source !== Entry.card) {
      return;
    }
    if (event?.$event?.type === 'success' || event?.$event?.type === 'delete') {
      console.log(event?.$event?.type);
      const params = { project_info: [{ project_no: this.wbsService.project_no }] };
      this.commonService.getInvData('bm.pisc.project.get', params).subscribe((res: any): void => {
        const status = res.data.project_info[0].project_status;
        if (status === '30') {
          const processParams = {
            data_type: '1',
            project_info: [
              {
                project_no: this.wbsService.project_no,
                root_task_no: event?.group?.value?.root_task_no,
              },
            ],
          };
          this.commonService
            .getInvData('document.info.sync.process', processParams)
            .subscribe((res1: any): void => {});
        }
      });
    }
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
      is_sync_document: this.source === Entry.card ? this.wbsService.is_sync_document : false,
      project_info: [
        {
          project_no: value.project_no,
          task_no: value.task_no,
          category: value.category,
          attachment: {
            row_data: value.attachment1.rowDataKey,
            data: fileList,
          },
          root_task_no: this.source === Entry.card ? value.root_task_no : null,
        },
      ],
    };
    this.commonService
      .getInvData('project.attachment.info.update', param)
      .subscribe((res: any): void => {});
  }

  // 附件和交付物变更时触发
  updataValue(data) {
    let list, action, actionData;
    const listAction = [];
    data?.attachment1?.data?.forEach((res) => {
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
        projectId: 'projectCenterConsole_userProject',
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
          // 项目附件 或者  任务的交付物样板
          if (
            data.category === 'athena_LaunchSpecialProject_create' ||
            data.category === 'manualAssignmentSampleDelivery'
          ) {
            const check_type = ['1', '2', '4', '5'];
            if ('manualAssignmentSampleDelivery' === data.category) {
              check_type.push('3');
            }
            this.commonService
              .getProjectChangeStatus(data.project_no, check_type, '1', data.task_no)
              .subscribe(
                (result: any): void => {
                  if (result.data?.project_info[0]?.check_result) {
                    this.updateFile(data);
                  } else {
                    this.getWbsAllData();
                  }
                },
                (error) => {
                  this.getWbsAllData();
                }
              );
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
    this.uploadService.tableInfoToAi(url, params).subscribe((res: any): void => {});
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
    // if (this.defaultSelectedKeys && (this.defaultSelectedKeys[0] === '-5')) {
    //   return;
    // }
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
        this.uploadService.downloadMultiUrl('Athena', params, fileName).subscribe((res) => {});
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
