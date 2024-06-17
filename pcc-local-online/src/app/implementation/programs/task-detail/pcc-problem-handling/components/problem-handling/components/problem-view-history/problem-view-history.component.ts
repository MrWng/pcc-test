import { Component, Input, OnInit } from '@angular/core';
import { AthModalService } from '@athena/design-ui';
import { CommonService } from 'app/implementation/service/common.service';
import { IssueJourneyDetailsTableComponent } from '../issue-journey-details/issue-journey-details.component';
import { DwFormGroup, DynamicFormLayout, DynamicTableModel } from '@athena/dynamic-core';

@Component({
  selector: 'app-problem-view-history',
  templateUrl: './problem-view-history.component.html',
  styleUrls: ['./problem-view-history.component.less'],
  providers: [AthModalService],
})
export class ProblemViewHistoryComponent implements OnInit {
  @Input() pageData: any;
  @Input() btnLoading: boolean = false;
  constructor(public modalService: AthModalService, public commonService: CommonService) {}

  ngOnInit() {}
  viewJourneys() {
    this.modalService.create({
      nzTitle: this.commonService.translatePccWord('问题历程详情'),
      nzKeyboard: false,
      nzMaskClosable: false,
      nzWrapClassName: 'ath-grid-modal-wrap',
      nzFooter: null,
      nzBodyStyle: { height: '600px' },
      nzContent: IssueJourneyDetailsTableComponent,
      nzComponentParams: {
        pageData: this.pageData.question_list_process_info || [],
      },
      gridConfig: {
        span: 12,
        modalType: 'table-modal',
      },
    });
  }
}
