import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { multiple } from '@ng-dynamic-forms/core';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';

@Component({
  selector: 'app-progress-line',
  templateUrl: './progress-line.component.html',
  styleUrls: ['./progress-line.component.less'],
})
export class ProgressLineComponent implements OnInit, OnChanges {
  @Input() actualCompleteRate: any;
  @Input() currentStatus: any;

  @Output() jumpToProjectInfo = new EventEmitter();

  lineWidth: number;

  constructor(
    private translateService: TranslateService,
    protected changeRef: ChangeDetectorRef,
    public openWindowService: OpenWindowService
  ) {}

  ngOnInit(): void {
    // this.lineWidth = Number(multiple(this.actualCompleteRate, 110).toFixed(2)) ;
    // this.actualCompleteRate = multiple(this.actualCompleteRate.toFixed(4), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.actualCompleteRate) {
      this.actualCompleteRate = changes.actualCompleteRate.currentValue;
      this.lineWidth = Number(multiple(this.actualCompleteRate, 110).toFixed(2));
      this.actualCompleteRate = this.actualCompleteRate
        ? multiple(this.actualCompleteRate.toFixed(4), 100)
        : this.actualCompleteRate;
    }
    if (changes.currentStatus) {
      this.currentStatus = changes.currentStatus.currentValue;
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
