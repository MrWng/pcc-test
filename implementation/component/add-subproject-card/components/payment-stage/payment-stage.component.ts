import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AddSubProjectCardService } from '../../add-subproject-card.service';
import { PaymentStageService } from './payment-stage.service';

@Component({
  selector: 'app-payment-stage',
  templateUrl: './payment-stage.component.html',
  styleUrls: ['./payment-stage.component.less']
})
export class PaymentStageComponent implements OnInit {
  @Input() openPaymentWindowDefine = {}
  @Output() paymentStageChange = new EventEmitter();

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    private paymentStageService: PaymentStageService,
    private translateService: TranslateService,
    protected changeRef: ChangeDetectorRef,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void { }

  get isDisable(): boolean {
    return this.addSubProjectCardService.isPreview || this.addSubProjectCardService.currentCardInfo?.someEdit;
  }

  /**
   * 选择款项阶段
   */
  choosePaymentPeriod(): void {
    this.paymentStageService.openChooseTaskTemplate(this.openPaymentWindowDefine).subscribe((selectOption: any[]) => {
      this.paymentStageChange.emit(selectOption);
    });
  }

  /**
  * html 中文字翻译
  * @param val
  */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
