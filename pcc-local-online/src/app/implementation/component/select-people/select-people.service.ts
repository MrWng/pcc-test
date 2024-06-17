import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BaseDynamicCompBuilder } from 'app/implementation/class/DynamicCom';
import { DynamicFormService } from '@athena/dynamic-core';
import { CreateDynamicFormCopService } from 'app/implementation/service/create-dynamic-form-cop.setvice';
import { CommonService } from 'app/implementation/service/common.service';
import { CreateDynamicCopRulesService } from 'app/implementation/service/create-dynamic-cop-rules.service';
import { CreateDynamicTableCopService } from 'app/implementation/service/create-dynamic-table-cop.setvice';

@Injectable()
export class PccSelectPeopleService {
  // 记录机制的content参数
  content: any;
  constructor(
    public commonService: CommonService,
    private translateService: TranslateService,
    public formService: DynamicFormService
  ) {}
}
