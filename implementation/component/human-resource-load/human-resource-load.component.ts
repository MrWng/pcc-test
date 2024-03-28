import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OpenWindowService } from '@athena/dynamic-ui';
import { TranslateService } from '@ngx-translate/core';
import { HumanResourceLoadService } from './human-resource-load.service';
import { CommonService } from '../../service/common.service';
import * as moment from 'moment';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';

export interface TreeNodeInterface {
  key: string;
  department_name?: string;
  personnel_name?: string;
  level?: number;
  expand?: boolean;
  address?: string;
  children?: TreeNodeInterface[];
  parent?: TreeNodeInterface;
}
@Component({
  selector: 'app-human-resource-load',
  templateUrl: './human-resource-load.component.html',
  styleUrls: ['./human-resource-load.component.less'],
  providers: [HumanResourceLoadService],
})
export class HumanResourceLoadComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() title: string = '';
  @Input() dateObject: object = { startDate: '', endDate: '' };
  @Input() peopleObject: object = { list: [], name: '' };
  @Output() changeMaskStatus = new EventEmitter();

  listOfMapData: any = [];
  titleList = [];
  yearList = [];
  monthList = [];
  department_data = [];
  loading: boolean = false;

  start_date = '';
  finish_date = '';
  departList = [];
  peopleList = [];
  departName = '';
  peopleName = '';
  dateType = '1';
  nzBordered = true;

  mapOfExpandedData: { [key: string]: TreeNodeInterface[] } = {};

  tableHeight = '260px';

  @ViewChild('mask', { static: false })
  private mask?: any;
  public mDown: string = '';
  public pieShow: Boolean = true;

  maskPosition: any = {
    top: document.body.clientHeight - 530,
    left: (document.body.clientWidth - 634) / 2,
    width: 684,
    height: 475,
  };
  constructor(
    private translateService: TranslateService,
    private changeRef: ChangeDetectorRef,
    private humanResourceLoadService: HumanResourceLoadService,
    private fb: FormBuilder,
    private openWindowService: OpenWindowService,
    public commonService: CommonService,
    public wbsTabsService: WbsTabsService
  ) {}

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isVisible?.currentValue === false) {
      this.departList = [];
      this.departName = '';
      this.peopleList = [];
      this.peopleName = '';
      this.start_date = '';
      this.finish_date = '';
      // this.dateType = "1"
      this.listOfMapData = [];
      this.titleList = [];
    }
    if (changes.dateObject && this.isVisible) {
      this.finish_date = changes.dateObject.currentValue.endDate;
      this.start_date = changes.dateObject.currentValue.startDate;
    }
    if (changes.peopleObject && this.isVisible) {
      this.peopleList = changes.peopleObject.currentValue.list;
      this.peopleName = changes.peopleObject.currentValue.name;
    }
    if (
      (changes.dateObject &&
        (changes.dateObject.currentValue.endDate !== changes.dateObject.previousValue?.endDate ||
          changes.dateObject.currentValue.startDate !==
            changes.dateObject.previousValue?.startDate)) ||
      changes.peopleObject
    ) {
      if (!changes.isVisible && this.isVisible) {
        this.getData();
      }
    }
    if (changes.isVisible?.previousValue === false && changes.isVisible?.currentValue === true) {
      this.getData();
    }
  }

  dateChange() {
    if (!this.department_data?.length || (!this.departList.length && !this.peopleList?.length)) {
      return;
    }
    const info =
      this.dateType === '1'
        ? this.department_data[0].date_info
        : this.dateType === '2'
          ? this.department_data[0].week_info
          : this.department_data[0].month_info;
    this.setTitle(info);
    this.setData(this.department_data);
  }

  getData() {
    this.loading = true;
    if (
      !this.start_date ||
      !this.finish_date ||
      (!this.departList.length && !this.peopleList.length)
    ) {
      this.loading = false;
      this.titleList = [];
      this.listOfMapData = [];
      return;
    }
    const params = {
      query_condition: [
        {
          datetime_s: this.start_date,
          datetime_e: this.finish_date,
          department_data: this.departList,
          personnel_info: this.peopleList,
        },
      ],
    };
    this.commonService.getInvData('human.resource.load.info.get', params).subscribe((res) => {
      if (res.code === 0) {
        this.loading = false;
        if (res.data.department_data?.length) {
          this.department_data = res.data.department_data;
          this.dateChange();
        } else {
          this.department_data = [];
          this.listOfMapData = [];
        }
        this.changeRef.markForCheck();
      }
    });
  }
  // 设置标题列数组
  setTitle(info) {
    const titleList = [],
      yearListAll = [],
      monthListAll = [];
    if (this.dateType === '1') {
      for (const i in info) {
        if (info.hasOwnProperty(i)) {
          let date = info[i].get_date;
          if (
            info[i].get_date &&
            new Date(info[i].get_date).getFullYear() === new Date().getFullYear()
          ) {
            date =
              new Date(info[i].get_date).getMonth() +
              1 +
              '/' +
              new Date(info[i].get_date).getDate();
          }
          const obj = {
            value: info[i].get_date,
            name: date,
          };
          titleList.push(obj);
        }
      }
      this.titleList = titleList;
    } else if (this.dateType === '2') {
      const yearList = {},
        monthList = {};
      for (const i in info) {
        if (info.hasOwnProperty(i)) {
          const arr = {
            value: info[i].query_date_year + info[i].query_date_week,
            name: info[i].query_date_week + this.translateService.instant(`dj-default-周`),
          };
          titleList.push(arr);
          if (yearList.hasOwnProperty(info[i].query_date_year)) {
            yearList[info[i].query_date_year]++;
          } else {
            yearList[info[i].query_date_year] = 1;
          }
          if (monthList.hasOwnProperty(info[i].query_date_year + ';' + info[i].query_date_month)) {
            monthList[info[i].query_date_year + ';' + info[i].query_date_month]++;
          } else {
            monthList[info[i].query_date_year + ';' + info[i].query_date_month] = 1;
          }
        }
      }
      for (const i in yearList) {
        if (yearList.hasOwnProperty(i)) {
          const arr = {
            value: i,
            name: i + this.translateService.instant(`dj-default-年`),
            colspan: yearList[i],
          };
          yearListAll.push(arr);
        }
      }
      for (const i in monthList) {
        if (monthList.hasOwnProperty(i)) {
          const arr = {
            value: i.split(';')[1],
            name: i.split(';')[1] + this.translateService.instant(`dj-default-月`),
            colspan: monthList[i],
          };
          monthListAll.push(arr);
        }
      }
      // ant表格由一列变成多列展示会少一列长度  添加延时展示重置长度
      this.yearList = [];
      this.monthList = [];
      this.titleList = [];
      setTimeout(() => {
        this.yearList = yearListAll;
        this.monthList = monthListAll;
        this.titleList = titleList;
        this.changeRef.markForCheck();
      }, 100);
    } else {
      const yearList = {};
      for (const i in info) {
        if (info.hasOwnProperty(i)) {
          const arr = {
            value: info[i].query_date_year + info[i].query_date_month,
            name: info[i].query_date_month + this.translateService.instant(`dj-default-月`),
          };
          titleList.push(arr);
          if (yearList.hasOwnProperty(info[i].query_date_year)) {
            yearList[info[i].query_date_year]++;
          } else {
            yearList[info[i].query_date_year] = 1;
          }
        }
      }
      for (const i in yearList) {
        if (yearList.hasOwnProperty(i)) {
          const arr = {
            value: i,
            name: i + this.translateService.instant(`dj-default-年`),
            colspan: yearList[i],
          };
          yearListAll.push(arr);
        }
      }
      // ant表格由一列变成多列展示会少一列长度  添加延时展示重置长度
      this.yearList = [];
      this.titleList = [];
      setTimeout(() => {
        this.yearList = yearListAll;
        this.titleList = titleList;
        this.changeRef.markForCheck();
      }, 100);
    }
    this.changeRef.markForCheck();
  }
  // 设置数据数组
  setData(data) {
    const listOfMapData = [];
    for (const i in data) {
      if (data.hasOwnProperty(i)) {
        const data_info =
          this.dateType === '1'
            ? data[i].date_info
            : this.dateType === '2'
              ? data[i].week_info
              : data[i].month_info;
        const list = [];
        if (data_info.length && data_info[0].project_info?.length) {
          for (const m in data_info[0].project_info) {
            if (data_info[0].project_info.hasOwnProperty(m)) {
              list.push({
                department_name: '',
                task_name:
                  data_info[0].project_info[m].task_name +
                  ' - ' +
                  data_info[0].project_info[m].project_name +
                  '[' +
                  data_info[0].project_info[m].project_no +
                  ']',
                personnel_name: '',
                project_no: data_info[0].project_info[m].project_no,
                task_no: data_info[0].project_info[m].task_no,
                key: String(Number(i) + 1) + '-' + m,
                totalHour: 0,
              });
            }
          }
        }
        const obj = {
          department_name: data[i].department_name,
          task_name: '',
          personnel_name: data[i].personnel_name,
          totalHour: 0,
          key: String(Number(i) + 1),
          children: list,
        };
        for (const n in data_info) {
          if (data_info.hasOwnProperty(n)) {
            if (this.dateType === '1') {
              obj[data_info[n].get_date] = data_info[n].total_plan_work_hours
                ? data_info[n].total_plan_work_hours
                : '';
            } else if (this.dateType === '2') {
              obj[data_info[n].query_date_year + data_info[n].query_date_week] = data_info[n]
                .total_plan_work_hours
                ? data_info[n].total_plan_work_hours
                : '';
            } else {
              obj[data_info[n].query_date_year + data_info[n].query_date_month] = data_info[n]
                .total_plan_work_hours
                ? data_info[n].total_plan_work_hours
                : '';
            }
            obj.totalHour = Number((obj.totalHour + data_info[n].total_plan_work_hours).toFixed(2));
            const project_info = data_info[n].project_info ? data_info[n].project_info : [];
            for (const j in project_info) {
              if (project_info.hasOwnProperty(j)) {
                for (const h in list) {
                  if (
                    project_info[j].project_no === list[h].project_no &&
                    project_info[j].task_no === list[h].task_no
                  ) {
                    list[h].totalHour = (
                      Number(list[h].totalHour) + Number(project_info[j].daily_plan_work_hours)
                    ).toFixed(2);
                    if (this.dateType === '1') {
                      list[h][data_info[n].get_date] = project_info[j].daily_plan_work_hours
                        ? project_info[j].daily_plan_work_hours
                        : '';
                    } else if (this.dateType === '2') {
                      list[h][data_info[n].query_date_year + data_info[n].query_date_week] =
                        project_info[j].daily_plan_work_hours
                          ? project_info[j].daily_plan_work_hours
                          : '';
                    } else {
                      list[h][data_info[n].query_date_year + data_info[n].query_date_month] =
                        project_info[j].daily_plan_work_hours
                          ? project_info[j].daily_plan_work_hours
                          : '';
                    }
                  }
                }
              }
            }
          }
        }
        listOfMapData.push(obj);
      }
    }

    listOfMapData.forEach((item) => {
      this.mapOfExpandedData[item.key] = this.convertTreeToList(item);
    });
    this.listOfMapData = listOfMapData;
    this.changeRef.markForCheck();
  }
  // 设置滚动距离
  getScroll() {
    // 设置滚动宽度 前几列固定宽度 后面平均分配 日120px 其余80px
    const width = this.dateType === '1' ? 120 : 75;
    const x = 414 + this.titleList.length * width;
    const scroll = { x: x + 'px', y: document.getElementById('humanContent').clientHeight - document.getElementById('humanFormList').clientHeight - 50 + 'px' };
    return scroll;
  }

  chooseDepart() {
    const paras = {};
    this.humanResourceLoadService
      .getOpenWindowDefineSd('transfer_FindAllDepartment', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          const operations = [
            {
              title: this.translateService.instant('dj-pcc-选择部门'),
              description: this.translateService.instant('dj-pcc-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-pcc-选择部门'),
                selectedFirstRow: false,
                multipleSelect: true,
                rowSelection: 'single',
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: this.commonService.content.executeContext,
                },
                buttons: [
                  {
                    title: this.translateService.instant('dj-default-确定'),
                    actions: [
                      {
                        category: 'UI',
                        backFills: [
                          { key: 'id', valueScript: "selectedObject['id']" },
                          { key: 'name', valueScript: "selectedObject['name']" },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ];
          const selectRow = this.fb.group({ project_no: [''] });
          const selectedRow = this.departName.split('、').map((item, index) => {
            return {
              id: this.departList[index]?.department_no,
              name: item,
            };
          });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.departList = data;
              const arr = [];
              this.departList.forEach((resData: any) => {
                resData.department_no = resData.id;
                arr.push(resData.name);
              });
              this.departName = arr.join('、');
              this.getData();
              this.changeRef.markForCheck();
            },
            '',
            selectedRow || []
          );
        }
      });
  }

  choosePeople() {
    const paras = {
      project_member_info: [
        {
          project_no: '',
        },
      ],
    };
    this.humanResourceLoadService
      .getOpenWindowDefine('employee.info.process', paras)
      .subscribe((res: any): void => {
        if (res.code === 0) {
          this.commonService.content.executeContext.pattern = 'com';
          this.commonService.content.executeContext.pageCode = 'task-detail';
          const operations = [
            {
              title: this.translateService.instant('dj-pcc-选择人员'),
              description: this.translateService.instant('dj-pcc-建议人工处理'),
              operate: 'openwindow',
              openWindowDefine: {
                title: this.translateService.instant('dj-pcc-选择人员'),
                selectedFirstRow: false,
                multipleSelect: true,
                rowSelection: 'single',
                enableAdvancedSearch: false,
                allAction: {
                  defaultShow: false,
                  dataSourceSet: res.data.dataSourceSet,
                  executeContext: this.commonService.content.executeContext,
                },
                buttons: [
                  {
                    title: this.translateService.instant('dj-default-确定'),
                    actions: [
                      {
                        category: 'UI',
                        backFills: [
                          { key: 'employee_no', valueScript: "selectedObject['employee_no']" },
                          { key: 'employee_name', valueScript: "selectedObject['employee_name']" },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ];
          const selectRow = this.fb.group({});
          const selectedRow = this.peopleName.split('、').map((item, index) => {
            return {
              employee_no: this.peopleList[index]?.personnel_no,
              employee_name: item,
            };
          });
          this.openWindowService.openWindow(
            selectRow,
            operations,
            [],
            '',
            '',
            (data: Array<any>) => {
              this.peopleList = data;
              const arr = [];
              this.peopleList.forEach((resData) => {
                resData.personnel_no = resData.employee_no;
                arr.push(resData.employee_name);
              });
              this.peopleName = arr.join('、');
              this.getData();
              this.changeRef.markForCheck();
            },
            '',
            selectedRow || []
          );
        }
      });
  }

  deleteDepart() {
    this.departList = [];
    this.departName = '';
    this.getData();
  }
  deletePeople() {
    this.peopleList = [];
    this.peopleName = '';
    this.getData();
  }
  startTimeChange($event: any): void {
    const date = $event ? moment($event).format('YYYY/MM/DD') : '';
    if (this.start_date !== date) {
      this.start_date = date;
      this.getData();
    }
  }
  endTimeChange($event: any): void {
    const date = $event ? moment($event).format('YYYY/MM/DD') : '';
    if (this.finish_date !== date) {
      this.finish_date = date;
      this.getData();
    }
  }
  disabledStartDate = (startValue: Date): boolean => {
    if (!startValue) {
      return false;
    }
    return moment(startValue).format('YYYY-MM-DD') > moment(this.finish_date).format('YYYY-MM-DD');
  };
  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue) {
      return false;
    }
    return moment(endValue).format('YYYY-MM-DD') < moment(this.start_date).format('YYYY-MM-DD');
  };
  getMaskPosition(): any {
    return {
      top: `${this.maskPosition.top}px`,
      left: `${this.maskPosition.left}px`,
      width: `${this.maskPosition.width}px`,
      height: `${this.maskPosition.height}px`,
    };
  }
  closeDialog(): void {
    this.departList = [];
    this.departName = '';
    this.peopleList = [];
    this.peopleName = '';
    this.start_date = '';
    this.finish_date = '';
    this.dateType = '1';
    this.listOfMapData = [];
    this.titleList = [];
    this.department_data = [];
    this.changeMaskStatus.emit(false);
  }
  mousemove(ev: MouseEvent, type: string): void {
    if (this.mDown) {
      this.maskPosition.top += ev.movementY;
      this.maskPosition.left += ev.movementX;
      ev.stopPropagation();
    }
  }
  mousedown(ev: any, type: string): void {
    ev?.path?.forEach((res) => {
      if (
        res.localName === 'input' ||
        (typeof res.className === 'string' && res.className?.includes('formList'))
      ) {
        type = '';
      }
    });
    this.mDown = type;
    ev.stopPropagation();
  }
  mouseup(ev: MouseEvent): void {
    this.mDown = '';
    ev.stopPropagation();
  }

  collapse(array: TreeNodeInterface[], data: TreeNodeInterface, $event: boolean): void {
    if (!$event) {
      if (data.children) {
        data.children.forEach((d) => {
          const target = array.find((a) => a.key === d.key)!;
          target.expand = false;
          this.collapse(array, target, false);
        });
      } else {
        return;
      }
    }
  }

  convertTreeToList(root: TreeNodeInterface): TreeNodeInterface[] {
    const stack: TreeNodeInterface[] = [];
    const array: TreeNodeInterface[] = [];
    const hashMap = {};
    stack.push({ ...root, level: 0, expand: false });

    while (stack.length !== 0) {
      const node = stack.pop()!;
      this.visitNode(node, hashMap, array);
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({ ...node.children[i], level: node.level! + 1, expand: false, parent: node });
        }
      }
    }

    return array;
  }

  visitNode(
    node: TreeNodeInterface,
    hashMap: { [key: string]: boolean },
    array: TreeNodeInterface[]
  ): void {
    if (!hashMap[node.key]) {
      hashMap[node.key] = true;
      array.push(node);
    }
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
