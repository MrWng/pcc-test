import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
// eslint-disable-next-line max-len
import { DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicFormLayoutService, DynamicFormValidationService } from '@athena/dynamic-core';
// eslint-disable-next-line max-len
import { DynamicCustomImagesIpilotLampComponentModel } from '../../../model/custom-images-ipilot-lamp-component/custom-images-ipilot-lamp-component.model';
import { CustomImagesIpilotLampService } from './custom-images-ipilot-lamp-component.service';
import { CommonService } from '../../../service/common.service';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-images-ipilot-lamp',
  templateUrl: './custom-images-ipilot-lamp-component.component.html',
  styleUrls: ['./custom-images-ipilot-lamp-component.component.less'],
  providers: [CustomImagesIpilotLampService, CommonService],
})
export class CustomImagesIpilotLampComponent extends DynamicFormControlComponent implements OnInit, AfterViewInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicCustomImagesIpilotLampComponentModel;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  rowData: any = null;

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private customImagesIpilotLampService: CustomImagesIpilotLampService,
    public commonService: CommonService,
    private http: HttpClient,
    private configService: DwSystemConfigService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit() {
    if (this.group.value) {
      this.rowData = this.group.value;
    }
  }

  ngAfterViewInit() {
    this.elementRef.nativeElement.style.width = '100%';
    this.elementRef.nativeElement.style.height = '100%';
    this.elementRef.nativeElement.style.position = 'absolute';
    this.elementRef.nativeElement.style.top = '0px';
    this.elementRef.nativeElement.style.left = '0px';
    const cellRendererNode = this.elementRef.nativeElement.parentNode.parentNode.parentNode.parentNode;
    cellRendererNode.style.padding = '0px';
  }
}
