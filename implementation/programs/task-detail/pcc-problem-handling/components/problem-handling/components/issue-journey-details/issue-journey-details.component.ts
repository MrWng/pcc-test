import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DwFormArray, DwFormGroup, ValidationErrorsService } from '@athena/dynamic-core';
import { Subscription } from 'rxjs';
import { IssueJourneyDetailsTableService } from './issue-journey-details.service';
import { CommonService } from 'app/implementation/service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';
import { ProblemHandlingService } from '../../problem-handling.service';
import { PccProblemHandlingService } from '../../../../pcc-problem-handling.service';

@Component({
  selector: 'app-issue-journey-details-table',
  templateUrl: './issue-journey-details.component.html',
  styleUrls: ['./issue-journey-details.component.less'],
  providers: [
    PccProblemHandlingService,
    ProblemHandlingService,
    ValidationErrorsService,
    IssueJourneyDetailsTableService,
  ],
})

/**
 * 项目计划维护
 */
export class IssueJourneyDetailsTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pageData: any[] = [];
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
    public issueJourneyDetailsTableService: IssueJourneyDetailsTableService
  ) {}
  ngOnInit() {
    this.issueJourneyDetailsTableService.generateDynamicCop(this.pageData);
  }
  ngOnChanges() {}
  ngOnDestroy() {}
  get tableFormGroup() {
    return this.issueJourneyDetailsTableService.tableGroup.get(
      this.issueJourneyDetailsTableService.tableId
    ) as DwFormArray;
  }
  get tableComponent() {
    return (this.tableFormGroup as any)._component;
  }
}
