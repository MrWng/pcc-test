/**
 * @file 负责人 & 执行人字段逻辑处理
 * @createDate 2022/10/9
 */
import { Injectable } from '@angular/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { observable, Observable } from 'rxjs';
import { debounceTime, pluck } from 'rxjs/operators';
import { WbsTabsService } from '../../wbs-tabs/wbs-tabs.service';
import { AddSubProjectCardService } from '../add-subproject-card.service';
import { ICheckPersonLiable, IPersonListItem, ISetPeopleList } from '../types/liable-person';

@Injectable()
export class LiablePersonService {

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    public commonService: CommonService,
    public wbsTabsService: WbsTabsService,
  ) { }

  /**
   * 获取参与人员
   * @param project_no 项目编号
   * @param personList 缓存的数据
   * @returns Observable<ISetPeopleList >
   */
  getSelectPersonList(project_no: string, personList = []): Observable<ISetPeopleList> {
    return new Observable((observable) => {
      // if (personList.length) {
      //   const peopleList = this.setPeopleList(personList);
      //   observable.next({ ...peopleList });
      // } else {
      const params = { project_member_info: [{ project_no: '' }] };
      this.commonService.getInvData('employee.info.process', params).subscribe((res: any): void => {
        if (res.code === 0 && res.data.project_member_info && res.data.project_member_info.length) {
          const list = res.data.project_member_info;
          const peopleList = this.setPeopleList(list);
          observable.next({ ...peopleList });
        } else {
          observable.next();
        }
      });
      // }
    });
  }

  /**
   * 将人员按照部门分类
   * @param list 所有人员
   * @returns ISetPeopleList
   */
  setPeopleList(list): ISetPeopleList {
    let liable_person_code_data: any = null;
    const liable_person_code_dataList: any[] = [];
    const originPersonList: any[] = [];
    const task_member_infoList: any[] = [];
    let isHasPerson = false;
    const currentCardInfo = this.addSubProjectCardService.currentCardInfo;
    const { liable_person_code, liable_person_department_code } = this.addSubProjectCardService.validateForm.getRawValue();

    list.forEach((listItem) => {
      const { department_no, department_name, employee_no, user_id, employee_name } = listItem;
      const personListItem: IPersonListItem = {
        deptId: department_no,
        deptName: department_name,
        id: employee_no,
        userId: user_id,
        name: employee_name,
        taskDisabled: false,
        check: !!this.addSubProjectCardService.currentCardInfo['task_member_info']?.filter(item => item.executor_no === employee_no).length
      };

      /** 如果是可编辑状态 员工编号和部门编号在列表里，就禁用 */
      if (currentCardInfo.someEdit) {
        personListItem.taskDisabled = currentCardInfo?.task_member_info?.some(infoItem => employee_no === infoItem.executor_no && department_no === infoItem.executor_department_no);
      }
      originPersonList.push(personListItem);

      /** 下面大概意思是循环的时候，如果发现是当前负责人和部门，就默认禁用 */
      if (employee_no === liable_person_code && department_no === liable_person_department_code) {
        personListItem.isSelected = true;
        isHasPerson = true;
        liable_person_code_data = personListItem;
      }
    });

    /** 如果在列表里没有找到传进来的部门，就把传进来的部门也加入到列表中 */
    if (!isHasPerson && currentCardInfo.liable_person_code) {
      const dataItem = {
        deptId: currentCardInfo.liable_person_department_code,
        deptName: currentCardInfo.liable_person_department_name,
        id: currentCardInfo.liable_person_code,
        name: currentCardInfo.liable_person_name,
        taskDisabled: true,
      };

      liable_person_code_data = dataItem;
      liable_person_code_dataList.push(dataItem);
    }

    currentCardInfo?.task_member_info?.forEach((menberListItem: any): void => {
      const { executor_department_no, executor_department_name, executor_name, executor_no } = menberListItem;
      const infoListItem = {
        deptId: executor_department_no,
        deptName: executor_department_name,
        name: executor_name,
        id: executor_no,
        bigId: executor_department_no + ';' + executor_no,
        taskDisabled: false,
      };
      task_member_infoList.push(infoListItem);
    });

    return {
      list,
      liable_person_code_data,
      liable_person_code_dataList,
      originPersonList,
      task_member_infoList,
    };
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
   * html  负责人增加授权检查
   * @param data 选中的数据 [array|object]
   */
  personLiableExecutorVerification(data: any): Promise<ICheckPersonLiable> {
    // sprint4.5 auth.employee.info.check==>bm.pisc.auth.employee.info.check

    return this.commonService.getInvData('bm.pisc.auth.employee.info.check', {
      employee_info: [{ employee_no: data.id, employee_name: data.name }],
    }).pipe(pluck('data')).toPromise();
  }

  /**
   * TODO：负责人 & 执行人 值改变之后调用
   */
  changeMaskData(task_member_infoList: any, personList: any) {
    if (
      this.addSubProjectCardService.validateForm.getRawValue().liable_person_code ||
      this.addSubProjectCardService.validateForm.getRawValue().task_member_info?.length
    ) {
      const arr = [];
      const arrName = [];
      if (this.addSubProjectCardService.validateForm.getRawValue().liable_person_code) {
        arr.push({
          personnel_no: this.addSubProjectCardService.validateForm.getRawValue().liable_person_code,
        });
        arrName.push(this.addSubProjectCardService.validateForm.getRawValue().liable_person_name);
      }
      if (this.addSubProjectCardService.validateForm.getRawValue().task_member_info?.length) {
        this.addSubProjectCardService.validateForm.getRawValue().task_member_info.forEach((res) => {
          let hasPeople = false;
          for (const i in task_member_infoList) {
            if (task_member_infoList[i].bigId === res) {
              hasPeople = true;
              arr.push({ personnel_no: task_member_infoList[i].id });
              arrName.push(task_member_infoList[i].name);
            }
          }
          if (!hasPeople) {
            for (const i in personList) {
              if (personList.hasOwnProperty(i)) {
                const list = personList[i].list;
                for (const n in list) {
                  if (list[n].bigId === res) {
                    arr.push({ personnel_no: list[n].id });
                    arrName.push(list[n].name);
                  }
                }
              }
            }
          }
        });
      }
      return {
        list: arr,
        name: arrName.join('、'),
      };
    }
  }

  /**
   * 人员同值，日期同值
   * @param type
   * @returns
   */
  // setSameValue(type, this.wbsService.project_no, this.source, this.task_member_info)
  setSameValue(project_no, source, task_member_info, taskCategoryType): Observable<any> {
    return new Observable(observable => {
      const currentCardInfo = this.addSubProjectCardService.currentCardInfo;
      const {
        task_no,
        liable_person_code,
        liable_person_name,
        liable_person_department_code,
        liable_person_department_name
      } = this.addSubProjectCardService.validateForm.getRawValue();
      if ((currentCardInfo.task_status !== '10' && source === Entry.card) || this.addSubProjectCardService.buttonType !== 'EDIT') {
        observable.next(false);
        return;
      }
      let params: any = {};
      const taskMemberInfo: Array<string> = this.addSubProjectCardService.validateForm.getRawValue().task_member_info;
      // 项目编号，任务编号，负责人编号，执行人编号
      params = {
        site_no: '',
        enterprise_no: '',
        sync_steady_state: this.wbsTabsService.hasGroundEnd,
        project_info: [{
          project_no,
          task_no,
          liable_person_name,
          liable_person_code,
          liable_person_department_code,
          liable_person_department_name,
          task_member_info,
          task_category: taskCategoryType,
          task_property: source === Entry.maintain ? '2' : '1',
        }],

      };
      if (liable_person_code || taskMemberInfo?.length) {
        this.commonService
          .getInvData('lower.level.task.info.update', params)
          .pipe(debounceTime(1000))
          .subscribe((res: any): void => {
            const result = {
              success: true,
              error_msgs: []
            };
            res.data.task_info.forEach(element => {
              if (element.task_name_mistake_message
              ) {
                result.error_msgs.push(element.task_name_mistake_message
                );
              }
            });
            const task_info = res.data?.task_info?.filter(item => item?.is_issue_task_card);
            if (task_info.length && source !== Entry.maintain) {
              this.addSubProjectCardService.updateTaskMainProject(task_info, '', true);
            }
            observable.next(result);
          }, err => {
            console.log('lower.level.task.info.update--err');
            observable.next(false);
          });
      }
    });
  }
}
