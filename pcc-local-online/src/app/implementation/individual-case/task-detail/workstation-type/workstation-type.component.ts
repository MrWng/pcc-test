import { ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { isEmpty } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';

@Component({
  selector: 'app-workstation-type',
  templateUrl: './workstation-type.component.html',
  styleUrls: ['./workstation-type.component.less'],
})
export class WorkstationTypeComponent extends AcBaseCellComponent implements OnInit {
  isEmpty = isEmpty;
  constructor(
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private translateService: TranslateService
  ) {
    super(elementRef, changeRef);
  }
  typeMap = {
    1: this.translateService.instant('dj-pcc-生产2'),
    2: this.translateService.instant('dj-pcc-调试'),
  };
  get value() {
    const v = this.data.data.get('workstationType')?.value;
    return this.typeMap[v] || v;
  }
  ngOnInit() {
    console.log(this.data);
  }
}
