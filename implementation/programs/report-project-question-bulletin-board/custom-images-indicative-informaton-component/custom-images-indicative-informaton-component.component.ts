import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import { DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicFormLayoutService, DynamicFormValidationService } from '@athena/dynamic-core';
// eslint-disable-next-line max-len
import { DynamicCustomImagesIndicativeInformationComponentModel } from '../../../model/custom-images-indicative-informaton-component/custom-images-indicative-informaton-component.model';
import { CustomImagesIndicativeInformatonService } from './custom-images-indicative-informaton-component.service';
import { HttpClient } from '@angular/common/http';
import { CommonService } from 'app/implementation/service/common.service';
import { DwSystemConfigService } from '@webdpt/framework';

@Component({
  selector: 'app-images-indicative-information',
  templateUrl: './custom-images-indicative-informaton-component.component.html',
  styleUrls: ['./custom-images-indicative-informaton-component.component.less'],
  providers: [CustomImagesIndicativeInformatonService]
})
export class CustomImagesIndicativeInformatonComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicCustomImagesIndicativeInformationComponentModel;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private customImagesIndicativeInformatonService: CustomImagesIndicativeInformatonService,
    public commonService: CommonService,
    private http: HttpClient,
    private configService: DwSystemConfigService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() { }
}
