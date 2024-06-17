import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  SimpleChanges,
  OnChanges,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { FormGroup } from '@angular/forms';
import { OpenWindowService } from '@athena/dynamic-ui';
import { DwUserService } from '@webdpt/framework/user';
import {
  cloneDeep,
  DynamicFormLayout,
  DynamicTableModel,
  DynamicFormLayoutService,
  DynamicFormValidationService,
  DynamicUserBehaviorCommService,
  PluginLanguageStoreService,
} from '@athena/dynamic-core';
import { ListOfDepartmentService } from './list-of-department.service';
import { CommonService, Entry } from '../../service/common.service';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DynamicWbsService } from '../wbs/wbs.service';
import * as moment from 'moment';

@Component({
  selector: 'app-list-of-department',
  templateUrl: './list-of-department.component.html',
  styleUrls: ['./list-of-department.component.less'],
  providers: [ListOfDepartmentService],
})
export class ListOfDepartmentComponent implements OnInit, OnChanges {
  @ViewChild('normalFormComponent') normalFormComponent: NzTreeComponent;
  @Input() executeContext: any;
  @Input() tabIndex: number;
  @Input() tabName: String;
  @Input() source: Entry = Entry.card;
  @Input() signOff: boolean = false;
  @Input() hasAuth: boolean = true;

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];
  enumEntry = Entry;

  defaultCheckedKeys = [];
  nzExpandAll: boolean = true;
  searchValue = '';

  isVisible: Boolean = false;
  isShowClose: Boolean = false;

  // 获取人员列表
  personList = [];
  listNumber = 0;
  // 克隆数据
  clonePersonListALL = [];
  // 渲染树数据
  personListALL = [];
  // 右侧展示列表
  personTree = [];
  // 选择人员列表
  selectPersonList: any = [];
  // 初始选择人员列表（用于重置）
  resetPersonList = [];
  // 引用用户列表
  disabledList: any = [{}];
  // 提交按钮
  activeStatus: boolean = false;
  updateSubmitCode: string;

  // 提交节流
  throttleTime: number = 0;

  // 角色信息
  roleGroup = [];
  // 角色信息备份
  sourceRoleGroup = [];
  allPersonLoading: boolean = false;
  selectedPersonLoading: boolean = false;
  check_data: String = '';

  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    public wbsTabsService: WbsTabsService,
    public listOfDepartmentService: ListOfDepartmentService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public messageService: NzMessageService,
    private userBehaviorCommService: DynamicUserBehaviorCommService,
    private pluginLanguageStoreService: PluginLanguageStoreService,
    private userService: DwUserService,
    public wbsService: DynamicWbsService
  ) {
    this.updateSubmitCode =
      'PCC-' + this.userBehaviorCommService.commData.workType + '-PCC_TAB005-PCC_BUTTON001';
  }

  ngOnInit(): void {
    this.check_data = '';
    this.getPersonData();
    /**
     *  s10: 项目变更签核不可操作
     *  s11: 项目变更的变更状态不是进行中时，参与部门人员不可执行增删改
     */
    if (this.source === Entry.projectChangeSignOff || !this.hasAuth) {
      this.wbsService.projectChangeStatus['check_type_list'] = false;
    } else if (this.source === Entry.projectChange) {
      this.wbsService.projectChangeStatus['check_type_list'] =
        this.wbsService.projectChangeDoc.change_status === '1';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.check_data = '';
    if (this.tabName === 'app-list-of-department') {
      if (this.source === Entry.card) {
        this.commonService
          .getProjectChangeStatus(
            this.wbsService.project_no,
            ['1', '2' /** s16: 去掉3的入参 '3' **/, , '4', '5'],
            '2'
          )
          .subscribe(
            (res: any): void => {
              this.wbsService.projectChangeStatus['check_type_list'] =
                this.hasAuth && res.data?.project_info[0]?.check_result;
              this.check_data = res.data?.project_info[0]?.check_data;
              this.changeRef.markForCheck();
            },
            (error) => {
              this.wbsService.projectChangeStatus['check_type_list'] = this.hasAuth;
              this.check_data = '';
              this.changeRef.markForCheck();
            }
          );
      }
      this.getSelectMemberList();
    }
  }

  /**
   * 获取部门人员信息
   */
  getPersonData(): void {
    // 获取所有角色信息
    // this.listOfDepartmentService.getRoleList().then((role) => {
    this.commonService.getDutyInfo().subscribe((res: any) => {
      const role = res.data.map((o) => {
        return { id: o.id, name: o.name };
      });
      role.unshift({ id: '#%#@%##', name: this.translateService.instant('dj-pcc-无角色') });

      const params = { project_member_info: [{ project_no: '' }] };
      this.allPersonLoading = true;
      // 获取所有人员信息,所有人员信息角色都为空
      this.commonService.getInvData('employee.info.process', params).subscribe(
        ({ code, data }): void => {
          if (code !== 0) {
            this.allPersonLoading = false;
            this.changeRef.markForCheck();
            return;
          }
          // 将人员信息按照部门进行分组，获取部门人员信息
          const departmentGroup = this.listOfDepartmentService.getDepartmentList(
            data.project_member_info
          );
          this.allPersonLoading = false;
          this.changeRef.markForCheck();

          // 将部门分组加到每个角色信息下，实现按角色分组
          this.setRoleGroup(role, departmentGroup);
          // 获取已选人员列表
          this.getSelectMemberList();
        },
        (error) => {
          this.allPersonLoading = false;
          this.changeRef.markForCheck();
          this.messageService.error(this.translateService.instant('dj-pcc-获取部门人员信息失败'));
        }
      );
    });
  }

  /**
   * 获取roleGroup
   * @param role
   * @param departmentGroup
   */
  setRoleGroup(role, departmentGroup): any {
    this.roleGroup = role.map(({ id, name }) => ({
      title: name,
      key: id,
      children: departmentGroup.map((department) => ({
        ...department,
        key: id + department.deptId,
        role_no: id,
        role_name: name,
        children: department.children.map((child) => ({
          ...child,
          key: id + department.deptId + child.employee_no,
          role_no: id,
          role_name: name,
        })),
      })),
      role_no: id,
      role_name: name,
    }));
    this.roleGroup.forEach((roleItem) => {
      roleItem.deptGroups = roleItem.children;
      roleItem.deptGroups.forEach((e) => {
        e.list = e.children;
        e.len = e.children.length;
      });
    });
  }

  /**
   * 获取已选人员列表
   */
  getSelectMemberList() {
    const projectNo =
      this.wbsService.project_no ||
      this.executeContext?.taskWithBacklogData?.bpmData?.project_info?.[0]?.project_no;
    if (projectNo) {
      this.selectedPersonLoading = true;
      this.commonService
        .getInvData(
          this.source === Entry.projectChange || this.source === Entry.projectChangeSignOff
            ? 'bm.pisc.project.member.change.get'
            : 'bm.pisc.project.member.get',
          this.source === Entry.projectChange || this.source === Entry.projectChangeSignOff
            ? {
                excluded_already_deleted_task: true,
                project_member_change_info: [
                  {
                    project_no: projectNo,
                    change_version: this.wbsService.projectChangeDoc.change_version,
                  },
                ],
              }
            : { project_member_info: [{ project_no: projectNo }] }
        )
        .subscribe(
          (res: any): void => {
            const data =
              this.source === Entry.projectChange || this.source === Entry.projectChangeSignOff
                ? res.data?.project_member_change_info || []
                : res.data?.project_member_info || [];
            if (res.code === 0 && data.length) {
              // 禁用关联人员
              this.disableSomeMember(data);
              // 获取已经提交的选择人员信息列表
              this.resetPersonList = JSON.parse(JSON.stringify(data));
              this.changeRef.markForCheck();
              // 设置无角色编号为00000
              data.forEach((o) => {
                o.role_no = o.role_no ? o.role_no : '#%#@%##';
              });
            } else {
              this.clearData();
            }
            this.selectedPersonLoading = false;
            this.changeRef.markForCheck();
          },
          () => {
            this.selectedPersonLoading = false;
            this.changeRef.markForCheck();
          }
        );
    }
  }

  /**
   * 情况数据
   */
  clearData(): void {
    this.personTree = [];
    this.defaultCheckedKeys = [];
    this.disabledList = [];
    this.changeRef.markForCheck();
  }

  /**
   * 禁用选中的人员列表中被引用的人员
   * @param list
   */
  async disableSomeMember(list) {
    const params = {
      project_member_info: list,
    };
    if (this.source === Entry.projectChange || this.source === Entry.projectChangeSignOff) {
      params['type'] = '2';
    }
    const result = await this.commonService
      .getInvData('bm.pisc.project.member.cite.check', params)
      .toPromise();
    if (result.code !== 0) {
      return;
    }
    // 设置被禁用人员无角色的编号为00000
    result.data.project_member_info.forEach((o) => {
      o.role_no = o.role_no ? o.role_no : '#%#@%##';
    });
    this.restoreDisableSomeMember(result.data.project_member_info);
    // 获取项目成员在项目/任务/任务执行人中被引用的列表，这边禁用掉
    this.disabledList = result.data.project_member_info;
    this.changeRef.markForCheck();
    // 被默认选择的节点列表
    this.defaultCheckedKeys = list.map((res) => res.role_no + res.department_no + res.employee_no);
    // 被选择的列表,这里是平铺的数据，没有层级
    this.selectPersonList = list.map((res) => ({
      origin: { empId: res.employee_no, deptId: res.department_no, role_no: res.role_no },
    }));
    // 禁用角色分组中的被关联的人员
    this.disabledList.forEach((target) => {
      const roleTarget = this.roleGroup?.find((o) => o.role_no === target.role_no);
      const depTarget = roleTarget?.children.find((o) => o.deptId === target.department_no);
      const itemTarget = depTarget?.children.find((o) => o.empId === target.employee_no);
      if (itemTarget) {
        itemTarget.disableCheckbox = itemTarget ? true : false;
      }
    });
    this.changeRef.markForCheck();
    // 组装已选部门与人员的数据，有层级，为树状结构
    this.personTree = this.listOfDepartmentService.getSelectList(
      this.roleGroup,
      this.disabledList,
      list
    );
    this.roleGroup = [...this.roleGroup];
    this.changeRef.markForCheck();
  }
  /**
   * 还原原先禁用选中的人员列表中被引用的人员
   * @param list 需要禁用的人员
   */
  restoreDisableSomeMember(list = []) {
    const listMap = Object.create(null);
    list.forEach((item) => {
      listMap[item.role_no + item.department_no + item.employee_no] = true;
    });
    this.disabledList.forEach((item) => {
      if (!listMap[item.role_no + item.department_no + item.employee_no]) {
        // 需要还原
        const roleTarget = this.roleGroup?.find((o) => o.role_no === item.role_no);
        const depTarget = roleTarget?.children.find((o) => o.deptId === item.department_no);
        const itemTarget = depTarget?.children.find((o) => o.empId === item.employee_no);
        if (itemTarget) {
          itemTarget.disableCheckbox = false;
        }
      }
    });
    this.changeRef.markForCheck();
  }

  /**
   * 删除personTree中的已选部门或人员
   */
  deleteDeptOrPerson(data, type) {
    this.activeStatus = true;
    // 如果删除的是角色,则直接根据index删除整个部门
    if (type === 0) {
      const roleItemIndex = this.personTree.findIndex((item) => item.role_no === data.role_no);
      if (roleItemIndex >= 0) {
        this.personTree.splice(roleItemIndex, 1);
      }
    } else {
      // 找到该部门或人员的所在角色分组
      const roleItem = this.personTree.find((item) => item.role_no === data.role_no);
      // 找到该部门或人员的所在部门的索引
      const deptIndex = roleItem.deptGroups.findIndex((item) => item.deptId === data.deptId);
      if (deptIndex >= 0 && type === 1) {
        roleItem?.deptGroups?.splice(deptIndex, 1);
      }
      // 如果删除的是人员
      if (type === 2) {
        // 找到相应的部门
        const deptItem = roleItem.deptGroups.find((item) => item.deptId === data.deptId);
        // 找到相应的部门的索引
        const targetIndex = deptItem.list?.findIndex((item) => item.empId === data.empId);
        // 如果部门只有一个人员，则删除该部门，否则删除该部门下的该人员
        if (deptItem?.list?.length === 1) {
          roleItem?.deptGroups?.splice(deptIndex, 1);
        } else {
          deptItem.list.splice(targetIndex, 1);
        }
      }
    }
    this.resetDefaultCheckedKeys();
  }

  /**
   * 重置默认选择节点
   */
  resetDefaultCheckedKeys() {
    const defaultCheckedKeys = this.personTree.reduce((acc, role) => {
      role.deptGroups.forEach((d) => {
        d.list.forEach((o) => {
          acc.push(o.role_no + o.deptId + o.empId);
        });
      });
      return acc;
    }, []);
    this.defaultCheckedKeys = defaultCheckedKeys;
    this.changeRef.markForCheck();
  }

  /**
   * 是否含有被禁用的人员，含有的话不允许删除
   * @param list
   * @returns
   */
  hasDisableCheckbox(list, type): boolean {
    let result = true;
    if (this.wbsService.projectChangeStatus['check_type_list']) {
      if (type === 0) {
        list?.forEach((d) => {
          if (result) {
            result = d?.list?.every((item) => !item.disableCheckbox);
          }
        });
      } else {
        // 检查数组中的每个元素是否具有 disableCheckbox 属性为 false 或 undefined，如果每个元素都满足该条件，则返回 true，否则返回 false。
        result = list.every((item) => !item.disableCheckbox);
      }
    } else {
      result = false;
    }
    return result;
  }

  /**
   * 点击checkBox
   * @param event
   */
  checkBoxChange(event: NzFormatEmitEvent): void {
    this.activeStatus = true;
    const nodeList = this.normalFormComponent.getCheckedNodeList();
    // 平铺的已选择人员列表
    this.selectPersonList = nodeList;
    // 将平铺的已选择人员列表组装成按照角色、部门分组的树状图
    this.personTree = this.listOfDepartmentService.resetPersonTree(nodeList);
    this.changeRef.markForCheck();
  }

  getDefaultCheckedKeys(node) {
    console.log(this.defaultCheckedKeys);
    const list = [];
    if (node?.level === 0) {
      node.origin.children.forEach((dep) => {
        dep.children.forEach((item) => {
          list.push(item.role_no + item.deptId + item.empId);
        });
      });
    }
    if (node?.level === 1) {
      node.origin.children.forEach((item) => {
        list.push(item.role_no + item.deptId + item.empId);
      });
    }
    if (node?.level === 2) {
      node.forEach((item) => {
        list.push(item.origin.role_no + item.origin.deptId + item.origin.empId);
      });
    }
    node.forEach((item) => {
      list.push(item.role_no + item.deptId + item.empId);
    });
    this.defaultCheckedKeys = list;
    console.log(this.defaultCheckedKeys);
  }

  /**
   * 提交
   * @returns
   */
  updateSubmit() {
    if (moment().valueOf() - this.throttleTime < 3000) {
      return;
    }
    this.throttleTime = moment().valueOf();
    if (!this.activeStatus) {
      return;
    }
    const list = this.getProjectMemberInfo();
    if (!list.length) {
      this.resetPerson('保存');
      return;
    }
    this.createMemberInfo(list);
  }

  /**
   * 依据项目编号、部门编号等条件创建项目成员信息 (敏态)
   * @param list
   */
  createMemberInfo(list: any): any {
    const params = {
      operation_no: this.userService.getUser('userId'),
      operation_name: this.userService.getUser('userName'),
    };
    let apiName = 'project.member.info.create';
    if (this.source === this.enumEntry.projectChange) {
      params['project_change_info'] = [
        {
          project_no: this.wbsService.projectChangeDoc.project_no,
          change_version: this.wbsService.projectChangeDoc.change_version,
          project_member_change_info: list,
        },
      ];
      apiName = 'bm.pisc.project.member.change.update.process';
    } else {
      params['project_member_info'] = list;
    }
    this.commonService.getInvData(apiName, params).subscribe((res: any): void => {
      if (res.code === 0) {
        this.getSelectMemberList();
        this.queryChargePersonList();
        this.activeStatus = false;
        this.messageService.success(this.translateService.instant('dj-default-保存成功'));
      } else {
        this.messageService.error(this.translateService.instant('dj-default-保存失败，请重试'));
      }
    });
  }

  /**
   * 获取选择的人员信息列表
   * @returns
   */
  getProjectMemberInfo(): any {
    return this.personTree.reduce((acc, role) => {
      role.deptGroups.forEach((res) => {
        res.list.forEach((o) => {
          const arr = {
            project_no:
              this.wbsService.project_no ||
              this.executeContext?.taskWithBacklogData?.bpmData?.project_info[0]?.project_no,
            department_no: o.deptId,
            department_name: o.deptName,
            employee_no: o.empId,
            employee_name: o.empName,
            role_no: o.role_no === '#%#@%##' ? '' : o.role_no,
            role_name: o.role_no === '#%#@%##' ? '' : o.role_name,
          };
          acc.push(arr);
        });
      });
      return acc;
    }, []);
  }

  /**
   * 点击重置
   * @returns
   */
  handleOk(): void {
    if (this.disabledList?.length || !this.resetPersonList?.length) {
      return;
    }
    this.isVisible = true;
  }

  /**
   * 取消重置
   * @returns
   */
  handleCancel(): void {
    this.isVisible = false;
  }

  /**
   * 重置或保存
   * @param title
   */
  resetPerson(title) {
    const params = {
      operation_no: this.userService.getUser('userId'),
      operation_name: this.userService.getUser('userName'),
    };
    let apiName = 'project.member.info.delete';
    if (this.source === this.enumEntry.projectChange) {
      params['project_change_info'] = [
        {
          project_no: this.wbsService.projectChangeDoc.project_no,
          change_version: this.wbsService.projectChangeDoc.change_version,
          project_member_change_info: [],
        },
      ];
      apiName = 'bm.pisc.project.member.change.update.process';
    } else {
      params['project_member_info'] = this.resetPersonList;
    }
    this.isVisible = false;
    this.commonService.getInvData(apiName, params).subscribe((res: any): void => {
      if (res.code === 0) {
        this.queryChargePersonList();
        this.getSelectMemberList();
        this.activeStatus = false;
        this.resetPersonList = [];
        this.changeRef.markForCheck();
        this.messageService.success(this.translateService.instant(`dj-default-${title}成功`));
      } else {
        this.messageService.error(this.translateService.instant(`dj-default-${title}失败，请重试`));
      }
    });
  }

  /**
   * 获取EOC(鼎捷云端端组织)符合授权及用户关联之员工信息 (敏态)
   */
  queryChargePersonList(): void {
    const params = {
      project_member_info: [
        {
          project_no:
            this.wbsService.project_no ||
            this.executeContext?.taskWithBacklogData?.bpmData?.project_info[0]?.project_no,
        },
      ],
    };
    this.commonService.getInvData('employee.info.process', params).subscribe((res: any): void => {
      if (res.code === 0) {
        this.wbsTabsService.personList = res.data.project_member_info;
        this.changeRef.markForCheck();
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

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
