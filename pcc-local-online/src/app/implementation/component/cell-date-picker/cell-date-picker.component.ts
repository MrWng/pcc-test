import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { ICellRendererParams } from 'ag-grid-community';
import { debounceTime } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { DwFormControl } from '@athena/dynamic-core';
import * as moment from 'moment';

@Component({
  selector: 'app-cell-date-picker',
  templateUrl: './cell-date-picker.component.html',
  styleUrls: ['./cell-date-picker.component.less'],
})
export class CellDatePickerComponent extends AcBaseCellComponent implements OnInit {
  @Input() checkValue;
  @Input() cancelTip;
  nzAllowClear?: boolean = true;
  nzBackdrop?: any = false;
  // nzDisabled?: boolean = false;
  nzDisabledDate?: (current: Date) => boolean;
  nzFormat?: any = '';
  nzPlaceHolder?: any = '';
  nzShowTime?: object | boolean = false;
  nzDisabledTime?: any;
  get infoCheck() {
    return this._infoCheck;
  }
  set infoCheck(val) {
    if (val && val.length) {
      this.windowClickHandlerKey = true;
    }
    this._infoCheck = val;
  }
  private _infoCheck?: any = [];
  windowClickHandlerKey: boolean = false;
  @ViewChild('popConfirmInfoCheckWrapper') popConfirmInfoCheckWrapper;
  @HostListener('window:click', ['$event'])
  windowClickHandler(e) {
    if (!this.popConfirmInfoCheckWrapper) {
      // eslint-disable-next-line no-unused-expressions
      this.windowClickHandlerKey && this.cancel();
      return;
    }
    this.windowClickHandlerKey = true;
  }
  constructor(
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    private translateService: TranslateService
  ) {
    super(elementRef, changeRef);
  }

  athOnInit(params: ICellRendererParams) {
    super.athOnInit(params);
    const {
      colDef: { field },
      data: formGroup,
      // @ts-ignore
      compProps: { customDisabledDate },
    } = params;
    this.control = formGroup.controls[field];
    this.control['infoCheck'] = (res?: any, index?: number) => {
      this.infoCheck[index] = res;
      if (res) {
        this.windowClickHandlerKey = true;
      }
      this.changeRef.markForCheck();
    };
    this.control.valueChanges.pipe(debounceTime(1000)).subscribe((res) => {
      setTimeout(() => {
        this.inputValue = res;
        this.changeRef.markForCheck();
      }, 0);
    });
    this.nzDisabledDate = (current: Date) => {
      return customDisabledDate(current, formGroup);
    };
  }

  confirm() {
    const { data: formGroup } = this.data.params;
    this.checkValue(formGroup);
  }

  cancel() {
    this.windowClickHandlerKey = false;
    this.cancelTip();
  }

  changeEvent(e: any) {
    const val = e?.target ? e?.target?.value : e;
    const format = this.nzFormat.split(' '),
      dateFormatStr = format[0],
      dateTimeFormat = format[1] || '00:00:00';
    this.inputValue = val
      ? moment(val).format(dateFormatStr ? `${dateFormatStr.toUpperCase()} ${dateTimeFormat}` : '')
      : '';
    this.control.setValue(Array.isArray(val) && val.length === 0 ? '' : this.inputValue);
    const name = (this.control as DwFormControl).getName(),
      key = name === 'plan_finish_date' ? 'plan_start_date' : name;
    (this.group as any)[key].markAsDirty();
    (this.group as any)[key].updateValueAndValidity();
    // @ts-ignore
    this._validator();
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-${val}`);
  }

  clear(e: Event) {
    e.stopPropagation();
    // @ts-ignore
    this.control.setValue('');
    this.callback(this.group);
  }
}
