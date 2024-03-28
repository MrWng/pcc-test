import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { cloneDeep } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { Entry } from '../../../../service/common.service';

@Component({
  selector: 'app-pert',
  templateUrl: './pert.component.html',
  styleUrls: ['./pert.component.less'],
})
export class PertComponent implements OnInit, OnChanges {
  @Input() ganttData: any;
  @Input() criticalPath: Array<any>;
  @Input() dependencyInfo: Array<any>;
  @Input() fullScreenStatus: Boolean;
  @Input() source: Entry = Entry.card;
  option: any;
  data = []; // 关系图，实体数据
  link = []; // 关系图，实体与实体直接的指引坐标
  listOfTime = {
    '1': this.translateService.instant('dj-default-小时'),
    '2': this.translateService.instant('dj-default-日'),
    '3': this.translateService.instant('dj-default-月'),
  };

  // 项目页面的所有任务卡数据
  pagesData: Array<any> = [];

  constructor(private translateService: TranslateService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ganttData) {
      this.pagesData = cloneDeep(changes.ganttData.currentValue);
      this.transformData(changes.ganttData.currentValue);
      this.option = this.setOptions(); // 关系图，配置项
    }
  }

  ngOnInit() { }

  getBeforeTaskName(task_no) {
    return this.pagesData.filter(item => item.task_no === task_no);
  }

  getDateInterval(beginDate: string, endDate: string):number {
    if (beginDate && endDate) {
      const b: any = new Date(beginDate);
      const e: any = new Date(endDate);
      return Math.ceil((b - e) / 86400000);
    }else{
      return 0;
    }
  }

  transformData(datas) {
    const that = this;
    // 获取所有前置任务线条
    datas.forEach((cur, index) => {
      let actualDependency = [];
      if (this.source === Entry.projectChange) {
        actualDependency = cur.project_change_task_dep_info || [];
      } else {
        actualDependency = (cur.task_dependency_info || []).filter((v) => v.after_task_no === cur.task_no);
      }
      
      if (actualDependency.length > 0) {
        actualDependency.forEach(item => {
          const taskObj = this.getBeforeTaskName(item.before_task_no);
          if (taskObj && taskObj[0]) {
            item.plan_finish_date = taskObj[0].plan_finish_date;
          }
        });
        const arr = [];
        actualDependency.forEach((s) => {
          // 关系图，实体与实体直接的指引坐标
          arr.push({
            source: s.before_task_no, // 箭头，source，目标起点
            target: cur.task_no, // 箭头，target，目标指向
            label: {
              show: true,
              position: 'middle',
              formatter: function (v) {
                // 终端的预计开始日 与 发起的预计结束日，间隔
                return that.getDateInterval(cur.plan_start_date, s.plan_finish_date) + '天';
              }
            },
            lineStyle: {
              width: 3,
              curveness: 0.1
            },
            emphasis: {
              lineStyle: {
                color: '#1d1d1d'
              }
            }
          });
        });
        this.link = [...this.link, ...arr];
      }
    });

    // 判断前后置任务关系是否为关键路径，[{source: '1', target: '2'},{source: '5', target: '6'},{...}]
    this.link.forEach((res) => {
      for (const i in this.criticalPath) {
        if (
          this.criticalPath[i].source===res.source &&
          this.criticalPath[i].target===res.target
        ) {
          res.lineStyle = {
            width: 3,
            curveness: 0.2,
            color: 'rgba(250,82,75,0.7)', // 线条、箭头，红色
          };
          res.emphasis = {
            lineStyle: {
              color: '#ff0505',
            }
          };
        }
      }
    });

    const dependencyInfo = this.dependencyInfo; // 父组件传入的每个task的task_no
    /**
     * dependencyInfo数据格式：
     * [{
     *   data: [0 : "5", 1 : "6"], // link数据：0是目标起点，1是目标指向
     *   pathNum: 1,
     *   y: 2
     * },
     * {}]
     */
    // ---------------dependencyInfo-----这段代码可以考虑后面删掉---------------
    // console.log('父组件传入的dependencyInfo---------', dependencyInfo);
    // 每条数据的纵坐标计算
    let y = 0;
    const point = []; // 关系图中每组有关联实体的下标（0是目标起点，1是目标指向）
    if (dependencyInfo && dependencyInfo.length) {
      dependencyInfo.forEach((data) => {
        // console.log('dependencyInfo的data---------', data);
        // 判断当前行数据是否全部被覆盖 若全部被覆盖为false 无行坐标
        let hasY = false;
        data.data.forEach((res) => {
          if (point.indexOf(res) === -1) {
            hasY = true;
            point.push(res);
          }
        });
        if (hasY) {
          y++;
          const arr = { y: y };
          data = Object.assign(data, arr);
        }
        // console.log('dependencyInfo重新组合后的data---------', data);
      });
      dependencyInfo.forEach((item: any): void => {
        item.pathNum = dependencyInfo.filter((o: any): boolean => o.data[0] === item.data[0] && o.y).length;
      });
    }
    // console.log('重新组合后的dependencyInfo---------', dependencyInfo);
    // ---------------dependencyInfo-----这段代码可以考虑后面删掉---------------

    const points = []; // 显示点集合
    let brotherPath = 0; // 根据行坐标 计算偏移量
    for (const i in dependencyInfo) {
      if (dependencyInfo.hasOwnProperty(i)) {
        // 关系图中一组有关联的实体对象，所有数据；pointData.data与link中封装的数据相同
        const pointData = dependencyInfo[i];
        // data: [0 : "5", 1 : "6"]
        let y2;
        pointData.data.forEach((value, index) => {
          if (index === 0) {
            y2 = 80 * ((pointData as any).pathNum - 1) / 2 + 80 * ((pointData as any).y - 1);
          }
          // 封装关系图实体集合，返回true表示已经在points集合中
          if (!this.getPoint(value, points)) {
            const arrs = {
              name: value, // 每个对象应对的下标
              x: 200 * index, // 横向坐标
              y: y2 // 纵向坐标
            };
            points.push(arrs);
          }
          brotherPath = brotherPath + (pointData as any).pathNum;
        });
      }
    }
    // 根据点坐标获取详细信息 带入echarts图标数据源
    // 关系图的实体，鼠标移动上去，显示卡片信息
    datas.forEach((cur) => {
      let arr = {};
      for (const i in points) {
        if (cur.task_no===points[i].name) {
          // 任务名称
          if (cur.task_name.length > 4) {
            cur.task_name_slice = cur.task_name.slice(0, 4);
            const sliceName = cur.task_name.slice(4, cur.task_name.length);
            if (sliceName.length > 3) {
              cur.sliceName = sliceName.slice(0, 3) + '...';
            } else {
              cur.sliceName = sliceName;
            }
          }
          if (this.showCriticalPath(cur)) {
            points[i].itemStyle = {
              color: 'rgba(250,82,75,0.8)',
            };
          } else {
            points[i].itemStyle = {
              color: 'rgba(79,182,255,0.8)',
            };
          }
          arr = { ...cur, ...points[i] };
          this.data.push(arr);
        }
      }
    });
  }

  // 封装关系图实体集合
  getPoint(value, point) {
    let isHas = false;
    for (const i in point) {
      if (point[i].name===value) {
        isHas = true; // 标记：已有
      }
    }
    return isHas;
  }

  // 判断点是否在关键路径上
  showCriticalPath(arr) {
    let isCriticalPath = false;
    for (const i in this.criticalPath) {
      if (
        this.criticalPath[i].source===arr.task_no ||
        this.criticalPath[i].target===arr.task_no
      ) {
        isCriticalPath = true;
      }
    }
    return isCriticalPath;
  }

  setOptions() {
    const that = this;
    const options = {
      title: {
        text: '',
      },
      tooltip: {},
      animationDurationUpdate: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph', // 关系图
          layout: 'none',
          circular:{ rotateLabel: true },
          roam: true,
          symbolSize: 55,
          symbol: 'roundRect',
          nodeScaleRatio: 0,
          label: {
            show: true,
            rich: {
              div: {
                color: '#000',
                lineHeight: 20,
                fontSize: 13,
                fontWeight: 'bold',
                align: 'center',
              },
            },
            formatter: function (data) {
              const name = data.data.task_name_slice
                ? data.data.task_name_slice
                : data.data.task_name;
              let list = [];
              if (data.data.sliceName) {
                list = [`{div|${name}}`, `{div|${data.data.sliceName}}`];
              } else {
                list = [`{div|${name}}`];
              }
              return list.join('\n');
            },
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [12, 12],
          edgeLabel: {
            fontSize: 14,
          },
          data: this.data,
          tooltip: {
            textStyle:{
              align:'left'
            },
            formatter: function (res) {
              if (res.data.task_name) {
                return `${that.translateService.instant('dj-default-任务名称')}：
                ${res.data.task_name}<br />
                ${that.translateService.instant('dj-default-工作量')}：
                ${res.data.workload_qty ? res.data.workload_qty : ''}<br />
                ${that.translateService.instant('dj-default-工作量单位')}：
                ${res.data.workload_unit ? that.listOfTime[res.data.workload_unit] : ''}<br />
                ${that.translateService.instant('dj-default-计划开始时间')}：
                ${res.data.plan_start_date ? res.data.plan_start_date : ''}<br />
                ${that.translateService.instant('dj-default-计划结束时间')}：
                ${res.data.plan_finish_date ? res.data.plan_finish_date : ''}<br />
                ${that.translateService.instant('dj-default-实际开始时间')}：
                ${res.data.actual_start_date ? res.data.actual_start_date : ''}<br />
                ${that.translateService.instant('dj-default-实际结束时间')}：
                ${res.data.actual_finish_date ? res.data.actual_finish_date : ''}`;
              }
            },
          },
          links: this.link, // 节点间，连接线，配置项
        },
      ],
    };
    return options;
  }
}
