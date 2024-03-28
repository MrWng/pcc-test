import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChange,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { NzCascaderOption } from 'ng-zorro-antd/cascader';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddSubProjectCardService } from '../../add-subproject-card.service';

enum fields {
  company = 'eoc_company_id',
  site = 'eoc_site_id',
  region = 'eoc_region_id',
}

@Component({
  selector: 'app-eoc-select',
  templateUrl: './eoc-select.component.html',
  styleUrls: ['./eoc-select.component.less'],
})
export class EocSelectComponent implements OnInit {
  eocUrl: string;
  options: NzCascaderOption[] = [];
  schema: any[] = ['eoc_company_id', 'eoc_site_id', 'eoc_region_id'];
  formControl: FormControl;
  eocCompanyId: any;
  allowClear = false;
  eocCompanyList: any[] = [];
  eocSiteList: any[] = [];
  eocRegionList: any[] = [];

  @Input() eocCompanyInfo: any;
  @Input() eocSiteId: any;
  @Input() eocRegionId: any;
  @Input() eocCompanyIds: any;
  @Input() disbale: Boolean = false;

  @Output() currentEocInfo = new EventEmitter();



  constructor(
    protected changeRef: ChangeDetectorRef,
    protected elementRef: ElementRef,
    private systemConfigService: DwSystemConfigService,
    private http: HttpClient,
    public addSubProjectCardService: AddSubProjectCardService
  ) {
    this.systemConfigService.get('eocUrl').subscribe((url: string): void => {
      this.eocUrl = url;
    });

    this.formControl = new FormControl([]);
  }

  ngOnInit(): void {
    this.formControl.valueChanges.subscribe((value): void => {
      // this.updateGroup();
      // this.blur.emit({
      //   type: 'manual-trigger',
      // });
    });
    this.initData();
  }

  ngOnChanges(changes: SimpleChange) {
    if (changes['eocCompanyIds']) {
      this.fillCompanyBack();
    }
    if (changes['eocSiteId']) {
      this.fillSiteBack();
    }
    if (changes['eocRegionId']) {
      this.fillRegionBack();
    }
  }

  fillCompanyBack(): void {
    if (this.eocCompanyInfo.id) {
      this.eocCompanyList.forEach((company: any): void => {
        if (company.id === this.eocCompanyInfo.id) {
          this.eocCompanyId = company;
        }
      });
    } else {
      this.eocCompanyId = this.eocCompanyInfo;
    }
  }

  fillSiteBack(): void {
    const { eocSiteId } = this.addSubProjectCardService;
    if (eocSiteId.id) {
      this.eocSiteList.forEach((site: any): void => {
        if (site.id === this.addSubProjectCardService.eocSiteId.id) {
          this.addSubProjectCardService.eocSiteId = site;
        }
      });
    }
  }

  fillRegionBack(): void {
    if (this.addSubProjectCardService.eocRegionId.id) {
      this.eocRegionList.forEach((region: any): void => {
        if (region.id === this.addSubProjectCardService.eocRegionId.id) {
          this.addSubProjectCardService.eocRegionId = region;
        }
      });
    }
  }

  onSelectionChange(selectedOptions: NzCascaderOption[]): void {
    this.eocCompanyId = selectedOptions[0];
    this.currentEocInfo.emit(selectedOptions);
  }

  initData(): void {
    const observables = this.generateObservables();
    combineLatest(observables)
      .pipe(
        map((responses): Map<string, any> => {
          const resMap: Map<string, any> = new Map();
          responses.forEach((item): void => {
            const { type } = item;
            resMap.set(type, item);
          });
          return resMap;
        })
      )
      .subscribe((response): void => {
        this.options = this.generateOptions(response);
        if (this.addSubProjectCardService.buttonType !== 'EDIT') {
          this.eocCompanyId = this.options[0];
          this.currentEocInfo.emit([
            this.options[0],
            this.options[0]?.children[0],
            this.options[0]?.children[0]?.children[0],
          ]);
        }
        this.setInitValue();
      });
  }

  generateObservables(): Observable<any>[] {
    const schemas = this.schema;
    const observables = schemas.map((schema): Observable<any> => {
      let observable;
      switch (true) {
        case schema.includes(fields.company):
          observable = this.postCompany().pipe(
            map((response): any => {
              let list = [];
              if (response.code === 200) {
                this.eocCompanyList = response.data;
                this.fillCompanyBack();
                list = response?.data ?? [];
              }
              return {
                type: fields.company,
                list,
              };
            })
          );
          break;
        case schema.includes(fields.site):
          observable = this.postFactory().pipe(
            map((response): any => {
              let list = [];
              if (response.code === 200) {
                this.eocSiteList = response.data;
                this.fillSiteBack();
                list = response?.data ?? [];
              }

              return {
                type: fields.site,
                list,
              };
            })
          );
          break;
        case schema.includes(fields.region):
          observable = this.getArea().pipe(
            map((response): any => {
              let list = [];
              if (response.code === 200) {
                this.eocRegionList = response.data.list;
                this.fillRegionBack();
                list = (response?.data?.list ?? []).map(({ id, name }): any => ({ id, name }));
              }
              return {
                type: fields.region,
                list,
              };
            })
          );
          break;
        default:
          break;
      }
      return observable;
    });
    return observables;
  }

  generateOptions(response: any): any[] {
    let options = response.get(fields.company)?.list ?? [];

    if (response.has(fields.site)) {
      const list = response.get(fields.site)?.list ?? [];
      options.length
        ? options.forEach(
          (point): void =>
            (point.children = list.filter(({ companyId }): boolean => companyId === point.id))
        )
        : (options = list);
    }

    if (response.has(fields.region)) {
      const list = response.get(fields.region)?.list ?? [];
      options.length
        ? options.forEach((point): void => {
          Reflect.has(point, 'children') && point.children.length
            ? point.children.forEach((target): void => (target.children = list))
            : (point.children = list);
        })
        : (options = list);
    }
    this.formatOption(options);
    return options;
  }

  formatOption(list: any[]): void {
    if (Array.isArray(list)) {
      list.forEach((item): void => {
        item.isLeaf = !item?.children?.length;
        if (!item.isLeaf) {
          this.formatOption(item.children);
        }
      });
    }
  }

  postCompany(body: any = {}): Observable<any> {
    const url = `${this.eocUrl}/api/eoc/v2/corp/company`;
    return this.http.post(url, body);
  }

  postFactory(body: any = {}): Observable<any> {
    const url = `${this.eocUrl}/api/eoc/v2/corp/factory`;
    return this.http.post(url, body);
  }

  getArea(): Observable<any> {
    const url = `${this.eocUrl}/api/eoc/v2/area`;
    return this.http.get(url);
  }

  setInitValue(): void {
    // const value = [];
    // const { value: raw } = this.group;
    // this.schema.forEach((schema): void => {
    //   value.push(raw[schema] ?? '');
    // });
    // if (value.some((item): boolean => !!item)) {
    //   this.formControl.setValue(value, {
    //     emitEvent: false,
    //   });
    // }
  }
  updateGroup(): void {
    const value = this.formControl.value;
    const patchValue = {};
    this.schema.forEach((schema, i): void => {
      patchValue[schema] = value[i];
    });
    // this.group.patchValue(patchValue);
  }
}
