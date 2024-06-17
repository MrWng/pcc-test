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
import {
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormService,
  DynamicTableModel,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { BaseInfoFormService } from './base-info-form.service';
import { ProblemHandlingService, pageDataChangeEmitterType } from '../../problem-handling.service';
import { BaseDynamicCompBuilder } from 'app/implementation/class/DynamicCom';
import { CommonService } from 'app/implementation/service/common.service';
import { AthMessageService } from '@athena/design-ui/src/components/message';

@Component({
  selector: 'app-base-info-form',
  templateUrl: './base-info-form.component.html',
  styleUrls: ['./base-info-form.component.less'],
  providers: [BaseInfoFormService],
})

/**
 * 项目计划维护
 */
export class BaseInfoFormComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    private athMessageService: AthMessageService,
    public baseInfoFormService: BaseInfoFormService,
    private formService: DynamicFormService,
    private problemHandlingService: ProblemHandlingService
  ) {}
  ngOnInit() {
    this.problemHandlingService.pageDataChangeEmitter.subscribe(({ data, type }) => {
      switch (type) {
        case pageDataChangeEmitterType.INIT:
          const { question_list_process_info, question_do_info, attachment, ...rest } = data;
          this.baseInfoFormService.generateDynamicCop(rest);
          this.changeRef.markForCheck();
          return;
        case pageDataChangeEmitterType.UPDATE:
          return;
      }
    });
  }
  ngOnChanges() {}
  ngOnDestroy() {}
}
