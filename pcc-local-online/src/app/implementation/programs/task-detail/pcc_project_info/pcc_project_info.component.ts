import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { DynamicPccProjectInfoModel } from 'app/implementation/model/pcc_project_info/pcc_project_info.model';
import { PccProjectInfoService } from './pcc_project_info.service';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { AcModalService } from '@app-custom/ui/modal';
import { DynamicWbsService } from '../../../component/wbs/wbs.service';
@Component({
  selector: 'app-pcc_project_info',
  templateUrl: './pcc_project_info.component.html',
  styleUrls: ['./pcc_project_info.component.less'],
  providers: [PccProjectInfoService, CommonService, AcModalService, DynamicWbsService],
})
export class PccProjectInfoComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicPccProjectInfoModel;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();
  @ViewChild('wbsComponent')
  isVisible: boolean = false;
  tabName: string = 'app-dynamic-wbs';
  changeConfigData = null;
  tabIndex: number = 0;
  Entry = Entry;
  enableInstalment: boolean;
  // 是否是新发起的项目
  isNewProcess = '';
  hasGroundEnd: string;
  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private pccProjectInfoService: PccProjectInfoService,
    public commonService: CommonService,
    public wbsService: DynamicWbsService
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    console.log('-------1111111111---------this.model------------------', this.model);
    this.commonService.content = this.model.content;
  }
}
