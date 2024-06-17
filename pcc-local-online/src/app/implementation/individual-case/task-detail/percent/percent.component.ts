import { ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { isEmpty, multiple } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';

@Component({
  selector: 'app-percent',
  templateUrl: './percent.component.html',
  styleUrls: ['./percent.component.less'],
})
export class PercentComponent extends AcBaseCellComponent implements OnInit {
  isEmpty = isEmpty;
  get value() {
    return this.data.data.get('percentageOfTheWholeMachine')?.value || 0;
  }
  constructor(
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    public wbsService: DynamicWbsService,
    private translateService: TranslateService
  ) {
    super(elementRef, changeRef);
  }

  ngOnInit() {}
}
