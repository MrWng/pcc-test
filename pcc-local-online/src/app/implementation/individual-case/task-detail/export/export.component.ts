import { ChangeDetectorRef, Component, ElementRef, Input, OnInit } from '@angular/core';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { TranslateService } from '@ngx-translate/core';
import { ICellRendererParams } from 'ag-grid-community';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { TaskDetailService } from '../task-detail.service';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.less'],
})
export class ExportComponent extends AcBaseCellComponent implements OnInit {
  @Input() isShow: boolean = true;
  @Input() backendParams = {};
  constructor(
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private translateService: TranslateService,
    public taskDetailService: TaskDetailService
  ) {
    super(elementRef, changeRef);
  }
  get tabSelectedIndex() {
    return this.taskDetailService.tabSelectedIndex;
  }
  ngOnInit() {}
}
