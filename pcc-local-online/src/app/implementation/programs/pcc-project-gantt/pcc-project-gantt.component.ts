import { Component, Input, OnInit, ChangeDetectorRef, ElementRef,
  Output, EventEmitter, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DwFormGroup, DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicTableModel,
  DynamicFormLayoutService, DynamicFormValidationService } from '@athena/dynamic-core';
import { DynamicPccProjectGanttModel } from '../../model/pcc-project-gantt/pcc-project-gantt.model';
import { PccProjectGanttService } from './pcc-project-gantt.service';
import { CommonService } from '../../service/common.service';
import { GridApi } from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@Component({
  encapsulation: ViewEncapsulation.None, // 这里需要设置成None
  selector: 'app-pcc-project-gantt',
  templateUrl: './pcc-project-gantt.component.html',
  styleUrls: ['./pcc-project-gantt.component.less'],
  providers: [PccProjectGanttService, CommonService]
})

/**
 * 项目计划维护
 */
export class PccProjectGanttComponent extends DynamicFormControlComponent implements OnInit, AfterViewInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccProjectGanttModel;
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();
  @ViewChild('ganttContainer', { static: true }) ganttContainer: ElementRef;

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];

  formGroup: DwFormGroup;
  gridApi: GridApi;
  columnOptions: any[] = [];
  columnApi: any;
  isDamageRowData = [];
  timer:any;

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

  // 甘特图时矩：day、week、month
  scales: string = 'day';
  gantt: any;
  data: any = null;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public commonService: CommonService,
    public pccProjectGanttService: PccProjectGanttService,
    private translateService: TranslateService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
    this.gantt = this.pccProjectGanttService.getGanttInstance();
  }

  ngOnInit(): void {
  }
  ngOnDestroy() {
    clearInterval(this.timer)
  }

  ngAfterViewInit() {
    try {
      // 强依赖平台dom,如果平台dom结构变动，这边也需要更改
      const mainWrapEle = document.getElementsByClassName('report-semi-cust-container')[0];
      if(mainWrapEle){
        document.getElementById('pcc-projects-gantt').style.height = mainWrapEle.clientHeight - 60 + 'px'
        const resizeObserver = new ResizeObserver(entries => {
          document.getElementById('pcc-projects-gantt').style.height = entries[0].contentRect.height - 60 + 'px'
        })
        resizeObserver.observe(mainWrapEle);
      }
    }catch (e) {
      console.log(e)
    }


    this.initGanttConfig();
    this.gantt.plugins({
      marker: true,
      tooltip: false
    });

    this.initTemplate();

    this.gantt.init(this.ganttContainer.nativeElement);

    const params = this.group.value?.parameterData?.query_condition;
    if (params && params.length) {
      this.commonService.getInvData('multi.project.gantt.chart.info.get', {query_condition: params}).subscribe((res): void => {
        if (res.data?.project_info && res.data?.project_info.length) {
          this.data = this.transformGanttData(res.data?.project_info);
          this.gantt.parse({data: this.data});
          this.timer = setInterval(()=>{this.gantt.render();console.log(12123)},3000)

        } else {
          const div = document.createElement('div');
          div.innerHTML = this.translateService.instant(`dj-c-${'暂无数据'}`);
          div.className = 'no-data-box';
          const gantt_grid = document.getElementsByClassName('gantt-chart-pcc-projects-gantt');
          if (gantt_grid && gantt_grid.length) {
            gantt_grid[length - 1].appendChild(div);
          }
          this.gantt.render();

        }
      });
    }
  }

  /**
   * 初始化甘特图配置
   */
  initGanttConfig(): any {
    const that = this;
    this.gantt.config.date_format = '%Y/%m/%d';
    this.gantt.config.row_height = 30;
    this.gantt.config.grid_resize = true;
    this.gantt.config.readonly = true;
    this.gantt.config.smart_rendering = true;
    this.gantt.config.scales = [
      { unit: 'year', step: 1, format: '%Y' + that.translateService.instant('dj-default-年Y') },
      {
        unit: 'day', step: 1,
        format: '%n' + that.translateService.instant('dj-default-月M') + '%j' + that.translateService.instant('dj-default-日D') + '(%D)'
      },
    ];

    this.gantt.config.columns = [
      {
        name: 'project',
        label: that.translateService.instant(`dj-pcc-${'项目/任务'}`),
        tree: true,
        width: '130',
        align: 'left',
        resize: true,
        template: function (obj) {
          let strName = '';
          // 代表第一级
          if (obj.$level === 0) {
            // 由后端拼接（project_no[project_name]）
            strName = obj.project_name;
          } else {
            if (obj.project_stage_name && !obj.task_no) {
              // 任务的上阶
              strName = obj.project_stage_name;
            } else {
              // 单独一个任务
              strName = obj.task_name;
            }
          }
          return strName;
        },
      },
      {
        name: 'name',
        label: that.translateService.instant(`dj-pcc-${'项目/任务负责人'}`),
        width: '100',
        align: 'center',
        resize: true,
        template: function (obj: any) {
          let strName = '';
          // 代表第一级
          if (obj.$level === 0 || obj.$level === 2) {
            strName = obj.liable_person_name;
          }
          return strName;
        },
      },
      {
        name: 'task_start_date',
        label: that.translateService.instant(`dj-pcc-${'开始时间'}`),
        width: '80',
        align: 'center',
        resize: true,
        template: function (obj) {
          if (obj.$level !== 1) {
            return obj.task_start_date ? that.newDateByFormat('yyyy-MM-dd', obj.task_start_date) : '';
          }
        },
      },
      {
        name: 'task_end_date',
        label: that.translateService.instant(`dj-pcc-${'结束时间'}`),
        width: '80',
        align: 'center',
        resize: true,
        template: function (obj) {
          if (obj.$level !== 1) {
            return obj.task_end_date ? that.newDateByFormat('yyyy-MM-dd', obj.task_end_date) : obj.task_end_date;
          }
        },
      },
      {
        name: 'days',
        label: this.translateService.instant(`dj-pcc-${'天数'}`),
        width: '30',
        align: 'center',
        resize: true,
        template: function (obj) {
        // 代表第一级
          if (obj.$level === 1) {
            return '';
          } else {
            return obj.days;
          }
        },
      },
      {
        name: 'customer_name',
        label: that.translateService.instant(`dj-pcc-${'客户名称'}`),
        width: '50',
        align: 'center',
        resize: true,
        template: function (obj) {
        // 代表第一级
          if (obj.$level === 1) {
            return '';
          } else {
            return obj.customer_name;
          }
        },
      },
      {
        name: 'plan_shipping_date',
        label: that.translateService.instant(`dj-pcc-${'预计出货日'}`),
        width: '80',
        align: 'center',
        resize: true,
        template: function (obj) {
        // 代表第一级
          if (obj.$level === 0) {
            return obj.plan_shipping_date ? that.newDateByFormat('yyyy-MM-dd', obj.plan_shipping_date) : obj.plan_shipping_date;
          }
        },
      },
      {
        name: 'project_type_name',
        label: that.translateService.instant(`dj-pcc-${'项目类型'}`),
        width: '80',
        align: 'center',
        resize: true,
        template: function (obj) {
        // 代表第一级
          if (obj.$level === 0) {
            return obj.project_type_name;
          }
        },
      },
      {
        name: 'project_status',
        label: that.translateService.instant(`dj-pcc-${'项目状态'}`),
        width: '50',
        align: 'center',
        resize: true,
        template: function (obj) {
        // 代表第一级
          if (obj.$level === 0) {
            let status = '';
            switch (obj.project_status) {
              case '10': {
                status = that.translateService.instant('dj-default-未开始');
                break;
              }
              case '20': {
                status = that.translateService.instant('dj-pcc-签核中');
                break;
              }
              case '30': {
                status = that.translateService.instant('dj-default-进行中');
                break;
              }
              case '40': {
                status = that.translateService.instant('dj-default-已结案');
                break;
              }
              case '50': {
                status = that.translateService.instant('dj-default-暂停');
                break;
              }
              case '60': {
                status = that.translateService.instant('dj-pcc-指定结案');
                break;
              }
              default: {
                status = '';
                break;
              }
            }
            return status;
          }
        },
      },
      {
        name: 'special_information',
        label: that.translateService.instant(`dj-pcc-${'特别资讯'}`),
        width: '100',
        align: 'center',
        resize: true,
        template: function (obj) {
        // 代表第一级
          if (obj.$level < 1) {
            return '<div title="' + obj.special_information + '">' + obj.special_information + '</div>';
          }
        },
      },
      {
        name: 'complete_rate',
        label: that.translateService.instant(`dj-default-实际完成率`),
        width: '100',
        align: 'center',
        resize: true,
        template: function (obj) {
          if (typeof obj.complete_rate === 'number' && obj.kind && obj.kind !== '1') {
            return `${parseFloat((obj.complete_rate*100).toFixed(2))}%`;
          }
        },
      },
      {
        name: 'signals',
        label: this.translateService.instant(`dj-pcc-${'信号'}`),
        width: '30',
        align: 'right',
        resize: true,
        template: function (obj) {
          // obj.parent === '0'，第一级
          if ((obj.parent === '0') && (obj.signals)) {
            let color = '';
            switch (obj.signals) {
              case 'G': {
                color =  'green';
                break;
              }
              case 'Y': {
                color =  'yellow';
                break;
              }
              case 'R': {
                color =  'red';
                break;
              }
              case 'E': {
                color =  'grey';
                break;
              }
              default: {
                color = '';
              }
            }
            return '<div class="color ' + color + '"></div>';
          }
        },
      },
      {
        name: 'kind',
        label: that.translateService.instant(`dj-pcc-${'计划/实际'}`),
        width: '50',
        align: 'center',
        resize: true,
        template: function (obj) {
        // 代表第一级
          if ((obj.$level > 1) && obj.kind) {
            return obj.kind === '1' ? that.translateService.instant(`dj-pcc-计划`) : that.translateService.instant(`dj-pcc-实际`);
          }
        },
      },
    ];
  }

  /**
   * template 样式配置
   */
  initTemplate(): void {
    // const formatter = this.gantt.ext.formatters.durationFormatter({
    //   enter: 'day',
    //   store: 'hour',
    //   format: 'day',
    //   hoursPerDay: 24,
    //   hoursPerWeek: 40,
    //   daysPerMonth: 30,
    //   short: true,
    // });

    // 日历呈现区，样式
    this.gantt.templates.task_class = (start, end, task) => {
      if ((task.$level === 0) || (task.$level === 1)) {
        // 一级，任务的上级（文件夹）
        return 'pcc_gantt_display_none';
      }
      if ((task.$level === 2) && task.kind === '1') {
        // 计划行：始终呈现淡蓝绿色
        return 'pcc_gantt_kind1';
      }
      if ((task.$level === 2) && task.kind === '2') {
        /**
         * 实际行：实际开始日且实际完成日均为空，表示未开始，则不会标记区间
         *        实际开始日不为空且实际完成日为空，表示进行中，蓝绿色
         *        实际开始日不为空且实际完成日不为空，表示已完成，灰色
         */
        if (task.task_start_date && !task.task_end_date) {
          return 'pcc_gantt_kind2_start';
        }
        if (task.task_start_date && task.task_end_date) {
          return 'pcc_gantt_kind2_start_end';
        }
        if (!task.task_start_date && !task.task_end_date) {
          return 'pcc_gantt_kind2';
        }
      }
    };

    // 设置tooltip的文本
    // this.gantt.templates.tooltip_text = function (start: any, end: any, task: any): string {
    //   const html =
    //     '<b>Task:</b> ' + task.text +
    //     '<br/><b>Start:</b> ' + this.tooltip_date_format(start) +
    //     '<br/><b>End:</b> ' + task.end +
    //     '<br><b>Duration:</b> ' + formatter.format(task.duration);
    //   return html;
    // };
  }

  /**
   * 显示时距
   * @param event ：day（默认）、week、month
   */
  handleChange(event) {
    if (event) {
      this.editConfig(event);
    }
  }

  /**
   * 修改甘特图配置
   * @param event  ：day（默认）、week、month
   */
  editConfig(event) {
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
            unit: 'day', step: 1,
            format: '%n' + this.translateService.instant('dj-default-月M') + '%j' + this.translateService.instant('dj-default-日D') + '(%D)'
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

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  /**
   * 把wbs的数据转换成gantt格式
   * @param ganttData 数据入参
   * */
  transformGanttData(ganttData: any[]): any {
    const data = [];
    const that = this;
    ganttData.forEach((item) => {
      item.task_start_date = item.start_date;
      item.task_end_date = item.end_date;
      item.unscheduled = !item.days;
      item.duration = item.days;

      if ((item.kind === '1') && item.start_date) {
        item.start_date = new Date(item.start_date + ' 00:00:00');
      }

      if ((item.kind === '2') && item.start_date) {
        item.start_date = new Date(item.start_date + ' 00:00:00');
        if (item.start_date && !item.end_date) {
          item.end_date = this.newDateByFormat('yyyy-MM-dd');
          item.unscheduled = false;
        }
      }

      if (item.end_date) {
        item.end_date = new Date(item.end_date + ' 23:59:59');
      }
    });

    return ganttData;
  }

  newDateByFormat(fmt: string, date?: Date) {
    date = date ? new Date(date) : new Date();
    const o = {
      'M+' : date.getMonth() + 1,               // 月份
      'd+' : date.getDate(),                    // 日
      'h+' : date.getHours(),                   // 小时
      'm+' : date.getMinutes(),                 // 分
      's+' : date.getSeconds(),                 // 秒
      'q+' : Math.floor((date.getMonth()+3)/3), // 季度
      'S'  : date.getMilliseconds()             // 毫秒
    };
    if(/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear()+'').substr(4 - RegExp.$1.length));
    }
    for(const k in o) {
      if(new RegExp('('+ k +')').test(fmt)){
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00'+ o[k]).substr((''+ o[k]).length)));
      }
    }
    return fmt;
  }

}
