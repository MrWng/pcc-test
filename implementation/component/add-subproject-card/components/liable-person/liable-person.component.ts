import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CommonService, Entry } from 'app/customization/task-project-center-console/service/common.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AthMessageService } from 'ngx-ui-athena/src/components/message';

import { AddSubProjectCardService } from '../../add-subproject-card.service';
import { LiablePersonService } from '../../services/liable-person.service';
import { ErrorMessageComponent } from './components/error-message/error-message.component';


@Component({
  selector: 'app-liable-person',
  templateUrl: './liable-person.component.html',
  styleUrls: ['./liable-person.component.less']
})
export class LiablePersonComponent implements OnInit {
  Entry = Entry

  @Input() validateForm: FormGroup = this.fb.group({
    liable_person_department_code: [null]
  });
  @Input() source: Entry = Entry.card;
  @Input() project_no: string;
  /** 负责人 */
  @Input() liable_person_code_data: any;
  /** 负责人下拉列表 */
  @Input() liable_person_code_dataList = [];
  /** 选择的执行人列表 */
  @Input() task_member_info: any = [];
  /** 隐藏的执行人列表 */
  @Input() task_member_infoList = [];
  /** 任务类型 */
  @Input() taskCategoryType: string = '';
  /** 负责人下拉选择 */
  @Input() personList: any[] = [];
  /** 执行人下拉选项 */
  @Input() personList2: any[] = [];
  /** 负责人 & 执行人 原始数据备份 */
  @Input() copyPersonList: any[] = [];
  /**  */
  @Input() designStatus: string
  /** 任务模版信息 */
  @Input() taskTemplateInfo = { task_category: '' };

  /** 负责人 */
  personInChargeItem: any = {};
  /** 记录负责人的授权状态和错误信息 */
  personLiable: { employee_info: any[]; error_msg: string } = { employee_info: [], error_msg: '' };
  /** 记录执行人的授权状态和错误信息 */
  @Input() executor: { employee_info: any[]; error_msg: string } = { employee_info: [], error_msg: '' };
  /** athena授权校验提示信息 */
  athenaAuthorityTip: any = { isShow: false, message: '' };

  /** 设置父组件的值 */
  @Output() callChangeMaskData = new EventEmitter()
  /** 更新wbs界面任务卡列表 */
  @Output() callUpdateWbsTasks = new EventEmitter()
  /** executor数据发生变化 */
  @Output() callParentSetData = new EventEmitter()

  private notTriggerChangs = false;
  employee_info: any[];
  isDisable: boolean = false;

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private fb: FormBuilder,
    private liablePersonService: LiablePersonService,
    public commonService: CommonService,
    private modal: NzModalService,
    private athMessageService: AthMessageService,
  ) { }

  /**
  * 不禁用状态
  */
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }





  ngOnInit(): void { }

  get isAllowClear(): boolean {
    const { currentCardInfo, validateForm } = this.addSubProjectCardService;
    const task_member_info = validateForm.getRawValue().task_member_info;
    const plmType = currentCardInfo?.task_status === '20' && currentCardInfo?.task_category === 'PLM' || this.isForbidden;
    return plmType ? false : !task_member_info?.length;
  }

  // 是否禁用执行人删除
  get isAllowClearForExecutor(): boolean {
    const { currentCardInfo } = this.addSubProjectCardService;
    let result = currentCardInfo.task_status !== '10' ? false : true;
    if (currentCardInfo.task_status !== '10' && currentCardInfo.task_category === 'PLM' && this.designStatus === 'notStart') {
      result = true;
    }
    return result;
  }

  /**
   * 负责人：值的改变
   * @param item
   * @returns
   */
  async personInCharge(item, isdeletTem?: boolean) {
    this.isDisable = false;
    this.personLiable.employee_info = [];
    this.personLiable.error_msg = '';
    this.personInChargeItem = item;
    if (this.taskTemplateInfo.task_category !== 'PLM_PROJECT') {
      const { clear } = await this.personLiableExecutorVerification(item);
      if (this.personLiable.employee_info?.length && !clear) {
        this.clearPersonValue();
        return;
      }
    }
    if (!item) {
      /** 清空操作 */
      this.addSubProjectCardService.validateForm.patchValue({
        liable_person_code: '',
        liable_person_name: '',
        liable_person_department_name: '',
        liable_person_department_code: '',
        task_member_info: [],
      });
    } else {
      const { task_status = '', task_category = '' } = this.addSubProjectCardService.currentCardInfo;
      if (task_status === '20' && task_category === 'PLM' && this.designStatus === 'notStart') {
        this.callParentSetData.emit({
          plmNotStart_liablePerson: {
            liable_person_code: item.id,
            liable_person_department_code: item.deptId,
          }
        });
      }
      this.addSubProjectCardService.validateForm.get('liable_person_code').patchValue(item.id);
      this.addSubProjectCardService.validateForm.get('liable_person_name').patchValue(item.name);
      this.addSubProjectCardService.validateForm.get('liable_person_department_name').patchValue(item.deptName);
      this.addSubProjectCardService.validateForm.get('liable_person_department_code').patchValue(item.deptId);


      this.changeRef.markForCheck();

      this.addSubProjectCardService.validateForm.get('liable_person_code').markAsDirty();
      // 大概意思就是禁用执行人中的负责人选项
      const task_member_info = this.addSubProjectCardService.validateForm.getRawValue().task_member_info;
      if (task_member_info?.length) {
        task_member_info.forEach((res, i) => {
          if (res === item.deptId + ';' + item.id) {
            this.addSubProjectCardService.validateForm.value.task_member_info.splice(i, 1);
            this.personList.forEach((o) => {
              o.list.forEach((e) => {
                e.check = e.id === item.id ? false : e.check;
              });
            });
          }
        });
      }
      setTimeout(() => this.disableExecutorInput(this.taskCategoryType), 50);
    }

    this.callChangeMaskData.emit({
      task_member_infoList: this.task_member_infoList,
      personList: this.personList
    });
  }



  /**
 * 检验未通过，清空负责人执行人
 * @param clear
 * @returns
 */
  clearPersonValue(): void {
    // 选择的值未授权
    this.personList.forEach((o) => {
      o.list.forEach((e) => {
        e.check = false;
      });
    });
    this.liable_person_code_data = '';
    this.addSubProjectCardService.validateForm.get('liable_person_code').patchValue('');
    this.addSubProjectCardService.validateForm.get('liable_person_name').patchValue('');
    this.addSubProjectCardService.validateForm.get('task_member_info').disable();
    this.addSubProjectCardService.validateForm.get('task_member_info').patchValue([]);
    this.clearCustomError('personLiable', 2000);
    this.changeRef.markForCheck();
  }

  async checkLiablePersonCodeData(task_category: string) {
    this.personLiable.employee_info = [];
    this.personLiable.error_msg = '';
    if (task_category !== 'PLM_PROJECT' && this.liable_person_code_data?.id) {
      const { clear } = await this.personLiableExecutorVerification(this.liable_person_code_data);
      if (this.personLiable.employee_info?.length && !clear) {
        this.clearPersonValue();
        return;
      }
    }
  }

  // 特定时间后清空自定义的报错信息
  clearCustomError(item, timeout) {
    setTimeout(() => {
      this[item].employee_info = [];
      this[item].error_msg = '';
      this.changeRef.markForCheck();
    }, timeout);
  }

  /**
   * 任务类型切换的时候,PLM,PLM_PROJECT任务类型不做pcc授权校验,其他类型做pcc授权校验
   * @param task_category 任务类型
   * @returns
   */
  checkeExecutor(task_category: string) {
    this.taskCategoryType = task_category;
    if (['PLM', 'PLM_PROJECT'].includes(task_category) || !this.employee_info?.length) {
      this.executor.employee_info = [];
      this.executor.error_msg = '';
      setTimeout(() => this.disableExecutorInput(this.taskCategoryType), 50);
      return;
    }
    this.personChanges(this.addSubProjectCardService.validateForm.value.task_member_info);
  }

  /**
   * html  负责人增加授权检查
   * @param data 选中的数据 [array|object]
   */
  personLiableExecutorVerification(data: any): any {
    return new Promise((res, rej) => {
      if (!!!data) {
        return res({ clear: true });
      }
      this.commonService
        .getInvData('auth.employee.info.check', {
          employee_info: [{ employee_no: data.id, employee_name: data.name }],
        })
        .subscribe(
          (resData: any): void => {
            const { employee_info, error_msg } = resData.data;
            this.personLiable.employee_info = employee_info;
            this.personLiable.error_msg = error_msg;
            this.changeRef.markForCheck();
            res(this.personLiable);
          },
          (e) => rej({})
        );
    });
  }

  /**
   * 执行人：值的改变
   * @param item
   * @returns
   */
  async personChanges(item: string[]) {
    if (this.notTriggerChangs || !item) {
      return;
    }
    this.isDisable = false;
    this.task_member_info = [];
    if (!item || !item?.length) {
      this.athenaAuthorityTip.isShow = false;
      this.athenaAuthorityTip.message = '';
      this.personList.forEach((o) => {
        o.list.forEach((e) => {
          e.check = false;
        });
      });
    }
    if (Array.isArray(item)) {
      this.employee_info = [];
      const childList = [];
      this.personList.forEach(({ list = [] }) => {
        list.forEach((o) => {
          const condition =
            o.id !== this.addSubProjectCardService.validateForm.get('liable_person_code').value &&
            item.includes(o.bigId);
          o.check = condition ? true : false;
          childList.push(o);
          if (
            o.check &&
            o.id !== this.addSubProjectCardService.validateForm.get('liable_person_code').value
          ) {
            const memberInfo = {
              executor_department_name: o.deptName,
              executor_department_no: o.deptId,
              executor_name: o.name,
              executor_no: o.id,
              project_no: this.project_no,
              task_no: (this.addSubProjectCardService.currentCardInfo as any).task_no,
            };
            this.task_member_info.push(memberInfo);
          }
        });
      });

      childList.forEach(({ name, bigId }) => {
        item.forEach((o) => {
          const currentList = o.split(';');
          if (o === bigId) {
            this.employee_info.push({
              employee_no: currentList[1],
              employee_name: name,
            });
          }
        });
      });
      this.employee_info = [...new Set(this.employee_info)];
      this.callParentSetData.emit({
        executor: {
          employee_info: [],
          error_msg: ''
        }
      });
      if (['PLM', 'PLM_PROJECT'].includes(this.taskCategoryType)) {
        this.callChangeMaskData.emit({
          task_member_infoList: this.task_member_infoList,
          personList: this.personList
        });
        return;
      }

      this.commonService
        .getInvData('auth.employee.info.check', { employee_info: this.employee_info })
        .subscribe(({ data }: any) => {
          this.executor.employee_info = data?.employee_info;
          this.callParentSetData.emit({
            executor: {
              employee_info: data?.employee_info,
              error_msg: data?.error_msg
            }
          });
          this.deleteMember();
          this.changeRef.markForCheck();
        });
    }
  }

  /**
   * 删除选中执行人
   */
  deleteMember(): void {
    const infoData = this.addSubProjectCardService.validateForm.get('task_member_info');
    if (this.executor.employee_info.length > 0) {
      this.notTriggerChangs = true;
      this.executor.employee_info.forEach(item => {
        const value = infoData.value.filter(res => res.indexOf(item.employee_no) === -1);
        this.addSubProjectCardService.validateForm.get('task_member_info').setValue(value);
      });
      this.notTriggerChangs = false;
      this.personList.forEach((o) => {
        o.list.forEach((e) => {
          e.check = infoData.value.includes(e.bigId) ? true : false;
        });
      });
      if (!infoData.value.length) {
        infoData.patchValue(null);
      }
      this.clearCustomError('executor', 2000);
    }
    this.changeRef.markForCheck();
    this.callChangeMaskData.emit({
      task_member_infoList: this.task_member_infoList,
      personList: this.personList
    });
  }

  /**
   * 负责人：搜索
   * @param value 输入值
   * @returns 搜索结果
   */
  searchPersonList(value: string, type: string): void {
    const searchList = this.liablePersonService.searchPersonList(value, this.copyPersonList);
    const pList = type === '1' ? 'personList' : 'personList2';
    this[pList] = searchList;
    this.changeRef.markForCheck();
  }

  /**
   * 执行人：选择
   * @param item
   */
  selectExecutor(item) {
    // this.selectExecutorItem = item;
  }

  /**
   * 负责人&执行人 禁用或启用
   */
  disableExecutorInput(taskCategoryType: string) {
    // 任务模板为PLM_PROJECT 禁用执行人
    if (['PLM_PROJECT'].includes(taskCategoryType)) {
      this.addSubProjectCardService.validateForm.get('task_member_info').disable();
      this.addSubProjectCardService.validateForm.get('task_member_info').patchValue([]);
    } else {
      if (this.addSubProjectCardService.validateForm.value.liable_person_code) {
        // 负责人有值则可用执行人
        if (!this.isForbidden) {
          this.addSubProjectCardService.validateForm.get('task_member_info').enable();
        }
      }
    }
    this.changeRef.markForCheck();
  }

  /** setSameValue
   * 人员同值
   * @param type personnel:人员同值 date：日期同值
   * @returns
   */
  setSameValue(type, event) {
    if (event.target.className.includes('dis-btn-event') || event.target.className.includes('dis-btn')) {
      return;
    }
    this.isDisable = true;
    const task_member_info = this.addSubProjectCardService.validateForm.getRawValue().task_member_info;
    if (!task_member_info?.length) {
      this.task_member_info = [];
    }
    this.liablePersonService.setSameValue(this.project_no, this.source, this.task_member_info, this.taskCategoryType)
      .subscribe(res => {
        if (!res) {
          this.isDisable = false;
          return;
        }
        if (res.error_msgs.length) {
          this.modal.confirm({
            nzTitle: null,
            nzContent: ErrorMessageComponent,
            nzOkText: this.translateService.instant('dj-default-确定'),
            nzCancelText: null,
            nzComponentParams: {
              messageInfo: res.error_msgs,
            },
            nzWidth: 400,
            nzClassName: 'message-modal',
            nzNoAnimation: true,
            nzClosable: true,
            nzOnOk: (): void => { },
          });
        } else {
          const info = this.translateService.instant('dj-default-更新成功');
          this.athMessageService.success(info);
        }

        if (res.success) {
          this.callUpdateWbsTasks.emit(this.addSubProjectCardService.currentCardInfo);
        }
      }, err => {
        console.log('setSameValue ---err');
        this.isDisable = false;
      });
  }

  /**
 * html 中文字翻译
 * @param val
 */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  /**
* html 中文字翻译
* @param val
*/
  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

}
