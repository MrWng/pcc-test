import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class AppErrorHandleService implements ErrorHandler {
  constructor(private translateService: TranslateService,private messageService: NzMessageService) {}
  handleError(error: any): void {
    // 如果是http的错误
    if (error instanceof HttpErrorResponse) {
      if (error.error && error.error.errorMessage) {
        if (error.error.errorCode === '1001105') {
          this.messageService.error(this.translateService.instant('dj-default-租户不正确！'));
        } else {
          this.messageService.error(error.error.errorMessage);
        }
      } else {
        this.messageService.error(error.message);
      }
    }
    console.error(error);
  }
}
