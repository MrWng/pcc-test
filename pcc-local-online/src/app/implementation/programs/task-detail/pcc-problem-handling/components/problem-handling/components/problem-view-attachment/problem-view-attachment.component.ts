import { Component, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';
import { ProblemHandlingService } from '../../problem-handling.service';
import { DwFormArray, DwFormGroup, isNotEmpty } from '@athena/dynamic-core';
import { CommonService } from 'app/implementation/service/common.service';

@Component({
  selector: 'app-problem-view-attachment',
  templateUrl: './problem-view-attachment.component.html',
  styleUrls: ['./problem-view-attachment.component.less'],
})
export class ProblemViewAttachmentComponent implements OnInit, OnChanges {
  @Input() pageData: any;
  @Input() btnLoading: boolean = false;
  uploadGroupLoading: DwFormGroup;
  uploadGroupReal: DwFormGroup;
  constructor(
    public problemHandlingService: ProblemHandlingService,
    public commonService: CommonService
  ) {}
  createdUploadCop: boolean = false;
  ngOnInit() {
    this.uploadGroupLoading = this.problemHandlingService.generateDynamicCop({
      loading: this.btnLoading,
      ...(this.pageData?.attachment || {}),
    });
  }

  ngOnChanges(changes) {
    if (
      changes.pageData &&
      changes.pageData.currentValue &&
      isNotEmpty(this.pageData?.attachment)
    ) {
      // 生成问题附件
      this.uploadGroupReal = this.problemHandlingService.generateDynamicCop(
        this.pageData?.attachment || {}
      );
    }
  }
}
