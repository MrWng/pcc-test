import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { Gantt } from 'dhtmlx-gantt';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { cloneDeep, multiple } from '@athena/dynamic-core';
import { GanntService } from './gannt.service';
import { Entry } from '../../service/common.service';

@Component({
  encapsulation: ViewEncapsulation.None, // 这里需要设置成None
  selector: 'app-dynamic-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GanntService],
})
export class DynamicGanttComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() ganttData: any;
  @Input() projectInfo: any;
  @Input() type: string;
  @Input() scales: string;
  @Input() criticalPath: Array<any>;
  @Input() source: Entry = Entry.card;
  @ViewChild('ganttBox', { static: false }) ganttChart: ElementRef;
  data: any;
  gantt: any;
  dayList = [
    this.translateService.instant('dj-default-一月'),
    this.translateService.instant('dj-default-二月'),
    this.translateService.instant('dj-default-三月'),
    this.translateService.instant('dj-default-四月'),
    this.translateService.instant('dj-default-五月'),
    this.translateService.instant('dj-default-六月'),
    this.translateService.instant('dj-default-七月'),
    this.translateService.instant('dj-default-八月'),
    this.translateService.instant('dj-default-九月'),
    this.translateService.instant('dj-default-十月'),
    this.translateService.instant('dj-default-十一月'),
    this.translateService.instant('dj-default-十二月'),
  ];
  TaskStatus = {
    '10': this.translateService.instant('dj-pcc-未开始'),
    '20': this.translateService.instant('dj-pcc-进行中'),
    '30': this.translateService.instant('dj-pcc-已完成'),
    '40': this.translateService.instant('dj-pcc-指定完成'),
    '50': this.translateService.instant('dj-pcc-暂停'),
    '60': this.translateService.instant('dj-pcc-签核中'),
  };

  private ganttChartServiceUrl: string = '';

  moveTime = {
    start_date: new Date(),
    end_date: new Date(),
  };

  constructor(
    public ganttService: GanntService,
    protected changeRef: ChangeDetectorRef,
    protected elementRef: ElementRef,
    private translateService: TranslateService,
    private configService: DwSystemConfigService
  ) {
    this.gantt = this.ganttService.getGanttInstance();
    this.configService.get('ganttChartServiceUrl').subscribe((url: string) => {
      this.ganttChartServiceUrl = url;
    });
  }

  ngOnInit(): void {}

  /**
   * 处理数据的任务状态和完成率
   */
  handleGanttData(): void {
    this.ganttData?.forEach((element) => {
      const task_status =
        this.source === Entry.projectChange ? element?.old_task_status : element?.task_status;
      element.new_task_status = this.TaskStatus[task_status];
      element.new_complete_rate = Number(element.complete_rate) ? Number(element.complete_rate) : 0;
      // s17: 任务状态是未开始，计划维护、进度追踪的项目甘特图内展示的完成率显示空白
      if (task_status === 10) {
        element.new_complete_rate = '';
      } else {
        if (element.new_complete_rate > 0 && element.new_complete_rate < 1) {
          element.new_complete_rate = `${multiple(element.new_complete_rate.toFixed(4), 100)}%`;
        } else {
          element.new_complete_rate = element.new_complete_rate + '%';
        }
      }
      element.task_member_display = (element.task_member_info || [])
        .map((item) => item.executor_name)
        .join(',');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.scales) {
      this.editConfig();
    }
    if (changes.ganttData) {
      this.handleGanttData();
      if (
        changes.ganttData.currentValue.find((item) => {
          return item.task_no === '0';
        })
      ) {
        changes.ganttData.currentValue.forEach((value) => {
          value.task_no = Number(value.task_no) + 1;
          value.upper_level_task_no = Number(value.upper_level_task_no) + 1;
        });
      }
      this.data = this.transformData(changes.ganttData.currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.initGantt();
  }

  /**
   * 初始化
   * */
  initGantt(): void {
    this.initI18n();
    this.initConfig();
    this.initPlugin();
    this.initTemplate();
    this.gantt.init(this.ganttChart.nativeElement);
    this.gantt.config.grid_width = 1100;
    this.gantt.config.columns.forEach((column) => {
      column.width = 80;
    });
    this.gantt.config.columns[0].width = 300;
    this.gantt.render();
    this.linksCriticalPath();
    this.gantt.parse(this.data);
  }

  /**
   * 把wbs的数据转换成gantt格式
   * @param data 数据入参
   * */
  transformData(data: any[]): any {
    let tempLinks = [];
    return data.reduce(
      (prev, cur): any => {
        const temp_data = {};
        const plan_finish_date = JSON.parse(JSON.stringify(cur.plan_finish_date));
        temp_data['id'] = cur.task_no;
        temp_data['text'] = cur.task_name;
        // 上阶任务编号 = 当前任务编号 表示是第一阶任务
        temp_data['parent'] = cur.upper_level_task_no === cur.task_no ? 0 : cur.upper_level_task_no;
        temp_data['start_date'] = cur.plan_start_date;
        temp_data['plan_start_date'] = cur.plan_start_date
          ? moment(cur.plan_start_date).format('YYYY-MM-DD')
          : '';
        temp_data['end_date'] = plan_finish_date
          ? moment(plan_finish_date).add(1, 'days').format('YYYY-MM-DD')
          : plan_finish_date;
        if (!cur.plan_start_date || !cur.plan_finish_date) {
          // 没有开始时间或者结束时间不导出那个时间线
          temp_data['not_visual'] = true;
        }
        // temp_data['end_date'] = cur.plan_finish_date;
        temp_data['progress'] = cur.complete_rate_gatter;
        // temp_data['open'] = cur.open === 1; // 修改SonarQube bug：下面有重复赋值，这行代码不生效
        // 默认是task，如果is_milepost === Y，则是里程碑，暂无project的情况
        temp_data['type'] = cur.is_milepost === 'Y' ? 'milestone' : 'task';
        temp_data['plan_finish_date'] = cur.plan_finish_date
          ? moment(cur.plan_finish_date).format('YYYY-MM-DD')
          : '';
        if (this.source !== Entry.projectChange) {
          temp_data['actual_start_date'] = cur.actual_start_date
            ? moment(cur.actual_start_date).format('YYYY-MM-DD')
            : '';
          temp_data['actual_finish_date'] = cur.actual_finish_date
            ? moment(cur.actual_finish_date).format('YYYY-MM-DD')
            : '';
        }
        temp_data['plan_work_hours'] = cur.plan_work_hours;
        temp_data['actual_work_hours'] = cur.actual_work_hours;
        temp_data['complete_rate'] = cur.complete_rate
          ? `${cur.complete_rate}%`
          : cur.complete_rate;
        temp_data['remaining_work_hours'] = cur.remaining_work_hours;
        temp_data['work_hours_difference'] = cur.work_hours_difference;
        temp_data['time_out_status'] = cur.time_out_status;
        temp_data['schedule_status'] = cur.schedule_status;
        temp_data['liable_person_department_name'] = cur.liable_person_department_name;
        temp_data['liable_person_name'] = cur.liable_person_name;
        temp_data['task_member_display'] = cur.task_member_display;
        temp_data['new_task_status'] = cur.new_task_status + '';
        if (this.source !== Entry.projectChange) {
          temp_data['overdue_days'] = cur.overdue_days;
          temp_data['total_work_hours'] = cur.total_work_hours + '';
          temp_data['new_complete_rate'] = cur.new_complete_rate + '';
          temp_data['remarks'] = cur.remarks;
        }
        temp_data['owner_id'] = this.getId(cur);
        temp_data['isCriticalPath'] = this.showCriticalPath(cur);
        temp_data['open'] = true;
        temp_data['unscheduled'] = cur.plan_start_date ? false : true;
        // 测试, 效果待定
        let actualDependency = [];
        if (this.source === Entry.projectChange) {
          actualDependency = cur.project_change_task_dep_info || [];
        } else {
          actualDependency = (cur.task_dependency_info || []).filter(
            (v) => v.after_task_no === cur.task_no
          );
        }
        if (actualDependency.length > 0) {
          const arr = [];
          actualDependency.forEach((s, actualIndex) => {
            arr.push({
              id: `${tempLinks.length + actualIndex + 1}`,
              source: s.before_task_no,
              target: cur.task_no,
              unique: s.before_task_no + '-' + cur.task_no,
              type: '1',
            });
          });
          tempLinks = [...prev.links, ...arr];
          return { data: [...prev.data, temp_data], links: [...prev.links, ...arr] };
        } else {
          return { data: [...prev.data, temp_data], links: [...prev.links] };
        }
      },
      { data: [], links: [] }
    );
  }

  // 判断是否为关键路径的点
  showCriticalPath(arr) {
    let isCriticalPath = false;
    for (const i in this.criticalPath) {
      if (
        this.criticalPath[i].source === arr.task_no ||
        this.criticalPath[i].target === arr.task_no
      ) {
        isCriticalPath = true;
      }
    }
    return isCriticalPath;
  }

  // 前后置任务关系是否为关键路径
  linksCriticalPath() {
    this.data.links.forEach((res) => {
      for (const i in this.criticalPath) {
        if (
          this.criticalPath[i].source === res.source &&
          this.criticalPath[i].target === res.target
        ) {
          res.color = 'red';
        }
      }
    });
  }

  /**
   *
   * @param taskCard 任务卡
   * @returns
   */
  getId(taskCard): number {
    const { isOverdue, task_status } = taskCard;
    let id;
    // 1 未逾期  2已逾期  3已完成已逾期  4已完成未逾期
    if (isOverdue) {
      id = task_status === 30 ? 3 : 2;
    } else {
      id = task_status === 30 ? 4 : 1;
    }
    return id;
  }

  workHoursDifferenceCss(task) {
    if (task.work_hours_difference < 0) {
      return "<div class='green'>" + task.work_hours_difference + '</div>';
    }
    if (task.work_hours_difference_rate > 0) {
      return "<div class='red'>" + task.work_hours_difference + '</div>';
    }
    if (task.actual_work_hours === 0) {
      return "<div class='normal'>" + task.work_hours_difference + '</div>';
    }
  }

  overdueDays(task) {
    if (task.overdue_days === 0) {
      return "<div class='green'>" + task.overdue_days + '</div>';
    }
    if (task.overdue_days < 0 && task.actual_finish_date !== '') {
      return "<div class='blue'>" + task.overdue_days + '</div>';
    }
    if (task.overdue_days > 0 && task.overdue_days <= 3) {
      return "<div class='yellow'>" + task.overdue_days + '</div>';
    }
    if (task.overdue_days > 3) {
      return "<div class='red'>" + task.overdue_days + '</div>';
    }
    if (task.overdue_days < 0 && task.actual_finish_date === '') {
      return "<div class='normal'>" + task.overdue_days + '</div>';
    }
  }

  /**
   * config相关参数
   * */
  initConfig(): void {
    // 读取通用配置
    Object.assign(this.gantt.config, this.ganttData?.gantt_config);
    this.gantt.serverList('staff', [
      {
        key: 1,
        label: '',
        backgroundColor: 'rgba(41,156,180,0.3)',
        backgroundColor1: 'rgba(41,156,180,1)',
        textColor: '#FFF',
      },
      {
        key: 2,
        label: '',
        backgroundColor: 'rgba(234,61,70,0.4)',
        backgroundColor1: 'rgba(234,61,70,1)',
        textColor: '#FFF',
      },
      {
        key: 3,
        label: this.translateService.instant('dj-default-已完成'),
        backgroundColor: 'rgba(155, 159, 197, 1)',
        backgroundColor1: 'rgba(155, 159, 197,1)',
        textColor: '#FF0000',
      },
      {
        key: 4,
        label: this.translateService.instant('dj-default-已完成'),
        backgroundColor: 'rgba(155, 159, 197, 1)',
        backgroundColor1: 'rgba(155, 159, 197,1)',
        textColor: '#FFF',
      },
    ]);
    this.gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
    this.gantt.config.duration_unit = 'hour';
    this.gantt.config.row_height = 23;
    this.gantt.config.grid_resize = true;
    this.gantt.config.order_branch_free = true;
    this.gantt.config.order_branch = 'marker';
    this.gantt.config.fit_tasks = true;
    this.gantt.config.min_duration = 24 * 60 * 60 * 1000;
    // 是否可编辑
    this.gantt.config.readonly = true;
    // }
    this.gantt.config.columns = [
      { name: 'text', tree: true, resize: true },
      { name: 'start_date', align: 'center', resize: true },
      { name: 'duration', align: 'center' },
      { name: 'add', width: 44 },
    ];
    if (this.type === 'multiple') {
      this.gantt.config.columns.forEach((column: any, index: number): void => {
        column.width = 10;
        if (column.name === 'start_date') {
          this.gantt.config.columns.splice(index, 1);
          // column.label = this.translateService.instant('dj-default-计划开始时间');
        }
      });
      this.gantt.config.columns.push(
        {
          name: 'plan_work_hours',
          label: this.translateService.instant('dj-default-预计工时'),
          align: 'center',
          resize: true,
        },
        {
          name: 'actual_work_hours',
          label: this.translateService.instant('dj-default-实际工时'),
          align: 'center',
          resize: true,
        },
        {
          name: 'complete_rate',
          label: this.translateService.instant('dj-default-完成率'),
          align: 'center',
          resize: true,
        },
        {
          name: 'remaining_work_hours',
          label: this.translateService.instant('dj-default-剩余工时'),
          align: 'center',
          resize: true,
        },
        {
          name: 'work_hours_difference',
          label: this.translateService.instant('dj-default-工时差异'),
          align: 'center',
          resize: true,
          template: this.workHoursDifferenceCss,
        },
        {
          name: 'time_out_status',
          label: this.translateService.instant('dj-default-超时状态'),
          align: 'center',
          resize: true,
        },
        {
          name: 'overdue_days',
          label: this.translateService.instant('dj-default-延迟天数'),
          align: 'center',
          resize: true,
          template: this.overdueDays,
        },
        {
          name: 'schedule_status',
          label: this.translateService.instant('dj-default-时程状态'),
          align: 'center',
          resize: true,
        },
        {
          name: 'liable_person_department_name',
          label: this.translateService.instant('dj-default-部门'),
          align: 'center',
          resize: true,
        },
        {
          name: 'liable_person_name',
          label: this.translateService.instant('dj-default-负责人'),
          align: 'center',
          resize: true,
        },
        {
          name: 'start_date',
          label: this.translateService.instant('dj-default-计划开始时间'),
          align: 'center',
          resize: true,
          hide: true,
        },
        {
          name: 'plan_start_date',
          label: this.translateService.instant('dj-default-计划开始时间'),
          align: 'center',
          resize: true,
        },
        {
          name: 'plan_finish_date',
          label: this.translateService.instant('dj-default-计划结束时间'),
          align: 'center',
          resize: true,
        },
        {
          name: 'actual_start_date',
          label: this.translateService.instant('dj-default-实际开始时间'),
          align: 'center',
          resize: true,
        },
        {
          name: 'actual_finish_date',
          label: this.translateService.instant('dj-default-实际结束时间'),
          align: 'center',
          resize: false,
        }
        // { name: 'liable_person_name', label: this.translateService.instant('dj-default-全选'), align: 'center' }
      );
    } else if (this.type === 'single') {
      this.gantt.config.columns.forEach((column: any, index: number): void => {
        // column.width = 10;
        if (column.name === 'start_date') {
          this.gantt.config.columns.splice(index, 1);
        }
      });
      this.gantt.config.columns.push(
        {
          name: 'liable_person_name',
          label: this.translateService.instant('dj-default-负责人'),
          align: 'center',
          resize: true,
        },
        {
          name: 'task_member_display',
          label: this.translateService.instant('dj-pcc-执行人'),
          align: 'center',
          resize: true,
          template: function (obj) {
            return (
              '<div title="' + obj.task_member_display + '">' + obj.task_member_display + '</div>'
            );
          },
        },
        {
          name: 'start_date',
          label: this.translateService.instant('dj-default-预计开始日'),
          align: 'center',
          resize: true,
          hide: true,
        },
        {
          name: 'plan_start_date',
          label: this.translateService.instant('dj-default-预计开始日'),
          align: 'center',
          resize: true,
        },
        {
          name: 'plan_finish_date',
          label: this.translateService.instant('dj-default-预计完成日'),
          align: 'center',
          resize: true,
        }
      );
      // 项目变更任务的甘特图，一共有这些字段【实际开始日、实际完成日、耗用总工时、任务完成率、报工说明、逾期天数 】不显示
      if (this.source !== Entry.projectChange) {
        this.gantt.config.columns.push(
          {
            name: 'actual_start_date',
            label: this.translateService.instant('dj-default-实际开始日'),
            align: 'center',
            resize: true,
          },
          {
            name: 'actual_finish_date',
            label: this.translateService.instant('dj-default-实际完成日'),
            align: 'center',
            resize: true,
          },
          {
            name: 'total_work_hours',
            label: this.translateService.instant('dj-default-耗用总工时'),
            align: 'center',
            resize: true,
          }
        );
      }
      this.gantt.config.columns.push({
        name: 'new_task_status',
        label: this.translateService.instant('dj-default-任务状态'),
        align: 'center',
        resize: true,
      });
      if (this.source !== Entry.projectChange) {
        this.gantt.config.columns.push(
          {
            name: 'new_complete_rate',
            label: this.translateService.instant('dj-default-任务完成率'),
            align: 'center',
            resize: true,
          },
          {
            name: 'remarks',
            label: this.translateService.instant('dj-default-报工说明'),
            align: 'center',
            resize: true,
            template: function (obj) {
              return '<div title="' + obj.remarks + '">' + obj.remarks + '</div>';
            },
          },
          {
            name: 'overdue_days',
            label: this.translateService.instant('dj-default-逾期天数'),
            align: 'center',
            resize: false,
            template: function (obj) {
              return obj.overdue_days !== 0 &&
                obj.overdue_days !== '0' &&
                obj.overdue_days !== '0天'
                ? obj.overdue_days
                : '';
            },
          }
        );
      }
    }
    this.gantt.config.columns.forEach((column: any, index: number): void => {
      column.width = 10;
      if (column.name === 'text') {
        column.label = this.translateService.instant('dj-default-任务名称');
      }
      if (column.name === 'duration') {
        this.gantt.config.columns.splice(index, 1);
      }
    });

    // 只读模式下去除添加列
    const addColumn = this.gantt.config.columns.find((res): any => {
      return res.name === 'add';
    });
    addColumn['hide'] = true;
    this.gantt.templates.grid_row_class =
      this.gantt.templates.task_row_class =
      this.gantt.templates.task_class =
        function (start, end, task) {
          const css = [];
          if (task.owner_id) {
            css.push('gantt_resource_task gantt_resource_' + task.owner_id);
          }
          if (task.isCriticalPath) {
            css.push('gantt_criticalPath');
          }
          return css.join(' ');
        };
    this.gantt.attachEvent(
      'onParse',
      function () {
        const styleId = 'DynamicGanttComponentStyles';
        let element = document.getElementById(styleId);
        if (!element) {
          element = document.createElement('style');
          element.id = styleId;
          document.querySelector('head').appendChild(element);
        }
        const html = [];
        const resources = this.serverList('staff');

        resources.forEach(function (r) {
          html.push(
            '.gantt_task_line.gantt_resource_' +
              r.key +
              '{' +
              'background-color:' +
              r.backgroundColor +
              '; ' +
              'color:' +
              r.textColor +
              ';' +
              'border:1px solid rgba(0,0,0,0)}'
          );
          html.push(
            '.gantt_task_line.gantt_resource_' +
              r.key +
              ' .gantt_task_progress{background-color:' +
              r.backgroundColor1 +
              ';}'
          );
        });
        html.push('.gantt_task_line.gantt_criticalPath{border:2px solid red;}');
        element.innerHTML = html.join('');
      },
      1
    );
    const that = this;
    // 拖动过程事件
    this.gantt.attachEvent(
      'onTaskDrag',
      function (id, mode, task, original) {
        // 拖动过程中当时间大于项目计划结束时间停止拖动
        if (
          moment(task.end_date).format('YYYY/MM/DD') >
          moment(that.projectInfo.plan_finish_date).format('YYYY/MM/DD')
        ) {
          task.end_date = new Date(
            moment(that.projectInfo.plan_finish_date).add(1, 'days').format('YYYY/MM/DD')
          );
        }
        // 拖动时间过程中计算拖到隔大于50% 计算整天（解决拉时间后拖动时间数据自动恢复的问题）
        let start_date, end_date;
        if (task.end_date.getHours() === 0 && task.end_date.getMinutes() === 0) {
          end_date = new Date(moment(task.end_date).format('YYYY/MM/DD'));
          start_date = new Date(moment(task.start_date).format('YYYY/MM/DD'));
        } else {
          if (task.start_date.getHours() === 0 && task.start_date.getMinutes() === 0) {
            end_date = new Date(moment(task.end_date).add(1, 'days').format('YYYY/MM/DD'));
            start_date = new Date(moment(task.start_date).format('YYYY/MM/DD'));
          } else {
            if (task.start_date.getHours() > 12) {
              end_date = new Date(moment(task.end_date).add(1, 'days').format('YYYY/MM/DD'));
              start_date = new Date(moment(task.start_date).add(1, 'days').format('YYYY/MM/DD'));
            } else {
              end_date = new Date(moment(task.end_date).format('YYYY/MM/DD'));
              start_date = new Date(moment(task.start_date).format('YYYY/MM/DD'));
            }
          }
        }
        that.moveTime = {
          start_date: start_date,
          end_date: end_date,
        };
      },
      1
    );
    // 拖动前判断任务不可编辑时间
    this.gantt.attachEvent(
      'onBeforeTaskDrag',
      function (id, mode, e) {
        // 任务状态>10只可以拖动结束时间 不可以拖动开始时间  >20 不可拖动
        const i = true;
        return i;
      },
      1
    );
    this.gantt.attachEvent(
      'onAfterTaskDrag',
      function (id, mode, e) {
        let date;
        // 拖动结束赋予拖动过程中记录的结果
        this.getTask(id).end_date = that.moveTime.end_date;
        this.getTask(id).start_date = that.moveTime.start_date;
        // 判断是否大于项目结束时间
        if (
          moment(this.getTask(id).end_date).format('YYYY/MM/DD') >
          moment(that.projectInfo.plan_finish_date).format('YYYY/MM/DD')
        ) {
          this.getTask(id).end_date = new Date(
            moment(that.projectInfo.plan_finish_date).add(1, 'days').format('YYYY/MM/DD')
          );
          date = new Date(
            moment(that.projectInfo.plan_finish_date).add(1, 'days').format('YYYY/MM/DD')
          );
        } else {
          date = JSON.parse(JSON.stringify(this.getTask(id).end_date));
        }
        this.getTask(id).plan_finish_date = moment(date).add(-1, 'days').format('YYYY-M-DD');
        // 这里去请求接口更新任务时间

        // 刷新gantt数据
        this.refreshData();
        // 获取拖动时间同级下时间范围
        const time = that.getTimeRang(this.getTask(id).parent, id);
        // 赋予所有父节点时间范围
        that.setParentTime(this.getTask(id).parent, time);
      },
      1
    );
    // 拖拽任务过程中拦截不可拖动的任务
    this.gantt.attachEvent(
      'onBeforeRowDragMove',
      function (id, parent, tindex) {
        // 已下发的和其父级不能拖动
        const i = true;
        return i;
      },
      1
    );
    // 拖拽任务结束时
    this.gantt.attachEvent(
      'onAfterTaskMove',
      function (id, mode, e) {
        // 获取拖拽任务结束后改变同级的时间范围
        for (const i in that.data.data) {
          if (that.data.data[i].id === id) {
            const time = that.getTimeRang(that.data.data[i].parent, 0);
            that.setParentTime(that.data.data[i].parent, time);
            that.data.data[i].parent = mode;
          }
        }
        // 这里请求接口 将改变了seq的和上级任务编号的的任务传入更新接口 参考onDrop方法调用task.base.info.update

        const time = that.getTimeRang(this.getTask(id).parent, id);
        // 赋予父级时间范围
        that.setParentTime(this.getTask(id).parent, time);
      },
      1
    );
    // 关闭灯箱功能
    this.gantt.attachEvent(
      'onBeforeLightbox',
      function (id) {
        return false;
      },
      1
    );
  }

  getTimeRang(parent, id) {
    const arr = {
      startDate: '',
      endDate: '',
    };
    if (parent === 0 && id !== 0) {
      arr.startDate = this.gantt.getTask(id).start_date;
      arr.endDate = this.gantt.getTask(id).end_date;
    } else {
      this.gantt.eachTask(function (task) {
        if (task.parent === parent) {
          if (
            task.start_date &&
            task.end_date &&
            moment(task.start_date).format('YYYY/MM/DD') !==
              moment(task.end_date).format('YYYY/MM/DD')
          ) {
            if (arr.startDate) {
              if (
                moment(task.start_date).format('YYYY/MM/DD') <
                moment(arr.startDate).format('YYYY/MM/DD')
              ) {
                arr.startDate = task.start_date;
              }
            } else {
              arr.startDate = task.start_date;
            }
            if (arr.endDate) {
              if (
                moment(task.end_date).format('YYYY/MM/DD') >
                moment(arr.endDate).format('YYYY/MM/DD')
              ) {
                arr.endDate = task.end_date;
              }
            } else {
              arr.endDate = task.end_date;
            }
          }
        }
      });
    }
    return arr;
  }

  setParentTime(id, time) {
    if (id !== 0) {
      const date = JSON.parse(JSON.stringify(time.endDate));
      const dates = JSON.parse(JSON.stringify(time.startDate));
      if (date) {
        this.gantt.getTask(id).end_date = new Date(date);
        this.gantt.getTask(id).plan_finish_date = moment(date).add(-1, 'days').format('YYYY-MM-DD');
      }
      if (dates) {
        this.gantt.getTask(id).start_date = new Date(dates);
      }
      this.gantt.refreshData();
      const times = this.getTimeRang(this.gantt.getTask(id).parent, id);
      this.setParentTime(this.gantt.getTask(id).parent, times);
    }
  }

  editConfig() {
    let scale_height, scales;
    const that = this;
    if (this.scales === 'week') {
      scale_height = 54;
      scales = [
        { unit: 'year', step: 1, format: '%Y' + this.translateService.instant('dj-default-年Y') },
        {
          unit: 'month',
          step: 1,
          format: function (date) {
            return that.dayList[moment(date).month()];
          },
        },
        { unit: 'week', step: 1, format: '%w' },
      ];
    } else {
      scale_height = 36;
      if (this.scales === 'day') {
        scales = [
          { unit: 'year', step: 1, format: '%Y' + this.translateService.instant('dj-default-年Y') },
          {
            unit: 'day',
            step: 1,
            format:
              '%n' +
              this.translateService.instant('dj-default-月M') +
              '%j' +
              this.translateService.instant('dj-default-日D') +
              '(%D)',
          },
        ];
      } else {
        scales = [
          { unit: 'year', step: 1, format: '%Y' },
          {
            unit: 'month',
            step: 1,
            format: function (date) {
              return that.dayList[moment(date).month()];
            },
          },
        ];
      }
    }
    this.gantt.config.scale_height = scale_height;
    // 设置时间维度
    this.gantt.config.scales = scales;
    this.gantt.render();
  }

  /**
   * plugin相关配置
   * */
  initPlugin(): void {
    const defaultPlugins = {
      tooltip: true,
      marker: true,
      critical_path: true,
    };
    // 读取插件配置
    this.gantt.plugins(Object.assign(defaultPlugins, this.ganttData?.gantt_plugins));
  }

  /**
   * template相关
   * */
  initTemplate(): void {
    const formatter = this.gantt.ext.formatters.durationFormatter({
      enter: 'day',
      store: 'hour',
      format: 'day',
      hoursPerDay: 24,
      hoursPerWeek: 40,
      daysPerMonth: 30,
      short: true,
    });

    // 设置tooltip的文本
    this.gantt.templates.tooltip_text = function (start: any, end: any, task: any): string {
      const html =
        '<b>Task:</b> ' +
        task.text +
        '<br/><b>Start:</b> ' +
        (task.plan_start_date ? this.tooltip_date_format(start) : '') +
        '<br/><b>End:</b> ' +
        task.plan_finish_date +
        '<br><b>Duration:</b> ' +
        formatter.format(task.duration);
      return html;
    };

    // 由于里程碑的持续时间为零，因此不会显示用task_text模板设置的标签，这里需要定义rightside_text或leftside_text模板以设置里程碑的文本标签
    // 如果直接return，所有的任务都添加右侧文本
    const gantt = this.gantt;
    this.gantt.templates.rightside_text = function (start: Date, end: Date, task: any): string {
      // 里程碑居右展示任务信息
      if (task.type === gantt.config.types.milestone) {
        return task.text;
      }
      // 过长文本居右展示 TODO

      return '';
    };

    // var dateToStr = gantt.date.date_to_str(gantt.config.task_date);
    // var markerId = gantt.addMarker({
    //   start_date: new Date("2021-07-02"), //a Date object that sets the marker's date
    //   css: "today", //a CSS class applied to the marker
    //   text: "今天", //the marker title
    //   title: dateToStr( new Date()) // the marker's tooltip
    // });
    // var markerIds = gantt.addMarker({
    //   start_date: new Date(this.projectInfo.actual_start_date), //a Date object that sets the marker's date
    //   css: "today_new", //a CSS class applied to the marker
    //   text: "启动项目", //the marker title
    //   title: dateToStr( new Date(this.projectInfo.actual_start_date)) // the marker's tooltip
    // });

    // 增加节点层级信息 TODO
  }

  /**
   * 多语言相关，设置多语言 cn中文，en英语，由于没有繁体环境所以自己根据英文环境自定义一个tw
   * */
  initI18n(): void {
    // 配置繁体中文环境，这里参考的是英语环境的配置
    const twLocaleConfig: any = {
      date: {
        month_full: [
          '一月',
          '二月',
          '三月',
          '四月',
          '五月',
          '六月',
          '七月',
          '八月',
          '九月',
          '十月',
          '十一月',
          '十二月',
        ],
        month_short: [
          '1月',
          '2月',
          '3月',
          '4月',
          '5月',
          '6月',
          '7月',
          '8月',
          '9月',
          '10月',
          '11月',
          '12月',
        ],
        day_full: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        day_short: ['日', '一', '二', '三', '四', '五', '六'],
      },
      labels: {
        new_task: '新任務',
        icon_save: '保存',
        icon_cancel: '取消',
        icon_details: '詳情',
        icon_edit: '編輯',
        icon_delete: '刪除',
        gantt_save_btn: '保存',
        gantt_cancel_btn: '取消',
        gantt_delete_btn: '刪除',
        confirm_closing: '您尚未保存任務，確定關閉嗎？', // Your changes will be lost, are you sure?
        confirm_deleting: '任務將永久刪除，請確認？',
        section_description: '描述',
        section_time: '持續時間',
        section_type: '類型',

        /* grid columns */
        column_wbs: 'WBS名稱',
        column_text: '任務名稱',
        column_start_date: '開始時間',
        column_duration: '持續時間',
        column_add: '',

        /* link confirmation */
        link: '鏈接',
        confirm_link_deleting: '鏈接將被刪除，請確認',
        link_start: ' (開始)',
        link_end: ' (結束)',

        type_task: '任務',
        type_project: '項目',
        type_milestone: '裏程碑',

        minutes: '分鐘',
        hours: '小時',
        days: '天',
        weeks: '周',
        months: '月',
        years: '年',

        /* message popup */
        message_ok: '確認',
        message_cancel: '取消',

        /* constraints */
        section_constraint: '約束',
        constraint_type: '約束類型',
        constraint_date: '約束日期',
        asap: '儘快完成',
        alap: '盡可能晚完成',
        snet: '開始不早于',
        snlt: '開始不晚於',
        fnet: '完成不早於',
        fnlt: '完成不晚於',
        mso: '必須開始在',
        mfo: '必須完成在',

        /* resource control */
        resources_filter_placeholder: '輸入以篩選',
        resources_filter_label: '隱藏空值',
      },
    };
    this.gantt.i18n.addLocale('tw', twLocaleConfig);
    // 读取Athena环境，设置甘特图环境
    const locale = sessionStorage.getItem('language');
    let ganttLocale: string;
    switch (locale) {
      case 'zh_TW':
        ganttLocale = 'tw';
        break;
      case 'zh_CN':
        ganttLocale = 'cn';
        break;
      case 'en_US':
        ganttLocale = 'en';
        break;
      default:
        break;
    }
    this.gantt.i18n.setLocale(ganttLocale);
  }

  ngOnDestroy(): void {
    this.gantt.config.columns = [
      { name: 'text', tree: true, width: 37, resize: true, min_width: 10 },
      { name: 'start_date', align: 'center', resize: true, width: 37, min_width: 10 },
      { name: 'duration', align: 'center', width: 37, resize: true, min_width: 10 },
      { name: 'add', width: 10, hide: true },
    ];
    const myGantt = Gantt.getGanttInstance();
    myGantt.destructor();
    this.gantt.clearAll();
    // gantt.destructor();
  }

  export_data(scales): void {
    const { project_set_name = '', project_name, project_no } = this.projectInfo;
    const backup_scales = this.gantt.config.scales;
    const columns = cloneDeep(this.gantt.config.columns);
    const columns2 = cloneDeep(this.gantt.config.columns);
    const backupsData = this.data;
    let scalesObj = null;
    switch (scales) {
      case 'month': {
        scalesObj = { unit: 'month', step: 1, format: '%n月, %Y年' };
        break;
      }
      case 'week': {
        scalesObj = { unit: 'week', step: 1, format: '%w周, %n月%Y年' };
        break;
      }
      case 'day': {
        scalesObj = { unit: 'day', step: 1, format: '%n月%j日(%D)' };
        break;
      }
      default: {
        scalesObj = { unit: 'day', step: 1, format: '%n月%j日(%D)' };
        break;
      }
    }
    // this.gantt.config.scales = [
    //   { unit: 'day', step: 1, format: '%n月%j日(%D)' }
    // ];
    this.gantt.config.scales = [scalesObj];
    this.gantt.config.smart_rendering = false;
    this.gantt.config.columns = columns.filter((item) => {
      if (item.name !== 'start_date') {
        if (['remarks', 'task_member_display'].includes(item.name)) {
          delete item.template;
        }
        return item;
      }
    });
    if (this.scales === 'week') {
      let newData = cloneDeep(this.data);
      newData.data = newData?.data?.map((item) => {
        const { start_date, plan_finish_date } = item;
        item.start_date = start_date
          ? moment(item.start_date).startOf('isoWeek').format('YYYY-MM-DD')
          : '';
        item.end_date = plan_finish_date
          ? moment(plan_finish_date).endOf('isoWeek').add(1, 'd').format('YYYY-MM-DD')
          : '';
        return item;
      });
      this.gantt.parse(newData);
    }
    if (this.scales === 'month') {
      let newData = cloneDeep(this.data);
      newData.data = newData?.data?.map((item) => {
        const { start_date, plan_finish_date } = item;
        item.start_date = start_date
          ? moment(item.start_date).startOf('month').format('YYYY-MM-DD')
          : '';
        item.end_date = plan_finish_date
          ? moment(plan_finish_date).endOf('month').add(1, 'd').format('YYYY-MM-DD')
          : '';
        return item;
      });
      this.gantt.parse(newData);
    }
    this.gantt.resetLayout();
    this.gantt?.exportToExcel({
      name: project_set_name
        ? `${project_set_name}-${project_no}(${project_name})-${this.translateService.instant(
            'dj-c-甘特图'
          )}.xlsx`
        : `${project_no}(${project_name})-${this.translateService.instant('dj-c-甘特图')}.xlsx`,
      date_format: 'YYYY-MM-DD',
      visual: 'base-colors',
      server: `${this.ganttChartServiceUrl}/gantt`,
    });
    this.gantt.config.smart_rendering = true;
    this.gantt.config.scales = backup_scales;
    this.gantt.config.columns = columns2;
    if (this.scales === 'week' || this.scales === 'month') {
      this.gantt.parse(this.data);
    }
    this.gantt.resetLayout();
  }

  export_data_pdf(): void {
    const { project_set_name = '', project_name, project_no } = this.projectInfo;
    const fileName =
      (project_set_name ? `${project_set_name}-` : '') +
      `${project_no}(${project_name})-${this.translateService.instant('dj-c-甘特图')}`;
    this.gantt.plugins({
      export_api: true,
    });
    this.gantt?.exportToPDF({
      name: fileName + '.pdf',
      header: `
      <style>
        .gantt_task_line.gantt_resource_1{background-color:rgba(41,156,180,0.3);border:1px solid rgba(0,0,0,0);}
        .gantt_task_line.gantt_resource_2{background-color:rgba(234,61,70,0.4);border:1px solid rgba(0,0,0,0);}
        .gantt_task_line.gantt_resource_3{background-color:rgba(155, 159, 197,1);border:1px solid rgba(0,0,0,0);}
        .gantt_task_line.gantt_resource_4{background-color:rgba(155, 159, 197,1);border:1px solid rgba(0,0,0,0);}
        .gantt_task_line.gantt_resource_1 .gantt_task_progress{background-color:rgba(41,156,180,1);}
        .gantt_task_line.gantt_resource_2 .gantt_task_progress{background-color:rgba(234,61,70,1);}
        .gantt_task_line.gantt_resource_3 .gantt_task_progress{background-color:rgba(155, 159, 197,1);}
        .gantt_task_line.gantt_resource_4 .gantt_task_progress{background-color:rgba(155, 159, 197,1);}
        .gantt_task_line.gantt_criticalPath{border:2px solid red;}
      </style>
      <h3 style='width:100%;height:60px;text-align:center;line-height:60px;'>${fileName}</h3>
      `,
      // footer:"<h6 style='color: #ddd;'>Bottom line</h6>",
      // date_format: 'YYYY-MM-DD',
      // skin:'terrace',
      raw: true,
      server: `${this.ganttChartServiceUrl}/gantt`,
    });
  }
}
