import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { multiple } from '@athena/dynamic-core';
import { OpenWindowService } from '@athena/dynamic-ui';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-task-progress-line',
  templateUrl: './task-progress-line.component.html',
  styleUrls: ['./task-progress-line.component.less'],
})
export class TaskProgressLineComponent implements OnInit, OnChanges {
  @Input() type: any;
  @Input() rate: any;
  @Input() currentStatus: any;
  @Input() taskCount: any;

  lineWidth: number;

  constructor(
    private translateService: TranslateService,
    protected changeRef: ChangeDetectorRef,
    public openWindowService: OpenWindowService
  ) {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.currentStatus) {
      this.currentStatus = changes.currentStatus.currentValue;
    }
    if (changes.rate) {
      this.rate = changes.rate.currentValue;
      this.lineWidth = Number(multiple(this.rate, 140).toFixed(2));
      this.rate = this.rate ? multiple(this.rate.toFixed(4), 100) : this.rate;
    }
    if (changes.type) {
      this.type = changes.type.currentValue;
    }
    if (changes.taskCount) {
      this.taskCount = changes.taskCount.currentValue;
    }
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
