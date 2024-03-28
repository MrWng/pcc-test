import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../service/common.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { cloneDeep } from '@athena/dynamic-core';

@Injectable()
export class ListOfDepartmentService {
  uibotUrl: string;
  eocUrl: string;

  // 记录机制的content参数
  content: any;

  // 开窗所需参数
  executeContext: any;
  // 开窗定义
  OpenWindowDefine: any;

  smartDataUrl: string;

  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    protected translateService: TranslateService,
    public commonService: CommonService,
    public messageService: NzMessageService,
  ) {
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });
  }

  /**
   * 获取角色信息
   * @returns
   */
  getRoleList(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.commonService.queryCatalog().subscribe((res) => {
        const catalogList = res.map((o) => {
          return { id: o.id, name: o.name };
        });
        catalogList.unshift({ id: '#%#@%##', name: this.translateService.instant('dj-pcc-无角色') });
        resolve(catalogList);
      }, (err) => {
        this.messageService.error(this.translateService.instant('dj-pcc-获取角色失败'));
      });
    });
  }

  /**
   * 获取部门信息列表
   * @param list
   * @returns
   */
  getDepartmentList(list: any): any {
    const map = {};
    const groupData = [];
    list.forEach((element): void => {
      element.title = element.employee_name;
      element.empName = element.employee_name;
      element.empId = element.employee_no;
      element.deptName = element.department_name;
      element.deptId = element.department_no;
      element.isLeaf = true;
      if (!map[element.department_no]) {
        groupData.push({
          title: element.department_name,
          children: [element],
          deptId: element.department_no,
          deptName: element.deptName,
        });
        map[element.department_no] = element;
      } else {
        groupData.forEach((data): void => {
          if (data.deptId === element.department_no) {
            data.children.push(element);
          }
        });
      }
    });
    groupData.forEach((res): void => {
      const len = res.children.length;
      res.len = res.children.length;
      res.children.forEach((data): void => {
        data.len = len;
      });
    });
    return groupData;
  }

  /**
 * 按照角色、部门分组获取已选人员
 * @param rolelist 角色分组
 * @param disabledList 被关联的人员信息列表
 * @param list 已经被提交的选择的人员列表
 * @returns
 */
  getSelectList(rolelist: any, disabledList: any, list: any): any {
    list.forEach(target => {
      const { employee_no: empId, department_no: deptId, role_no, role_name } = target;
      target.role_name = target.role_name ? target.role_name : this.translateService.instant('dj-pcc-无角色');
      const roleTarget = rolelist?.find(o => (o.key === role_no));
      const deTarget = roleTarget?.children?.find(o => (o.deptId === deptId));
      target.len = deTarget?.children?.length;
      target.empId = empId;
      target.empName = target.employee_name;
      target.deptId = deptId;
      target.deptName = target.department_name;
      // 禁用已选人员中的被关联的人员
      target.disableCheckbox =
        disabledList.find(o => o.role_no === role_no && o.employee_no === empId && o.department_no === deptId) ? true : false;
    });
    return this.getRoleTreeList(list);
  }

  getRoleTreeList(arr): any {
    const treeGroups = arr.reduce((groups, item) => {
      const groupIndex = groups?.findIndex(group => group.role_no === item.role_no);
      if (groupIndex !== -1) {
        groups[groupIndex]?.list?.push(item);
      } else {
        groups.push({ role_no: item.role_no, role_name: item.role_name, list: [item] });
      }
      return groups;
    }, []);
    let result = treeGroups.map(group => {
      // 获取所有部门的编号数组
      const deptIDs = group.list.map(item => item.deptId);
      // 去重
      const distinctNames = [...new Set(deptIDs)];
      // 根据部门分组并放到对应的角色下边
      const deptGroups = distinctNames.map(deptId => {
        const list = group.list.filter(item => item.deptId === deptId);
        const len = list[0].len ?? list.children;
        return { role_no: group.role_no, deptId, list, deptName: list[0]?.deptName, len };
      });
      return { role_no: group.role_no, role_name: group.role_name, deptGroups };
    });
    const targetIndex = result.findIndex(o => o.role_no === '#%#@%##');
    if (targetIndex !== -1) {
      const newArray = [result[targetIndex], ...result.slice(0, targetIndex), ...result.slice(targetIndex + 1)];
      result = newArray;
    }
    return result;
  }


  mergeUserLists(list: any): any {
    const map = {};
    const groupData = [];
    list.forEach((element): void => {
      element.key = element.department_no + element.employee_no;
      element.title = element.employee_name;
      element.empName = element.employee_name;
      element.empId = element.employee_no;
      element.deptName = element.department_name;
      element.deptId = element.department_no;
      if (!map[element.department_no]) {
        groupData.push({
          key: element.department_no,
          title: element.department_name,
          expanded: true,
          children: [element],
        });
        map[element.department_no] = element;
      } else {
        groupData.forEach((data): void => {
          if (data.key === element.department_no) {
            data.children.push(element);
          }
        });
      }
    });
    groupData.forEach((res): void => {
      const len = res.children.length;
      res.children.forEach((data): void => {
        data.len = len;
      });
    });
    return groupData;
  }

  // 合并user数据
  mergeUserList(list: any): any {
    const map = {};
    const groupData = [];
    list.forEach((element): void => {
      if (!map[element.origin.deptId]) {
        if (!element.origin.children || !element.origin.children.length) {
          groupData.push({
            deptId: element.origin.deptId,
            deptName: element.origin.deptName,
            len: element.origin.len,
            list: [element.origin],
          });
          map[element.origin.deptId] = element.origin;
        } else {
          groupData.push({
            deptId: element.origin.children[0].deptId,
            deptName: element.origin.children[0].deptName,
            len: element.origin.children[0].len,
            list: element.origin.children,
          });
        }
      } else {
        groupData.forEach((data): void => {
          if (data.deptId === element.origin.deptId) {
            data.list.push(element.origin);
          }
        });
      }
    });
    return groupData;
  }
  // 合并user数据
  resetPersonTree(nodeList: any): any {
    const personTree = [];
    nodeList.forEach(node => {
      // 选中的如果是角色，无角色添加在首位其他添加到末位
      if (node.level === 0) {
        if (node.key === '#%#@%##') {
          personTree.unshift(cloneDeep(node.origin));
        } else {
          personTree.push(cloneDeep(node.origin));
        }
      } else {
        const roleItem = personTree.find(o => o.role_no === node.origin.role_no);
        // 选中的是部门,有角色就直接在deptGroups添加，无角色就生成角色
        if (node.level === 1) {
          if (roleItem) {
            roleItem.deptGroups.push(cloneDeep(node.origin));
          } else {
            if (node.origin.role_no === '#%#@%##') {
              personTree.unshift({ role_no: node.origin.role_no, role_name: node.origin.role_name, deptGroups: [cloneDeep(node.origin)] });
            } else {
              personTree.push({ role_no: node.origin.role_no, role_name: node.origin.role_name, deptGroups: [cloneDeep(node.origin)] });
            }
          }
        }
        // 选中的是人员
        if (node.level === 2) {
          if (roleItem) {
            const deptItem = roleItem.deptGroups?.find(o => o.deptId === node.origin.deptId);
            // 如果有该部门
            if (deptItem) {
              deptItem.list.push(cloneDeep(node.origin));
            } else {
              // 如果没有该部门
              roleItem.deptGroups.push({
                role_no: node.origin.role_no,
                role_name: node.origin.role_name,
                deptId: node.origin.deptId,
                deptName: node.origin.deptName,
                len: node.origin.len,
                list: [cloneDeep(node.origin)]
              });
            }
          } else {
            // 已选的人员中不存在这个角色和部门的信息
            if (node.origin.role_no === '') {
              personTree.unshift(this.getDeptGroupsTemplate(cloneDeep(node.origin)));
            } else {
              personTree.push(this.getDeptGroupsTemplate(cloneDeep(node.origin)));
            }
          }
        }
      }
    });
    return personTree;
  }


  /**
   * 获取部门的必备字段
   * @param o
   * @returns
   */
  getDeptGroupsTemplate(o): any {
    return {
      role_no: o.role_no,
      role_name: o.role_name,
      deptGroups: [{
        role_no: o.role_no,
        role_name: o.role_name,
        deptId: o.deptId,
        deptName: o.deptName,
        len: o.len,
        list: [o]
      }]
    };
  }

  mergeUserStartList(list: any): any {
    const map = {};
    const groupData = [];
    list.forEach((element): void => {
      if (!map[element.deptId]) {
        groupData.push({
          deptId: element.deptId,
          deptName: element.deptName,
          len: element.len,
          list: [element],
        });
        map[element.deptId] = element;
      } else {
        groupData.forEach((data): void => {
          if (data.deptId === element.deptId) {
            data.list.push(element);
          }
        });
      }
    });
    return groupData;
  }
}
