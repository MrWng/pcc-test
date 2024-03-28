import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CommonService, Entry } from 'app/customization/task-project-center-console/service/common.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AthMessageService } from 'ngx-ui-athena/src/components/message';
import { NzTreeNode } from 'ng-zorro-antd/tree';
import { AddSubProjectCardService } from '../../add-subproject-card.service';
import { LiablePersonAddRoleService } from '../../services/liable-person-add-role.service';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { cloneDeep } from '@ng-dynamic-forms/core';
import { DwUserService } from '@webdpt/framework/user';

@Component({
  selector: 'app-liable-person-add-role',
  templateUrl: './liable-person-add-role.component.html',
  styleUrls: ['./liable-person-add-role.component.less']
})
export class LiablePersonAddRoleComponent implements OnInit {
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
    private liablePersonAddRoleService: LiablePersonAddRoleService,
    public commonService: CommonService,
    private modal: NzModalService,
    private athMessageService: AthMessageService,
    private userService: DwUserService,
  ) { }

  ngOnInit(): void { }

  displayWith = (node: NzTreeNode) => {
    return node.title + '  ' + node.origin?.deptName + '  ' + node.origin?.roleName;
  }

  // 不禁用状态
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

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
    const { validateForm, currentCardInfo } = this.addSubProjectCardService;
    // 两个关键项都不存在
    const condition = !(!!validateForm.value.task_name || !!item);
    if (condition || !validateForm.dirty) {
      return;
    }
    const oldItem = item;
    if (item && ((typeof item) === 'string')) {
      const infos = item ? item.split(';') : [];
      const liablePersonData = {};
      infos.forEach(element => {
        const arr = element.split(':');
        liablePersonData[arr[0]] = arr[1];
      });
      item = liablePersonData;
    }
    this.isDisable = false;
    this.personLiable.employee_info = [];
    this.personLiable.error_msg = '';
    if (item && Object.keys(item).length && (this.taskTemplateInfo.task_category !== 'PLM_PROJECT')) {
      const { clear } = await this.personLiableExecutorVerification(item);
      if (this.personLiable.employee_info?.length && !clear) {
        this.clearPersonValue();
        this.changeRef.markForCheck();
        return;
      }
    }
    if (!item && validateForm.value.liable_person_code) {
      this.clearPersonValue();
      this.liable_person_code_data = '';
      validateForm.get('liable_person_code_data').patchValue(null);
      this.changeRef.markForCheck();
      return;
    } else if (item && (Object.keys(item).length > 1)) {
      const { task_status = '', task_category = '' } = currentCardInfo;
      if (task_status === '20' && task_category === 'PLM' && this.designStatus === 'notStart') {
        this.callParentSetData.emit({
          plmNotStart_liablePerson: { liable_person_code: item.id, liable_person_department_code: item.deptId }
        });
      }
      validateForm.get('liable_person_code').patchValue(item?.id ? item.id : null);
      validateForm.get('liable_person_name').patchValue(item?.name ? item.name : null);
      validateForm.get('liable_person_department_name').patchValue(item?.deptName ? item.deptName : null);
      validateForm.get('liable_person_department_code').patchValue(item?.deptId ? item.deptId : null);
      validateForm.get('liable_person_role_no').patchValue(item?.roleNo ? item.roleNo : '');
      validateForm.get('liable_person_role_name').patchValue(item?.roleName ? item.roleName : null);
      validateForm.get('liable_person_code').markAsDirty();
      this.changeRef.markForCheck();
      const task_member_info = validateForm.getRawValue().task_member_info;
      const copyObj = cloneDeep(task_member_info);
      if (task_member_info?.length) {
        task_member_info.forEach((info, index) => {
          if (info === oldItem) {
            copyObj.splice(index, 1);
          }
        });
        validateForm.get('task_member_info').setValue(copyObj);
        this.task_member_info = copyObj;
        this.task_member_infoList = copyObj;
      } else {
        validateForm.get('task_member_info').setValue([]);
      }
      this.liablePersonAddRoleService.changeTaskMemberInfoByLiable(oldItem, this.personList2);
      validateForm.get('task_member_info').markAsDirty();
      this.changeRef.markForCheck();

      setTimeout(() => this.disableExecutorInput(this.taskCategoryType), 50);
    }
    this.callChangeMaskData.emit({
      task_member_infoList: this.task_member_infoList,
      personList: this.personList2
    });
  }

  // 检验未通过，清空负责人执行人
  clearPersonValue(): void {
    this.addSubProjectCardService.validateForm.patchValue({
      liable_person_code: '',
      liable_person_name: '',
      liable_person_department_name: '',
      liable_person_department_code: '',
      liable_person_role_no: '',
      liable_person_role_name: '',
      task_member_info: [],
    });
    this.addSubProjectCardService.validateForm.get('task_member_info').disable();
    this.changeRef.markForCheck();
    this.clearCustomError('personLiable', 2000, 'liable');
  }

  async checkLiablePersonCodeData(task_category: string) {
    this.personLiable.employee_info = [];
    this.personLiable.error_msg = '';
    if (task_category !== 'PLM_PROJECT' && this.liable_person_code_data) {
      const { clear } = await this.personLiableExecutorVerification(this.liable_person_code_data);
      if (this.personLiable.employee_info?.length && !clear) {
        this.clearPersonValue();
        return;
      }
    }
  }

  // 特定时间后清空自定义的报错信息
  clearCustomError(item, timeout, type) {
    setTimeout(() => {
      this[item].employee_info = [];
      this[item].error_msg = '';
      if (type === 'liable') {
        this.liable_person_code_data = '';
        this.addSubProjectCardService.validateForm.get('liable_person_code_data').patchValue(null);
      }
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
   * 人员授权
   * html  负责人增加授权检查
   * @param data 选中的数据 [array|object]
   */
  personLiableExecutorVerification(data: any): any {
    return new Promise((res, rej) => {
      if (!!!data) {
        return res({ clear: true });
      }
      if (!data) {
        return;
      } else if (data && ((typeof data) === 'string')) {
        const infos = data ? data.split(';') : [];
        const liablePersonData = {};
        infos.forEach(element => {
          const arr = element.split(':');
          liablePersonData[arr[0]] = arr[1];
        });
        data = liablePersonData;
      }
      if (!data?.id) {
        return;
      }
      this.commonService.getInvData('auth.employee.info.check', {
        employee_info: [{ employee_no: data.id, employee_name: data.name }],
      })
        .subscribe((resData: any): void => {
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

  nzRemovedFn(nodeItem: any) {
    const { currentCardInfo, validateForm } = this.addSubProjectCardService;
    if ((currentCardInfo.task_status !== '10')
      && (currentCardInfo.task_status !== undefined)) {
      this.notTriggerChangs = true;
      // const tenantId = this.userService.getUser('tenantId');
      // const userId = this.userService.getUser('userId');
      const infoData = validateForm.get('task_member_info').value;
      // sessionStorage.setItem('noRemovePerson-' + tenantId + '-' + userId + '-'
      // + currentCardInfo.project_no + '-' + currentCardInfo.task_no , 'Y');
      validateForm.get('task_member_info').setValue(infoData);
      this.notTriggerChangs = false;
    }
  }

  /**
   * 执行人：值的改变
   * @param item
   * @returns
   */
  async personChanges(item: string[]) {
    if (this.notTriggerChangs || !this.addSubProjectCardService.validateForm.dirty) {
      return;
    }
    // const { currentCardInfo } = this.addSubProjectCardService;
    // const tenantId = this.userService.getUser('tenantId');
    // const userId = this.userService.getUser('userId');
    // const noRemoveFlag = sessionStorage.getItem('noRemovePerson-' + tenantId + '-' + userId + '-'
    //   + currentCardInfo.project_no + '-' + currentCardInfo.task_no);
    // if (noRemoveFlag === 'Y') {
    //   sessionStorage.setItem('noRemovePerson-' + tenantId + '-' + userId + '-'
    //     + currentCardInfo.project_no + '-' + currentCardInfo.task_no , 'N');
    //   return;
    // }
    this.isDisable = false;
    this.task_member_info = [];
    if (!item || !item?.length) {
      this.athenaAuthorityTip.isShow = false;
      this.athenaAuthorityTip.message = '';
    }
    if (Array.isArray(item) && item.length) {

      this.employee_info = [];
      // 将组件选择的人员信息，整合后，放入task_member_info、employee_info
      item.forEach(element => {
        const arr = element.split(';');
        const obj = {};
        arr.forEach(v => {
          const temp = v.split(':');
          obj[temp[0]] = temp[1];
        });
        this.employee_info.push({ employee_no: obj['id'], employee_name: obj['name'] });
        const memberInfo = {
          executor_role_no: obj['roleNo'] ? obj['roleNo'] : '',
          executor_role_name: obj['roleName'] ? obj['roleName'] : '',
          executor_department_name: obj['deptName'],
          executor_department_no: obj['deptId'],
          executor_name: obj['name'],
          executor_no: obj['id'],
          project_no: this.project_no,
          task_no: (this.addSubProjectCardService.currentCardInfo as any).task_no,
        };
        this.task_member_info.push(memberInfo);
      });
      this.task_member_info = [...new Set(this.task_member_info)];
      this.task_member_infoList = this.task_member_info;
      this.employee_info = [...new Set(this.employee_info)];
      this.callParentSetData.emit({ executor: { employee_info: [], error_msg: '' } });
      if (['PLM', 'PLM_PROJECT'].includes(this.taskCategoryType)) {
        this.callChangeMaskData.emit({
          task_member_infoList: this.task_member_infoList,
          personList: this.personList2
        });
        return;
      }

      if (this.employee_info?.length) {
        this.commonService.getInvData('auth.employee.info.check', { employee_info: this.employee_info })
          .subscribe(({ data }: any) => {
            this.executor.employee_info = data?.employee_info;
            this.callParentSetData.emit({ executor: { employee_info: data?.employee_info, error_msg: data?.error_msg } });
            this.deleteMember();
            this.changeRef.markForCheck();
          });
      }
    }
  }

  // 删除选中执行人
  deleteMember(): void {
    const infoData = this.addSubProjectCardService.validateForm.get('task_member_info');
    if (this.executor.employee_info.length > 0) {
      this.notTriggerChangs = true;
      this.executor.employee_info.forEach(item => {
        const value = infoData.value.filter(res => res.indexOf(item.employee_no) === -1);
        this.addSubProjectCardService.validateForm.get('task_member_info').setValue(value);
      });
      this.notTriggerChangs = false;
      this.clearCustomError('executor', 2000, '');
    }
    this.changeRef.markForCheck();
    this.callChangeMaskData.emit({
      task_member_infoList: this.task_member_infoList,
      personList: this.personList2
    });
  }

  /**
   * 负责人：搜索
   * @param value 输入值
   * @returns 搜索结果
   */
  searchPersonList(value: string, type: string): void {
    const searchList = this.liablePersonAddRoleService.searchPersonList(value, this.copyPersonList);
    const pList = type === '1' ? 'personList' : 'personList2';
    this[pList] = searchList;
    this.changeRef.markForCheck();
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
    this.liablePersonAddRoleService.setSameValue(this.project_no, this.source, this.taskCategoryType)
      .subscribe(res => {
        this.isDisable = true;
        if (res.error_msgs.length) {
          this.modal.confirm({
            nzTitle: null,
            nzContent: ErrorMessageComponent,
            nzOkText: this.translateService.instant('dj-default-确定'),
            nzCancelText: null,
            nzComponentParams: { messageInfo: res.error_msgs },
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
