import {
  ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter,
  Input, OnInit,
  Output,
} from '@angular/core';
import { CommonService } from 'app/implementation/service/common.service';
import { ICellRendererParams } from 'ag-grid-community';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { CellCheckBoxService } from './cell-checkBox.service';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';

@Component({
  selector: 'app-cell-check-box',
  templateUrl: './cell-checkBox.component.html',
  styleUrls: ['./cell-checkBox.component.less'],
  providers: [CellCheckBoxService],
})

// @ts-ignore
export class CellCheckBoxComponent extends AcBaseCellComponent implements OnInit {
  @Input() nzPlaceHolder;
  @Input() valueChanged;
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();

  value?: any;
  control?: any;

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
    this.control = formGroup.controls[field];
  }

  onChange($event: any) {
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

  clear(e: Event) {
    e.stopPropagation();
    // @ts-ignore
    this.control.setValue(nzCheckable ? [] : '');
    this.callback(this.group);
  }
}
