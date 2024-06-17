/**
 * @file 负责人 & 执行人字段逻辑处理
 * @createDate 2022/10/9
 */
import { Injectable } from '@angular/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { Observable } from 'rxjs';
import { WbsTabsService } from '../../wbs-tabs/wbs-tabs.service';
import { AddSubProjectCardService } from '../add-subproject-card.service';
import { IPersonListItem, ISetPeopleList } from '../types/liable-person';
import { cloneDeep } from '@athena/dynamic-core';
import { DwLanguageService } from '@webdpt/framework/language';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class LiablePersonAddRoleService {

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    public commonService: CommonService,
    public wbsTabsService: WbsTabsService,
    private languageService: DwLanguageService,
    private messageService: NzMessageService,
  ) { }

  /**
   * 获取参与人员
   * @param project_no 项目编号
   * @param personList 缓存的数据
   * @returns Observable<ISetPeopleList >
   */
  getSelectPersonList(project_no: string, personList = [], source?: string, change_version?): Observable<ISetPeopleList> {
    return new Observable((observable2) => {
      let params = { project_member_info: [{ project_no }] };
      let url = 'employee.info.process';
      if(source === Entry.projectChange){
        // @ts-ignore
        params = { search_type: '2', include_no_department_employee: false ,project_info: [{ project_no, change_version }] };
        url = 'bm.pisc.project.employee.get';
      }
      this.commonService.getInvData(url, params).subscribe((res: any): void => {
        if (res.code === 0 && res.data.project_member_info && res.data.project_member_info.length) {
          const list = res.data.project_member_info;
          const peopleList = this.setPeopleListForRole(list);
          observable2.next({ ...peopleList });
        } else {
          observable2.next();
        }
      });
    });
  }

  /**
   * 初始化接口数据
   * 将人员按照角色、部门分类
   * @param list 所有人员，接口数据，employee.info.process
   * @returns ISetPeopleList
   */
  setPeopleListForRole(list): ISetPeopleList {
    let liable_person_code_data: any = null;
    const liable_person_code_dataList: any[] = [];
    const originPersonList: any[] = [];
    const task_member_info: any[] = [];
    const task_member_infoList: any[] = [];
    const task_member_infoList_other: any[] = [];
    let isHasPerson = false;
    const { currentCardInfo, validateForm} = this.addSubProjectCardService; // 当然任务卡
    // 已选择的，负责人信息
    const { liable_person_code, liable_person_department_code, liable_person_role_no } = validateForm.getRawValue();

    list.forEach((listItem) => {
      const { department_no, department_name, employee_no, user_id, employee_name, role_no, role_name } = listItem;
      const key = 'id:'+ employee_no + ';name:' + employee_name
        + ';deptId:' + department_no + ';deptName:' + department_name
        + ';roleNo:' + (role_no ? role_no : '') + ';roleName:' + (role_name ? role_name : '');
      const personListItem: IPersonListItem = {
        key,
        title: employee_name,
        roleNo: role_no,
        roleName: role_name,
        deptId: department_no,
        deptName: department_name,
        id: employee_no,
        userId: user_id,
        name: employee_name,
        taskDisabled: false,
        isLeaf: true,
        selected: false,
        check: !!currentCardInfo['task_member_info']?.filter(item => item.executor_no === employee_no).length,
        checked: false,
        selectable: true,
        disabled: false
      };

      if (currentCardInfo.someEdit) {
        // currentCardInfo?.task_member_info：接口返回的执行人列表数据，用于回显
        personListItem.taskDisabled = currentCardInfo?.task_member_info?.some(infoItem =>
          (employee_no === infoItem.executor_no)
          && (department_no === infoItem.executor_department_no)
          && (role_no === infoItem.executor_role_no)
        );
      }

      originPersonList.push(personListItem);

      if ((employee_no === liable_person_code)
        && (department_no === liable_person_department_code)
        && (role_no === liable_person_role_no)) {
        personListItem.isSelected = true; // 已选择的负责人的标识
        isHasPerson = true;
        liable_person_code_data = personListItem; // 已选择的负责人信息
      }
    });
    if (!isHasPerson && currentCardInfo.liable_person_code) {
      let role_name_temp2 = currentCardInfo.liable_person_role_name;
      if (currentCardInfo.liable_person_role_no === '') {
        if (this.languageService.currentLanguage === 'zh_TW') {
          role_name_temp2 = currentCardInfo.liable_person_role_name ? currentCardInfo.liable_person_role_name : '無角色';
        } else if (this.languageService.currentLanguage === 'zh_CN') {
          role_name_temp2 = currentCardInfo.liable_person_role_name ? currentCardInfo.liable_person_role_name : '无角色';
        } else {
          role_name_temp2 = currentCardInfo.liable_person_role_name ? currentCardInfo.liable_person_role_name : 'no role';
        }
      }
      const key = 'id:'+ currentCardInfo.liable_person_code + ';name:' + currentCardInfo.liable_person_name
        + ';deptId:' + currentCardInfo.liable_person_department_code + ';deptName:' + currentCardInfo.liable_person_department_name
        + ';roleNo:' + (currentCardInfo.liable_person_role_no ? currentCardInfo.liable_person_role_no : '')
        + ';roleName:' + role_name_temp2;
      const dataItem = {
        key,
        title: currentCardInfo.liable_person_name,
        roleNo: currentCardInfo.liable_person_role_no ? currentCardInfo.liable_person_role_no : '',
        roleName: role_name_temp2,
        deptId: currentCardInfo.liable_person_department_code,
        deptName: currentCardInfo.liable_person_department_name,
        id: currentCardInfo.liable_person_code,
        name: currentCardInfo.liable_person_name,
        taskDisabled: true,
        isLeaf: true,
        checked: true,
        selectable: true,
        disabled: false,
        other: true
      };

      liable_person_code_data = dataItem; // 已选择的负责人信息
      liable_person_code_dataList.push(dataItem); // 补充的，负责人的列表 中
    }
    // 已选的执行人集合
    currentCardInfo?.task_member_info?.forEach((info: any): void => {
      // 已选的
      const { executor_department_no, executor_department_name, executor_name, executor_no, executor_role_no, executor_role_name } = info;
      let role_name_temp = executor_role_name;
      if (executor_role_no === '') {
        if (this.languageService.currentLanguage === 'zh_TW') {
          role_name_temp = executor_role_name ? executor_role_name : '無角色';
        } else if (this.languageService.currentLanguage === 'zh_CN') {
          role_name_temp = executor_role_name ? executor_role_name : '无角色';
        } else {
          role_name_temp = executor_role_name ? executor_role_name : 'no role';
        }
      }
      const key = 'id:'+ executor_no + ';name:' + executor_name
        + ';deptId:' + executor_department_no + ';deptName:' + executor_department_name
        + ';roleNo:' + (executor_role_no ? executor_role_no : '')
        + ';roleName:' + role_name_temp;
      const obj = {
        key,
        title: executor_name,
        roleNo: executor_role_no,
        roleName: role_name_temp,
        deptId: executor_department_no,
        deptName: executor_department_name,
        name: executor_name,
        id: executor_no,
        bigId: executor_department_no + ';' + executor_no +  ';' + (executor_role_no ? executor_role_no : ''),
        taskDisabled: false,
      };
      list.forEach(listItem => {
        const { department_no, employee_no, role_no } = listItem;
        if ((employee_no === executor_no) && (department_no === executor_department_no) && (role_no === executor_role_no)) {
          obj['finder'] = true;
        }
      });
      task_member_info.push(key);
      task_member_infoList.push(obj);
    });
    task_member_infoList.forEach(item => {
      if (!item['finder']) {
        item.checked = true;
        item.selectable = true;
        item.disabled = false;
        item.other = true;
        task_member_infoList_other.push(item);
      }
    });
    return {
      list,
      liable_person_code_data,
      liable_person_code_dataList,
      originPersonList,
      task_member_info,
      task_member_infoList,
      task_member_infoList_other
    };
  }

  /**
   * 和【负责人】选项，相同，置灰不可选
   * @param liable 当前选择的【负责人】
   * @param list 【执行人】List<Tree>集合，三层
   */
  changeTaskMemberInfoByLiable(liable: string, list: any[]) {
    const liablePersonData = {};
    if (liable && ((typeof liable) === 'string')) {
      const infos = liable ? liable.split(';') : [];
      infos.forEach(element => {
        const arr = element.split(':');
        liablePersonData[arr[0]] = arr[1];
      });
    }
    list.forEach((o) => {
      o.children?.forEach((e) => {
        e.children.forEach((e2) => {
          e2.checked =  false;
          e2.selectable =  true;
          e2.disableCheckbox =  false;
          e2.disabled = false;
          // if (e2.key === liable) {
          if (e2?.id === liablePersonData['id']) {
            e2.selectable =  false;
            e2.disableCheckbox =  true;
            e2.disabled =  true;
          }
        });
      });
    });
  }

  /**
   * 进行中的任务不可以删除执行人，清空与清除，按钮管控
   * @param selectList 已选择的执行人
   * @param list 执行人数据集合TREE
   */
  noChangeSelectedPersonList(selectList: any[], list: any[]) {
    list.forEach((o) => {
      o.children?.forEach((e) => {
        e.children.forEach((e2) => {
          selectList.forEach(item => {
            if (e2.key === item.key) {
              e2.disableCheckbox =  true;
              e2.selectable =  false;
              e2.disabled =  true;
            }
          });
        });
      });
      if (!o.children || !o.children.length) {
        selectList.forEach(item => {
          if (o.key === item.key) {
            o.disableCheckbox =  true;
            o.selectable =  false;
            o.disabled =  true;
          }
        });
      }
    });
  }

  /**
   * 负责人：搜索
   * @param keyword 搜索内容
   * @param copyPersonList 原始下拉数据
   * @returns 搜索结果
   */
  searchPersonList(keyword, copyPersonList): any {
    if (!keyword) { return copyPersonList; };
    const searchList = [];
    copyPersonList.forEach(element => {
      // 这里有问题
      if (element.deptName.includes(keyword)) {
        searchList.push(element);
      } else {
        const list = element?.list?.filter(item => {
          return item.name.includes(keyword);
        });
        if (list?.length) {
          const item = {
            deptId: element.deptId,
            deptName: element.deptName,
            list: list,
          };
          searchList.push(item);
        }
      }
    });
    return searchList;
  }

  /**
   * 整合数据，提供给【部门】
   * TODO：负责人 & 执行人 值改变之后调用
   */
  changeMaskData(task_member_infoList: any, personList: any) {
    const formValues = this.addSubProjectCardService.validateForm.getRawValue();
    if (formValues.liable_person_code || formValues.task_member_info?.length) {
      const arr = [];
      const arrName = [];
      if (formValues.liable_person_code) {
        arr.push({ personnel_no: formValues.liable_person_code });
        arrName.push(formValues.liable_person_name);
      }
      if (formValues.task_member_info && formValues.task_member_info?.length) {
        formValues.task_member_info.forEach((info) => {
          const tempArr = info.split(';');
          const id = tempArr[0] ? tempArr[0].split(':')[1] : '';
          const name = tempArr[1] ? tempArr[1].split(':')[1] : '';
          arr.push({ personnel_no: id });
          arrName.push(name);
        });
      }
      return { list: arr, name: arrName.join('、') };
    } else {
      return { list: [], name: '' };
    }
  }

  /**
   * 人员同值，日期同值
   * @param type
   * @returns
   */
  setSameValue(project_no, source, taskCategoryType, is_sync_document, change_version?): Observable<any> {
    return new Observable(observable2 => {
      const { currentCardInfo, validateForm } = this.addSubProjectCardService;
      const {
        task_no,
        liable_person_code,
        liable_person_name,
        liable_person_department_code,
        liable_person_department_name,
        liable_person_role_name,
        liable_person_role_no,
        liable_person_code_data
      }
        = validateForm.getRawValue();
      if ((currentCardInfo.task_status !== '10' && source === Entry.card) || this.addSubProjectCardService.buttonType !== 'EDIT') {
        observable2.next(false);
        return;
      }

      const liable_perso_info = {
        liable_person_code:'',
        liable_person_name:'',
        liable_person_department_code:'',
        liable_person_department_name:'',
        liable_person_role_no:'',
        liable_person_role_name:'',
      };
      if (!liable_person_code && liable_person_code_data) {
        if (liable_person_code_data) {
          // 格式参考："id:pvq017;name:erp内勤1;deptId:C001;deptName:仓管部;roleNo:;roleName:無角色"
          const arr1 = liable_person_code_data.split(';');
          const item = {};
          arr1.forEach(v => {
            const temp = v.split(':');
            item[temp[0]] = temp[1];
          });
          liable_perso_info['liable_person_code'] = item['id'];
          liable_perso_info['liable_person_name'] = item['name'];
          liable_perso_info['liable_person_department_code'] = item['deptId'];
          liable_perso_info['liable_person_department_name'] = item['deptName'];
          liable_perso_info['liable_person_role_no'] = item['roleNo'];
          liable_perso_info['liable_person_role_name'] = item['roleName'];
        }
      }

      let params: any = {};
      const taskMemberInfo: Array<string> = cloneDeep(validateForm.getRawValue().task_member_info || []);
      const task_member_info = [];
      taskMemberInfo.forEach(element => {
        const arr = element.split(';');
        const obj = {};
        arr.forEach(v => {
          const temp = v.split(':');
          obj[temp[0]] = temp[1];
        });

        task_member_info.push({
          executor_role_no: obj['roleNo'] ? obj['roleNo'] : '',
          executor_role_name: obj['roleNo'] ? obj['roleName'] : '',
          executor_department_name: obj['deptName'],
          executor_department_no: obj['deptId'],
          executor_name: obj['name'],
          executor_no: obj['id']
        });
      });

      // 项目编号，任务编号，负责人编号，执行人编号
      params = {
        site_no: '',
        enterprise_no: '',
        sync_steady_state: this.wbsTabsService.hasGroundEnd,
        is_sync_document,
        project_info: [{
          project_no,
          task_no,
          liable_person_name: liable_person_name ? liable_person_name : liable_perso_info.liable_person_name,
          liable_person_code: liable_person_code ? liable_person_code : liable_perso_info.liable_person_code,
          liable_person_department_code: liable_person_department_code
            ? liable_person_department_code : liable_perso_info.liable_person_department_code,
          liable_person_department_name: liable_person_department_name
            ? liable_person_department_name : liable_perso_info.liable_person_department_name,
          liable_person_role_name: liable_person_role_name
            ? liable_person_role_name : liable_perso_info.liable_person_role_name,
          liable_person_role_no: (liable_person_role_no || liable_perso_info.liable_person_role_no)
            ? (liable_person_role_no ? liable_person_role_no : liable_perso_info.liable_person_role_no): '',
          task_member_info,
          task_category: taskCategoryType,
          task_property: source === Entry.maintain ? '2' : '1',
        }],
      };

      if ((liable_perso_info|| liable_perso_info.liable_person_name) || task_member_info?.length) {
        if (source === Entry.collaborate) {
          const bpmData = this.commonService.content?.executeContext?.taskWithBacklogData?.bpmData;
          const taskInfo = bpmData?.assist_schedule_info ? bpmData?.assist_schedule_info[0] : bpmData?.task_info[0];
          params['project_info'][0]['assist_schedule_seq'] =
          taskInfo['assist_schedule_seq'] ? taskInfo['assist_schedule_seq'] : taskInfo['teamwork_plan_seq'];
          params['project_info'][0]['root_task_no'] = this.addSubProjectCardService?.firstLevelTaskCard?.task_no;
          if (params.project_info[0]?.liable_person_role_no === '') {
            params.project_info[0].liable_person_role_name = '';
          }
          Reflect.deleteProperty(params['project_info'][0], 'task_property');
          this.commonService.getInvData('lower.level.assist.task.info.update', params)
            .subscribe((res: any): void => {
              if (res?.data?.error_msg) {
                this.messageService.error(res.data.error_msg);
              }
              observable2.next(res);
            });
        } else if (source === Entry.projectChange) {
          if(params['project_info'][0]['liable_person_role_no'] === ''){
            params['project_info'][0]['liable_person_role_name'] = '';
          }
          params['project_info'][0]['change_version'] = change_version;
          this.commonService.getInvData('lower.level.project.change.task.info.update', params)
            .subscribe((res: any): void => {
              if (res?.data?.error_msg) {
                this.messageService.error(res.data.error_msg);
              }
              observable2.next(res);
            });
        }else {
          this.commonService.getInvData('lower.level.task.info.update', params)
            .subscribe((res: any): void => {
              const result = { success: true, error_msgs: [] };
              res.data.task_info.forEach(element => {
                if (element.task_name_mistake_message) {
                  result.error_msgs.push(element.task_name_mistake_message);
                }
              });
              const task_info = res.data?.task_info?.filter(item => item?.is_issue_task_card);
              if (task_info.length && source !== Entry.maintain) {
                this.addSubProjectCardService.updateTaskMainProject(task_info, '', true);
              }
              observable2.next(result);
            });
        }
      }
    });
  }
}