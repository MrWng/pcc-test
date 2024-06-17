import {
  ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter,
  Input, OnChanges, OnInit,
  Output, SimpleChanges,
} from '@angular/core';
import { CommonService } from 'app/implementation/service/common.service';
import { ICellRendererParams } from 'ag-grid-community';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { WorkloadQtyService } from './workload-qty.service';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-workload-qty',
  templateUrl: './workload-qty.component.html',
  styleUrls: ['./workload-qty.component.less'],
  providers: [WorkloadQtyService],
})

// @ts-ignore
export class WorkloadQtyComponent extends AcBaseCellComponent implements OnInit, OnChanges {
  @Input() nzPlaceHolder;
  @Input() valueChanged;
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();

  value?: any;
  control?: any;
  precision: number = 9;
  infoCheck?: any;

  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef
  ) {
    super(elementRef, changeRef);
  }

  /**
   * 初始化勾子函数
   *
   * @param params
   */
  athOnInit(params: ICellRendererParams) {
    super.athOnInit(params);
    const {
      colDef: { field },
      data: formGroup,
    } = params;
    this.value = formGroup.value[field];
    if(Number.isInteger(this.value)){
      this.precision = 0;
    }else{
      this.precision = 9;
    }
    this.control = formGroup.controls[field];
    this.control['infoCheck'] = (res?:any)=> {
      this.infoCheck = res;
      this.changeRef.markForCheck();
    };
    this.control.valueChanges.pipe(debounceTime(1000)).subscribe(res => {
      setTimeout(() => {
        this.value = res;
        this.changeRef.markForCheck();
      }, 0);
    });
  }

  onChange($event: any) {
    this.precision = 0;
    if (this.control && this.control.patchValue) {
      const nowValue = $event;
      this.control.patchValue(Array.isArray(nowValue) && nowValue.length === 0 ? null : nowValue);
      this.value = nowValue;
      if (this.valueChanged) {
        setTimeout(() => {
          this.valueChanged({ newValue: nowValue, control: this.control, path: this.control._path });
        }, 0);
      }
      if (this.control.errors) {
        this._validator();
      }
    }
  }

  onFocus($event: any) {
    if(this.control.value === 0){
      this.value = null;
    }
  }

  onBlur($event: any) {
    if(this.control.value === 0 && !this.value){
      this.value = 0;
    }
  }

  clear(e: Event) {
    e.stopPropagation();
    // @ts-ignore
    this.control.setValue(nzCheckable ? [] : '');
    this.callback(this.group);
  }
}
