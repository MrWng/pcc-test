import { ChangeDetectorRef, Component, ElementRef, Input, OnInit } from '@angular/core';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { ICellRendererParams } from 'ag-grid-community';
import { debounceTime } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cell-date-picker',
  templateUrl: './cell-date-picker.component.html',
  styleUrls: ['./cell-date-picker.component.less']
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
  infoCheck?: any = [];

  constructor(
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    private translateService: TranslateService,

  ) {
    super(elementRef, changeRef);
  }

  athOnInit(params: ICellRendererParams) {
    super.athOnInit(params);
    const {
      colDef: { field },
      data: formGroup,
      // @ts-ignore
      compProps: {
        customDisabledDate
      },
    } = params;
    this.control = formGroup.controls[field];
    this.control['infoCheck'] = (res?:any, index?: number)=> {
      this.infoCheck[index] = res;
      this.changeRef.markForCheck();
    };
    this.control.valueChanges.pipe(debounceTime(1000)).subscribe(res => {
      setTimeout(() => {
        this.inputValue = res;
        this.changeRef.markForCheck();
      }, 0);
    });
    this.nzDisabledDate = (current: Date)=>{
      return customDisabledDate(current, formGroup);
    };
  }

  confirm(){
    const {
      data: formGroup,
    } = this.data.params;
    this.checkValue(formGroup);
  }

  cancel(){
    this.cancelTip();
  }

  changeEvent(e: any) {
    const val = e?.target ? e?.target?.value : e;
    this.inputValue = val;
    this.control.setValue(Array.isArray(val) && val.length === 0 ? '' : val);

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
