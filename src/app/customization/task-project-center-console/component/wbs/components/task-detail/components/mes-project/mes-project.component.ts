import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  SkipSelf,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { MesProjectService } from './mes-project.service';

import { CommonService } from '../../../../../../service/common.service';

@Component({
  selector: 'app-mes-project',
  templateUrl: './mes-project.component.html',
  styleUrls: ['./mes-project.component.less'],
  providers: [MesProjectService],
})
export class MesProjectComponent implements OnInit, OnChanges {
  @Input() list: any;
  @Input() compneyId: any;
  listOfMapData: any = [];
  listOfChildrenData: any = [];
  isLoading: Boolean = false;

  constructor(
    @SkipSelf()
    protected changeRef: ChangeDetectorRef,

    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    protected translateService: TranslateService,
    protected commonService: CommonService
  ) {}

  ngOnInit() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.list) {
      this.list.forEach((res) => {
        res.expand = false;
      });
      this.listOfMapData = this.list;
    }
  }
  tableExpand(data) {
    this.isLoading = true;
    const params = {
      doc_info: [
        {
          wo_no: data.wo_no,
          op_no: data.op_no,
        },
      ],
    };
    this.commonService
      .getInvData('wo.project.production.qc.data.get', params, this.compneyId)
      .subscribe((res): void => {
        this.listOfChildrenData = res.data.doc_info;
        this.isLoading = false;
        this.changeRef.markForCheck();
      });
  }
}
