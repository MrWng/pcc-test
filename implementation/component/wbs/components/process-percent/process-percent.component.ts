import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';

@Component({
  selector: 'app-process-perc',
  templateUrl: './process-percent.component.html',
  styleUrls: ['./process-percent.component.less'],
})
export class ProcessPercentComponent implements OnInit ,OnChanges{
  // 颜色
  @Input() color: Array<string>;
  // 所有进程
  @Input() allProcess: number;
  // 已完成的进程
  @Input() finishProcess: number;
  option: any;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.color && changes.color.currentValue && changes.allProcess && changes.allProcess.currentValue
      && changes.finishProcess && ![null, undefined, ''].includes(changes.finishProcess.currentValue)) {
      this.option = this.setOptions(this.color, this.allProcess, this.finishProcess);
    }
  }

  ngOnInit() { }

  setOptions(color: Array<string>, allProcess: number, finishProcess: number) {
    const dataStyle = {
      normal: {
        label: {
          show: false
        },
        labelLine: {
          show: false
        }
      }
    };
    const placeHolderStyle = {
      normal: {
        color: color[0],
        label: {
          show: true
        },
        labelLine: {
          show: false
        },
      },

    };
    const options = {
      angleAxis: {
        max: 100,
        show: false,
      },
      graphic: {
        elements: [{
          type: 'text',
          cursor: 'default',
          left: 'center',
          top: 'center',
          style: {
            text: [null, 0].includes(finishProcess) ? '0%' : Math.floor(finishProcess) + '%',
            fill: color[2],
            fontSize: 14,
          }
        }]
      },
      series: [{
        type: 'pie',
        clockWise: true,
        radius: ['100%', '80%'],
        itemStyle: dataStyle,
        hoverAnimation: false,
        cursor: 'default',
        data: [{
          value: Math.floor(finishProcess),
          itemStyle: {
            normal: {
              color: color[1],
            }
          }
        },
        {
          value: allProcess - Math.floor(finishProcess),
          tooltip: {
            show: false
          },
          itemStyle: placeHolderStyle
        }]
      },
      ]
    };
    return options;
  }
}
