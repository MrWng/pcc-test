import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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
  option: any;
  data = []; // 关系图，实体数据
  link = []; // 关系图，实体与实体直接的指引坐标
  listOfTime = {
    '1': this.translateService.instant('dj-default-小时'),
    '2': this.translateService.instant('dj-default-日'),
    '3': this.translateService.instant('dj-default-月'),
  };

  constructor(private translateService: TranslateService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ganttData) {
      this.transformData(changes.ganttData.currentValue);
      this.option = this.setOptions(); // 关系图，配置项
    }
  }

  ngOnInit() { }

  transformData(datas) {
    // 获取所有前置任务线条
    datas.forEach((cur, index) => {
      const actualDependency = (cur.task_dependency_info || []).filter( (v) => v.after_task_no === cur.task_no);
      if (actualDependency.length > 0) {
        const arr = [];
        actualDependency.forEach((s) => {
          // 关系图，实体与实体直接的指引坐标
          arr.push({
            source: s.before_task_no, // 箭头，source，目标起点
            target: cur.task_no, // 箭头，target，目标指向
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
            color: 'rgb(250,82,75)', // 橘色，高亮
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
    // console.log('重新组合后的dependencyInfo---------', dependencyInfo);
    // ---------------dependencyInfo-----这段代码可以考虑后面删掉---------------

    const points = []; // 显示点集合
    let brotherPath = 0; // 根据行坐标 计算偏移量
    for (const i in dependencyInfo) {
      if (dependencyInfo.hasOwnProperty(i)) {
        // 关系图中一组有关联的实体对象，所有数据；pointData.data与link中封装的数据相同
        const pointData = dependencyInfo[i];
        // data: [0 : "5", 1 : "6"]
        pointData.data.forEach((value, index) => {
          let y2;
          if (index === 0) {
            y2 = 100 * ((pointData as any).pathNum - 1) / 2 + 100 * ((pointData as any).y- 1);
          } else {
            y2 = 100 * ((pointData as any).y - 1);
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
              color: 'rgb(250,82,75)',
            };
          } else {
            points[i].itemStyle = {
              color: 'rgb(79,182,255)',
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
          edgeSymbolSize: [4, 10],
          edgeLabel: {
            fontSize: 12,
          },
          data: this.data,
          tooltip: {
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
          links: this.link, // 必填项
          lineStyle: {
            opacity: 0.9,
            width: 2,
            curveness: 0,
          },
        },
      ],
    };
    return options;
  }
}
