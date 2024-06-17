import { ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { DwFormGroup, isEmpty } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { ICellRendererParams } from 'ag-grid-community';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';

@Component({
  selector: 'app-completion-status',
  templateUrl: './completion-status.component.html',
  styleUrls: ['./completion-status.component.less'],
})
export class CompletionStatusComponent extends AcBaseCellComponent implements OnInit {
  isEmpty = isEmpty;
  constructor(
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private translateService: TranslateService
  ) {
    super(elementRef, changeRef);
  }
  enumValue = {
    1: this.translateService.instant('dj-pcc-未完工'),
    2: this.translateService.instant('dj-pcc-已完工'),
  };
  enumClass = {
    1: '',
    2: 'completed',
  };
  get value() {
    return this.data.data.get('completionStatus')?.value || '1';
  }
  ngOnInit() {}
  /**
   * 初始化勾子函数
   *
   * @param params
   */
  athOnInit(params: ICellRendererParams) {
    super.athOnInit(params);
  }
}
