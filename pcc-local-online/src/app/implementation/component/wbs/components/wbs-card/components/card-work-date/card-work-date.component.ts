import { Component, OnInit, Input } from '@angular/core';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-card-work-date',
  templateUrl: './card-work-date.component.html',
  styleUrls: ['./card-work-date.component.less'],
})
export class CardWorkDateComponent implements OnInit {
  constructor(public wbsService: DynamicWbsService, private translateService: TranslateService) {}
  @Input() cardInfo;
  ngOnInit() {}
}
