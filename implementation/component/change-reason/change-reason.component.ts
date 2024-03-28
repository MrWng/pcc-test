import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-change-reason',
  templateUrl: './change-reason.component.html',
})
export class ChangeReasonComponent implements OnInit {
  @Input() title: string = '';
  @Input() contentInfo: string = '';
  @Input() isTextArea: boolean = false;
  @Output() showChangeReason = new EventEmitter();
  @Output() cancelInput = new EventEmitter();
  @Output() confirmInput = new EventEmitter();
  constructor(private translateService: TranslateService, private message: NzMessageService) { }
  changeReasonVisible = false;
  changeReason: string = '';
  ngOnInit(): void { }
  showModal() {
    this.changeReasonVisible = true;
  }
  cancel() {
    this.cancelInput.emit();
    this.changeReason = '';
    this.changeReasonVisible = false;
  }
  confirm() {
    if (!this.changeReason) {
      if (this.isTextArea) {
        this.message.create('warning', this.translateService.instant('dj-pcc-请输入变更原因'));
      } else {
        this.message.create('warning', this.translateService.instant('dj-default-未检测到输入'));
      }
    } else {
      this.confirmInput.emit(this.changeReason);
      this.changeReason = '';
      this.changeReasonVisible = false;
    }
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
