import { Component, OnInit, Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { cloneDeep } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService, Entry } from '../../../../service/common.service';
import { DwUserService } from '@webdpt/framework/user';
// import * as echarts from 'echarts';
import { ECharts } from 'echarts';
@Component({
  selector: 'app-pert',
  templateUrl: './pert.component.html',
  styleUrls: ['./pert.component.less'],
})
export class PertComponent implements OnInit {
  @Input() fullScreenStatus: Boolean;
  @Input() project_no: string;
  @Input() change_version: string;
  @Input() source: string;

  // 项目页面的所有任务卡数据
  pagesData: Array<any> = [];
  // 项目页面的所有关键路径数据
  critical_path_list: Array<any> = [];

  echartsInstance: ECharts;
  option: any;
  data = []; // 关系图，实体数据
  link = []; // 关系图，实体与实体直接的指引坐标

  loading: boolean = true;
  listOfTime = {
    '1': this.translateService.instant('dj-default-小时'),
    '2': this.translateService.instant('dj-default-日'),
    '3': this.translateService.instant('dj-default-月'),
  };

  constructor(
    private translateService: TranslateService,
    public commonService: CommonService,
    private userService: DwUserService,
    protected changeRef: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    const tenantId = this.userService.getUser('tenantId');
    // 【项目计划维护】-- 增加传入：计算方式=若 交付设计器参数.逾期天数纳入关键路径计算 =true，则传入1，否则传入2
    // 旧流程，若拿不到交付设计器参数.逾期天数纳入关键路径计算，默认按照2的方式处理
    this.commonService
      .getHasGroundEnd(tenantId, 'acceptanceOfOverdueDays')
      .subscribe((res) => {
        // 交付设计器增加逾期天数纳入关键路径计算的参数：acceptanceOfOverdueDays
        let calculation_method = res?.data?.acceptanceOfOverdueDays ? '1' : '2';
        // 【项目模板】-- 增加传入：计算方式 = 2
        if (this.source === 'maintain') {
          calculation_method = '2';
        }

        const type = this.source === 'projectChange' ? '3' : this.source === 'maintain' ? '2' : '1';
        const params = {
          // EntId //企业编号
          // CompanyId //营运据点
          // enterprise_no //企业编号
          // site_no //营运据点
          type, // task_property，查询入口： 1.项目中控台 2.项目模版 3.项目变更
          project_no: this.project_no, // 项目编号
          x: '500', // X轴的偏移量，不传默认50
          y: '300', // Y轴的偏移量，不传默认50
          algorithm_type: '2', // 算法类型： 1.最长工期的路径；2.任务工期累计最长的路径。
          calculation_method, // 计算方式： 1.逾期天数纳入关键路径计算；2逾期天数不纳入关键路径计算
        };
        if (this.source === 'projectChange' && this.change_version) {
          params['change_version'] = this.change_version.toString();
        }
        this.commonService.getInvData('project.task.pert.info.get', params).subscribe((result): void => {
          this.pagesData = result.data?.task_info ?? [];
          this.critical_path_list = result.data?.critical_path_list ?? [];
          this.transformData(result.data?.task_info);
          this.option = this.setOptions();
          this.loading = false;
          this.changeRef.markForCheck();
        });
      });
  }

  onChartInit(ec) {
    this.echartsInstance = ec;
    this.echartsInstance.setOption(this.option);
  }

  @HostListener('window:visibilitychange', ['$event'])
  onVisibilityChange(event: Event) {
    let hidden;
    if (typeof document['hidden'] !== 'undefined') {
      hidden = 'hidden';
    } else if (typeof document['mozHidden'] !== 'undefined') {
      hidden = 'mozHidden';
    } else if (typeof document['msHidden'] !== 'undefined') {
      hidden = 'msHidden';
    } else if (typeof document['webkitHidden'] !== 'undefined') {
      hidden = 'webkitHidden';
    }
    if (!document[hidden]) {
      // 当浏览器窗口被调整大小时触发，动态适配
      // resize来重新设置图表的 宽高
      if (typeof this.echartsInstance['resize'] === 'function') {
        this.echartsInstance.resize({ animation: { duration: 1000 } });
      } else {
        // 重新渲染图表
        this.echartsInstance.setOption(this.option);
        // this.echartsInstance.setOption(this.option, true); // 设置true清空echart缓存
      }
    }
  }

  getDateInterval(beginDate: string, endDate: string): number {
    if (beginDate && endDate) {
      const b: any = new Date(beginDate);
      const e: any = new Date(endDate);
      return Math.ceil((b - e) / 86400000);
    }else{
      return 0;
    }
  }

  transformData(pagesData) {
    const datas = cloneDeep(pagesData);
    const that = this;
    // 获取所有前置任务
    let actualDependency = [];
    if (this.source === Entry.projectChange) {
      datas.forEach(item => {
        if (item.project_change_task_dep_info?.length > 0) {
          item.project_change_task_dep_info.forEach((v) => {
            v['plan_start_date'] = item?.plan_start_date;
          });
          actualDependency.push(item.project_change_task_dep_info);
        }
      });
    } else {
      datas.forEach(item => {
        if (item.task_dependency_info?.length > 0) {
          item.task_dependency_info.forEach((v) => {
            v['plan_start_date'] = item?.plan_start_date;
          });
          actualDependency.push(item.task_dependency_info);
        }
      });
    }
    actualDependency = actualDependency ?? [];
    if (actualDependency.length > 0) {
      const arr = [];
      actualDependency.forEach(element => {
        element?.forEach(item => {
          const beforeTask = this.pagesData.filter(v => v.task_no === item.before_task_no);
          if (beforeTask && beforeTask[0]) {
            item['plan_finish_date'] = beforeTask[0].plan_finish_date;
          }
          // 普通路径 links edgeLabel
          const commonLinks = {
            source: item.before_task_no, // 箭头，source，目标起点
            target: item.task_no, // 箭头，target，目标指向
            label: {
              show: false,
              // position: 'middle',
              // verticalAlign: 'middle',
              // fontSize: 14,
              // // padding: [0, 5, 0, 5],
              // formatter: function (params) {
              //   // 终端的预计开始日 与 发起的预计结束日，间隔
              //   return that.getDateInterval(item.plan_start_date, item.plan_finish_date) + '天';
              // }
            },
            lineStyle: {
              type: 'solid', // 设置虚线类型
              width: 1,
              curveness: 0,
            },
            emphasis: {
              lineStyle: {
                color: '#1d1d1d'
              },
            }
          };
          arr.push(commonLinks);
        });
      });

      if (this.critical_path_list.length > 0) {
        this.critical_path_list.forEach((item, index) => {
          arr.find(commonLink => {
            // 关键性路径 links
            if (commonLink.source === item.task_no && commonLink.target === this.critical_path_list[index + 1]?.task_no) {
              commonLink['lineStyle']['color'] = '#6E82FF';
              commonLink['lineStyle']['width'] = '2';
              commonLink['lineStyle']['type'] = 'dashed';
              commonLink['emphasis']['lineStyle']['color'] = '#6E82FF';
            }
          });
        });
      }

      this.link = arr;
    }

    // 关系图的节点实体，节点方块，显示任务卡名称信息
    datas.forEach((card) => {
      card['name'] = card.task_no;
      if (card.task_name.length > 4) {
        card.task_name_slice = card.task_name.slice(0, 4);
        const sliceName = card.task_name.slice(4, card.task_name.length);
        if (sliceName.length > 3) {
          card.sliceName = sliceName.slice(0, 3) + '...';
        } else {
          card.sliceName = sliceName;
        }
      }
      // 普通路径的节点 --- 节点方块的颜色
      card.itemStyle = {
        opacity: 1,
        color: '#D9DCF3',
        // box-shadow: 0px 4px 8px 0px rgba(97,103,204,0.08);
        // borderColor: '#6167CC',
        // borderWidth: 1,
        // borderType: 'solid', // 柱条的描边类型，默认为实线，支持 'dashed', 'dotted'。
        // shadowOffsetX: 3,
        // shadowOffsetY: 3,
        // shadowBlur: 6,
        // shadowColor: '#6167CC'
      };
      card.emphasis = {
        disabled: false,
        scale: true,
        // 'none' 不淡出其它图形，默认使用该配置。
        // 'self' 只聚焦（不淡出）当前高亮的数据的图形。
        // 'series' 聚焦当前高亮的数据所在的系列的所有图形。
        focus: 'adjacency', // 聚焦关系图中的邻接点和边的图形
        // 'coordinateSystem' 淡出范围为坐标系，默认使用该配置。
        // 'global' 淡出范围为全局。
        blurScope: 'series',// 淡出范围为系列
        itemStyle: {
          opacity: 1,
          color: '#D9DCF3',
        }
      };
      if (card.is_critical_path) {
        // 关键性路径的节点 --- 节点方块的颜色
        card.itemStyle['color'] = {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0.5,
          y2: 0.6,
          colorStops: [
            {
              offset: 0.99,
              color: '#5d78ff', // 0% 处的颜色
            },
            {
              offset: 0.2,
              color: '#a0a0ff', // 100% 处的颜色
            },
          ],
          global: false // 缺省为 false
        };
        card.emphasis.itemStyle['color'] = {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0.5,
          y2: 0.6,
          // x2: 1,
          // y2: 0.3,
          colorStops: [
            {
              offset: 0.99,
              color: '#5d78ff', // 0% 处的颜色
            },
            {
              offset: 0.2,
              color: '#a0a0ff', // 100% 处的颜色
            },
          ],
          global: false // 缺省为 false
        };
      }
    });
    this.data = cloneDeep(datas);
  }

  setOptions() {
    const that = this;
    const options = {
      title: {
        text: '',
      },
      tooltip: {
        showDelay: 5, // 浮层显示的延迟，默认0ms
        hideDelay: 1000, // 浮层隐藏的延迟
        enterable: true, // 鼠标是否可进入提示框浮层中，默认为false
        renderMode: 'html', // 浮层的渲染模式，html默认/richText富文本形式
        confine: true, // 是否将 tooltip 框限制在图表的区域内
        appendToBody: false, // 是否将组件DOM节点添加为HTML的<body>子节点。只有当renderMode为html有意义
        transitionDuration: 0.5,  // 提示框浮层的移动动画过渡时间，单位是s
        backgroundColor: '#fff',
        borderColor: '#fff',
        // borderWidth: 1,
        borderRadius: 4,
        padding: 16,
        extraCssText: 'box-shadow: 0px 4px 8px 0px rgba(41,41,68,0.20);',  // 额外附加到浮层的 css 样式
        textStyle: {
          fontStyle: 'normal',
          fontFamily: 'PingFangSC, PingFangSC-Medium',
        },
        // valueFormatter: (value: number | string) => string,  //数值显示部分的格式化回调函数
        formatter: (params) => {
          if (params.data.task_name) {
            const titleStyle = '<span style="font-size: 14px;font-weight: 400;color: #999;text-align: left;padding:4px 0px 4px 0px;">';
            const contentStyle = '<span style="font-size: 14px;font-weight: 400;color: #333;text-align: left;padding:4px 0px 4px 0px;">';
            return `<div style="text-align: left;">
                <div style="font-size: 16px;font-weight: bold;color: #333;text-align: left;padding:0px 0px 8px 0px;">
                ${params.data.task_name}</div>
                ${titleStyle} ${that.translateService.instant('dj-default-工作量')}：</span>
                ${contentStyle} ${params.data.workload_qty ? params.data.workload_qty : '—'}</span><br/>
                ${titleStyle} ${that.translateService.instant('dj-default-工作量单位')}：</span>
                ${contentStyle} ${params.data.workload_unit ? that.listOfTime[params.data.workload_unit] : '—'}</span><br/>
                ${titleStyle} ${that.translateService.instant('dj-default-计划开始时间')}：</span>
                ${contentStyle} ${params.data.plan_start_date ? params.data.plan_start_date : '—'}</span><br/>
                ${titleStyle} ${that.translateService.instant('dj-default-计划结束时间')}：</span>
                ${contentStyle} ${params.data.plan_finish_date ? params.data.plan_finish_date : '—'}</span><br/>
                ${titleStyle} ${that.translateService.instant('dj-default-实际开始时间')}：</span>
                ${contentStyle} ${params.data.actual_start_date ? params.data.actual_start_date : '—'}</span><br/>
                ${titleStyle} ${that.translateService.instant('dj-default-实际结束时间')}：</span>
                ${contentStyle} ${params.data.actual_finish_date ? params.data.actual_finish_date : '—'}</span>
                </div>`;
          }
        },
      },
      animation: true,
      animationDuration: 1500,
      animationDurationUpdate: 1500,
      animationEasingUpdate: 'quadraticOut',
      series: [
        {
          type: 'graph',
          layout: 'none',
          focusNodeAdjacency: true,
          draggable: true,
          roam: true,
          scaleLimit: {
            min: 0.6,
          },
          zoom: this.pagesData?.length > 30 ? 1.5 : 1,
          nodeScaleRatio: 0,
          symbol: 'rect',
          symbolSize: [80, 56],
          symbolOffset: ['10%', '-2%'],
          label: {
            show: true,
            rich: {
              div: {
                color: '#fff',
                lineHeight: 20,
                fontSize: 14,
                fontWeight: '500',
                fontFamily: 'PingFangSC, PingFangSC-Regular',
                align: 'center',
              },
              common: {
                color: '#333',
                lineHeight: 20,
                fontSize: 14,
                fontWeight: '500',
                fontFamily: 'PingFangSC, PingFangSC-Regular',
                align: 'center',
              },
            },
            formatter: function (data) {
              const name = data.data.task_name_slice
                ? data.data.task_name_slice
                : data.data.task_name;
              let list = [];
              if (data.data.is_critical_path) {
                if (data.data.sliceName) {
                  list = [`{div|${name}}`, `{div|${data.data.sliceName}}`];
                } else {
                  list = [`{div|${name}}`];
                }
              } else {
                if (data.data.sliceName) {
                  list = [`{common|${name}}`, `{common|${data.data.sliceName}}`];
                } else {
                  list = [`{common|${name}}`];
                }
              }
              return list.join('\n');
            },
          },
          // emphasis: {
          //   itemStyle: {
          //     borderColor: '#5E78FF',
          //     borderWidth: 2,
          //     shadowBlur: 5,
          //     shadowOffsetX: 0,
          //     shadowColor: 'rgba(150,155,255,1)'
          //   },
          // },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 8,
          data: this.data,
          links: this.link,
        },
      ],
    };
    return options;
  }
}
