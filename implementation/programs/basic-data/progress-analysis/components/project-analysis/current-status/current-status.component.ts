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
import { OpenWindowService } from '@athena/dynamic-ui';

@Component({
  selector: 'app-current-status',
  templateUrl: './current-status.component.html',
  styleUrls: ['./current-status.component.less'],
})
export class CurrentStatusComponent implements OnInit, OnChanges {
  @Input() currentStatus: any;

  @Output() jumpToProjectInfo = new EventEmitter();

  showStatus: number;

  constructor(
    private translateService: TranslateService,
    protected changeRef: ChangeDetectorRef,
    public openWindowService: OpenWindowService
  ) {}

  ngOnInit(): void {
    // this.currentStatus = this.currentStatus.toFixed(2);
    // this.showStatus = Math.abs(this.currentStatus);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.currentStatus) {
      this.currentStatus = changes.currentStatus.currentValue;
      this.currentStatus = this.currentStatus ? this.currentStatus.toFixed(2) : this.currentStatus;
      this.showStatus = Math.abs(this.currentStatus);
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
