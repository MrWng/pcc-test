import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormGroup, FormBuilder, AbstractControl } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
  cloneDeep,
  DynamicUserBehaviorCommService,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicViewProjectProgressModel } from '../../../model/view-project-progress/view-project-progress.model';
import { ViewProjectProgressService } from './view-project-progress.service';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { APIService } from 'app/implementation/service/api.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { AddSubProjectCardService } from 'app/implementation/component/add-subproject-card/add-subproject-card.service';
import { DynamicWbsService } from 'app/implementation/component/wbs/wbs.service';
import { DwUserService } from '@webdpt/framework/user';
import { WbsTabsService } from 'app/implementation/component/wbs-tabs/wbs-tabs.service';
import { AcModalService } from '@app-custom/ui/modal';
@Component({
  selector: 'app-dynamic-view-project-progress',
  templateUrl: './view-project-progress.component.html',
  styleUrls: ['./view-project-progress.component.less'],
  providers: [ViewProjectProgressService, DynamicWbsService, WbsTabsService, AddSubProjectCardService, CommonService, AcModalService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewProjectProgressComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicViewProjectProgressModel;
  @Input() control: AbstractControl;

  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  Entry = Entry;
  title: string = this.translateWordPcc('项目进度').toString();
  project_info: any = null;
  project_no: any;
  isVisible = false;
  isShowSpin: boolean = true; // loading
  callMask$ = new Subject<void>();

  constructor(
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    private translateService: TranslateService,
    public commonService: CommonService,
    public fb: FormBuilder,
    private userService: DwUserService,
    public viewProjectProgressService: ViewProjectProgressService,
    public apiService: APIService,
    public wbsService: DynamicWbsService,
    public dynamicUserBehaviorCommService: DynamicUserBehaviorCommService,
    private messageService: NzMessageService,
    private acModalService: AcModalService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.initMaskFn();
    this.wbsService.isTrackPages = true;
    this.wbsService.isNoPermission = true;
    this.wbsService.group = cloneDeep(this.group);
    this.wbsService.modelType = this.model.type; // 标准页面的key
    this.commonService.content = cloneDeep(this.model?.content);
    const project_no = this.group.value?.project_info[0]?.project_no
      ?? this.model.content?.executeContext?.bpmData?.project_info[0]?.project_no;
    this.wbsService.project_no = project_no ?? '';
    this.initData();
    this.changeRef.markForCheck();
  }

  /**
   * 页面，获取项目信息
   */
  initData() {
    this.commonService.getInvData('bm.pisc.project.get', { project_info: [{ project_no: this.wbsService.project_no }] })
      .subscribe((res) => {
        this.wbsService.projectInfo = res.data.project_info[0];
        this.project_info = res.data.project_info[0];
        this.changeRef.markForCheck();
        this.isEditable();
      });
  }

  /**
   * 判断任务卡是否可编辑
   * @param leader_code
   */
  isEditable(): void {
    if (this.wbsService.projectInfo?.approve_status === 'N') {
      this.wbsService.editable = false;
      this.changeRef.markForCheck();
      return;
    }
    const personInCharge = this.dynamicUserBehaviorCommService.commData?.workContent?.personInCharge ?? 'wfgp001';
    forkJoin([
      this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }),
      this.commonService.getAgentInfo({ userId: personInCharge })
    ])
      .pipe(map((responses): any => responses.map((item): any => item.data)))
      .subscribe(
        (value) => {
          if (value[0].id === value[1].agentId) {
            this.wbsService.editable = true;
            this.changeRef.markForCheck();
            return;
          };
          const isHistory = this.wbsService.projectInfo?.project_status !== '40' && this.wbsService.projectInfo?.project_status !== '60'
            ? false : true;
          const hasPermission = value[0].id === this.wbsService.projectInfo?.project_leader_code ? true : false;
          this.wbsService.editable = hasPermission && !isHistory;
          this.changeRef.markForCheck();
        });
  }

  initMaskFn(): void {
    this.callMask$.pipe(debounceTime(200)).subscribe((change: any) => {
      this.showModal();
    });
  }

  callMaskFn() {
    this.callMask$.next();
  }

  // 打开
  showModal() {
    this.isShowSpin = true;
    if (this.project_info) {
      this.isVisible = true;
      setTimeout(()=>{
        this.isShowSpin = false;
        this.changeRef.markForCheck();
      }, 1000);
    } else {
      this.isShowSpin = false;
      this.isVisible = false;
      this.messageService.info(this.translateWordPcc('暂未排定计划。').toString());
    }
    this.changeRef.markForCheck();
  }

  // 关闭
  handleOk(): void {
    this.isVisible = false;
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
}
