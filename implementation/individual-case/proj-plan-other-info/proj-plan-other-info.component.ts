import { Component, OnInit, Input, ChangeDetectorRef, ElementRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  DwFormGroup,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
  DynamicTableModel,
  isEmpty,
} from '@ng-dynamic-forms/core';
import { CommonService } from '../../service/common.service';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { TranslateService } from '@ngx-translate/core';
import { APIService } from '../../service/api.service';
import { Subscription } from 'rxjs';
import { ProjPlanOtherInfoService } from './proj-plan-other-info.service';
import { AthModalService } from 'ngx-ui-athena/src/components/modal';
import { AthMessageService } from 'ngx-ui-athena/src/components/message';
@Component({
  selector: 'app-dynamic-proj-plan-other-info',
  templateUrl: './proj-plan-other-info.component.html',
  styleUrls: ['./proj-plan-other-info.component.less'],
  providers: [ProjPlanOtherInfoService],
})
export class ProjPlanOtherInfoComponent implements OnInit {
  subs: Subscription[] = [];
  public curFormGroup: DwFormGroup;
  public curFormLayout: DynamicFormLayout;
  public curFormModel: DynamicTableModel[];
  isSpinning: boolean = true;
  delBtnDisabled: boolean = true;
  saveBtnDisabled: boolean = false;
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public wbsService: CommonService,
    public openWindowService: OpenWindowService,
    private translateService: TranslateService,
    public fb: FormBuilder,
    public apiService: APIService,
    private projPlanOtherInfoService: ProjPlanOtherInfoService,
    private formService: DynamicFormService,
    private modal: AthModalService,
    private athMessageService: AthMessageService
  ) {}
  @Input() data: any;
  ngOnInit() {
    this.buildDynamicComp();
    this.projPlanOtherInfoService
      .getOpportunity({
        project_no: this.projectInfo.project_no,
      })
      .then((res) => {
        if (isEmpty(res)) {
          this.delBtnDisabled = true;
        } else {
          this.curFormGroup.get('business_info').patchValue(res[0]);
          this.delBtnDisabled = false;
          this.changeRef.markForCheck();
        }
      })
      .finally(() => {
        this.isSpinning = false;
        this.changeRef.markForCheck();
      });
  }
  ngOnDestory() {}
  get projectInfo() {
    return this.data._component.wbsService.projectInfo;
  }
  get copEditable() {
    return this.projectInfo.project_status !== '60' && this.projectInfo.project_status !== '40';
  }
  buildDynamicComp(): void {
    const source = this.projPlanOtherInfoService.getJSONTemplate({}, this.copEditable);
    source.layout = Array.isArray(source?.layout) ? source.layout : [];
    source.content = source.content || {};
    const initializedData = this.formService.initData(
      source.layout as any,
      source.pageData,
      source.rules as any,
      source.style,
      source.content
    );
    this.curFormLayout = initializedData.formLayout; // 样式
    this.curFormModel = initializedData.formModel; // 组件数据模型
    this.curFormGroup = initializedData.formGroup; // formGroup
  }
  async submit(): Promise<any> {
    try {
      await this.projPlanOtherInfoService.updateOpportunity({
        ...(this.curFormGroup.get('business_info') as DwFormGroup).getRawValue(),
        project_no: this.projectInfo.project_no,
      });
      this.athMessageService.success(
        this.projPlanOtherInfoService.translatedDefaultWord('保存成功')
      );
      this.delBtnDisabled = false;
      this.changeRef.markForCheck();
    } catch (error) {}
  }
  deleteHandle(): void {
    this.modal.confirm({
      nzContent: `<span class="tip-info">${this.projPlanOtherInfoService.translatePccWord(
        '当前操作将会删除数据'
      )}</span>`,
      nzClassName: 'pcc-export-confirm',
      nzOnOk: async () => {
        try {
          await this.projPlanOtherInfoService.deleteOpportunity({
            project_no: this.projectInfo.project_no,
          });
          this.athMessageService.success(
            this.projPlanOtherInfoService.translatedDefaultWord('删除成功')
          );
          this.curFormGroup.reset();
          this.delBtnDisabled = true;
          this.changeRef.markForCheck();
        } catch (error) {}
      },
      nzOnCancel: () => {},
    });
  }
}
