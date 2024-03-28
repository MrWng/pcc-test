import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SubmitSpinService } from '@ng-dynamic-forms/ui-ant-web';

@Component({
  selector: 'app-default-layout',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.less'],
})
export class DefaultLayoutComponent {
  constructor(public submitSpinService: SubmitSpinService, public router: Router) {}
}
