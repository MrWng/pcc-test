import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnChanges,
  Input,
  Output,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import {
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import * as moment from 'moment';
import { inputNewService } from './input-new..service';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'app/customization/task-project-center-console/service/common.service';
import { UploadAndDownloadService } from '../../service/upload.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { id } from 'date-fns/locale';

interface Person {
  label: string;
  name: string;
}

@Component({
  selector: 'app-input-new',
  templateUrl: './input-new.component.html',
  styleUrls: ['./input-new.component.less'],
  providers: [inputNewService],
})
export class inputNewComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() placeholder = this.translateWord('选择时间');
  @Input() name = 'ant-picker-dropdown';
  @Input() nzDisabledDate: any;
  @Input() value = '';
  @Input() nzFormat = 'YYYY/MM/DD';
  @Input() nzDisabled = false;
  @Input() nzAllowClear = false;
  @Output() ngModelChange = new EventEmitter();
  @Output() appClick = new EventEmitter();
  @Output() appChange = new EventEmitter();
  date = '';
  nzOpen = false;
  datePickerChange = false;
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    protected translateService: TranslateService,
    public commonService: CommonService,
    public uploadService: UploadAndDownloadService,
    public messageService: NzMessageService
  ) { }

  ngOnInit() {
    this.date = this.value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const date = Date.parse(this.value) ? moment(this.value).format(this.nzFormat) : '';
    this.value = date;
    this.date = this.value;
    this.changeRef.markForCheck();
  }

  ngAfterViewInit(): void {
    document.addEventListener('click', (e: any): void => {
      if (!this.nzOpen) {
        return;
      }
      const classNames = e.path.map((item): any => item.className);
      if (!classNames.includes('ant-picker-panel')) {
        this.nzOpen = false;
        this.changeRef.markForCheck();
      }
    });
  }

  onChange(value: string): void {
    this.nzOpen = true;
    this.value = value;
    this.appChange.emit(value);
  }

  onBlur(): void {
    setTimeout(() => {
      if (this.datePickerChange) {
        return;
      }
      let date = this.value;
      if (this.value?.length === 8) {
        const reg = /^(\d{4})(\d{2})(\d{2})$/;
        date = date.replace(reg, '$1-$2-$3');
      }
      if (!Date.parse(date) || date?.length > 10 || date?.length < 8) {
        this.value = '';
      } else {
        if ((this.nzDisabledDate && !this.nzDisabledDate(date)) || !this.nzDisabledDate) {
          this.value = moment(date).format(this.nzFormat);
          if (this.value?.length > 10) {
            this.value = '';
          }
        } else {
          this.value = '';
        }
      }
      this.date = this.value;
      this.ngModelChange.emit(this.value);
      this.changeRef.markForCheck();
    });
  }

  onDateChange($event: any): void {
    this.nzOpen = false;
    this.ngModelChange.emit($event);
    this.datePickerChange = true;
    setTimeout(() => {
      this.datePickerChange = false;
    }, 100);
  }

  appClicks(type, event) {
    this.appClick.emit(type);
  }

  appClickInput(type, event) {
    // 禁用时间控件
    if(this.nzDisabled){
      return;
    }
    if(!this.nzOpen){
      setTimeout(() => {
        this.nzOpen = true;
        this.changeRef.markForCheck();
      });
    }
    this.appClick.emit(type);
  }
  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
