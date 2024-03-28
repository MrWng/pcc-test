import { Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AddSubProjectCardService } from '../../add-subproject-card.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentStageService {

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    public translateService: TranslateService,
    public openWindowService: OpenWindowService,
    private fb: FormBuilder,
  ) { }

  /**
   * 选择任务模板开窗
   * @returns
   */
  openChooseTaskTemplate(openPaymentWindowDefine): Observable<any> {
    return new Observable(observable => {
      openPaymentWindowDefine.executeContext = openPaymentWindowDefine.executeContext
        ? openPaymentWindowDefine.executeContext
        : {};
      openPaymentWindowDefine.executeContext.pattern = 'com';
      openPaymentWindowDefine.executeContext.pageCode = 'task-detail';
      const operations = [
        {
          title: this.translateService.instant('dj-default-选择款项阶段'),
          description: this.translateService.instant('dj-default-建议人工处理'),
          operate: 'openwindow',
          openWindowDefine: {
            title: this.translateService.instant('dj-default-选择款项阶段'),
            selectedFirstRow: false,
            multipleSelect: false,
            rowSelection: 'single',
            allAction: {
              defaultShow: false,
              dataSourceSet: openPaymentWindowDefine.dataSourceSet,
              executeContext: openPaymentWindowDefine.executeContext,
            },
            buttons: [
              {
                title: this.translateService.instant('dj-default-确定'),
                actions: [
                  {
                    category: 'UI',
                    backFills: [
                      {
                        key: 'instalment_stage',
                        valueScript: "selectedObject['instalment_stage']",
                      },
                      {
                        key: 'instalment_stage_name',
                        valueScript: "selectedObject['instalment_stage_name']",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ];
      const selectRow = this.fb.group({ order_info: [''] });
      this.openWindowService.openWindow(selectRow, operations, [], '', '', (res: Array<any>) => {
        observable.next(res[0]);
      });
    });
  }
}
