import { Component, OnInit, Input } from '@angular/core';
import { cardExecutionStatus, cardExecutionStatusCode } from '../card-status.config';
import { UUID } from 'angular2-uuid';
import { isNotEmpty } from '@athena/dynamic-core';

@Component({
  selector: 'app-card-process',
  templateUrl: './card-process.component.html',
  styleUrls: ['./card-process.component.less'],
})
export class CardProcessComponent implements OnInit {
  @Input()
  get cardExecutionStatusInfo() {
    return this._cardExecutionStatusInfo;
  }
  set cardExecutionStatusInfo(value) {
    const copyValue = this._cardExecutionStatusInfo;
    this._cardExecutionStatusInfo = value;
    if (value) {
      if (copyValue.className !== value.className) {
        this.setCircleProcessStrokeColor(value.className, value.status);
        this.setCircleGradient(this.circleProcessStrokeColor);
      }
      if (copyValue.process !== value.process) {
        this.setCirclePaths(value.process);
      }
    }
  }
  circleProgressWidth: number = 48;
  circleProcessPathString = '';
  circleProcessTrailPathStyle = {};
  circleProcessStrokeLinecap = 'round';
  circleProcessStrokeColor = null;
  circleProcessGradient = [];
  circleProcessPercent = 0;
  circleProcessStrokePathStyle: any = {};
  strokeWidth: number = 6.25;
  componentId = UUID.UUID();
  private _cardExecutionStatusInfo: any = {};
  constructor() {}

  ngOnInit() {}
  /**
   * 设置圆环进度条颜色
   */
  private setCircleProcessStrokeColor(className: string, status) {
    /**
     * 这里不用status判断因为可能存在例如未开始但是已逾期的状态，
     * 前面已经判断过了，对于未开始和进行中已经逾期的会被设置未逾期状态
     */
    switch (className) {
      // 未开始不显示
      case cardExecutionStatus[cardExecutionStatusCode.NOSTART]:
        this.circleProcessStrokeColor = null;
        break;
      case cardExecutionStatus[cardExecutionStatusCode.DONE]:
      case cardExecutionStatus[cardExecutionStatusCode.ONGOING]:
      case cardExecutionStatus[cardExecutionStatusCode.DESIGNATEDCOMPLETION]:
      case cardExecutionStatus[cardExecutionStatusCode.TIMEOUT]:
      case cardExecutionStatus[cardExecutionStatusCode.SIGNOFF]:
        this.circleProcessStrokeColor = {
          '0%': '#9fa0ff  ',
          '100%': '#5e78ff  ',
        };
        break;
      case cardExecutionStatus[cardExecutionStatusCode.LATE]:
        /**
         * 1. 未开始已逾期
         * 2. 进行中已逾期
         * 3. 签核中已逾期
         */
        this.cardExecutionStatusInfo.otherClassName.push(
          `${cardExecutionStatus[status]}-${cardExecutionStatus[cardExecutionStatusCode.LATE]}`
        );
        this.circleProcessStrokeColor = {
          '0%': '#ff816c ',
          '100%': '#e03a3a ',
        };
        break;
      default:
        break;
    }
  }
  setCirclePaths(percent = 0) {
    this.circleProcessPercent = percent;
    const radius = 50 - this.strokeWidth / 2;
    const len = Math.PI * 2 * radius;
    const beginPositionX = 0;
    const beginPositionY = -radius;
    const endPositionX = 0;
    const endPositionY = radius * -2;
    this.circleProcessPathString = `M 50,50 m ${beginPositionX},${beginPositionY}
       a ${radius},${radius} 0 1 1 ${endPositionX},${-endPositionY}
       a ${radius},${radius} 0 1 1 ${-endPositionX},${endPositionY}`;
    this.circleProcessTrailPathStyle = {
      strokeDasharray: `${len}px ${len}px`,
      strokeDashoffset: `-0px`,
      transition: 'stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s',
    };
    this.circleProcessStrokePathStyle = {
      stroke: `url(#pcc-gradient-${this.componentId})`,
      strokePathStyle: {
        // stroke: this.circleProcessStrokeColor as string,
        transition:
          'stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s, stroke-width .06s ease .3s',
        strokeDasharray: `${((percent || 0) / 100) * len}px ${len}px`,
        strokeDashoffset: `-0px`,
      },
    };
  }
  setCircleGradient(strokeColor) {
    if (!strokeColor) {
      return;
    }
    this.circleProcessGradient = Object.keys(strokeColor).map((key) => ({
      offset: key,
      color: strokeColor[key],
    }));
  }
}
