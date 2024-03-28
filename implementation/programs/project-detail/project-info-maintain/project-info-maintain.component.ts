import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DynamicFormControlComponent,
  DynamicFormControlLayout,
  DynamicFormLayout,
  DynamicFormLayoutService,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../service/common.service';
import {
  DynamicProjectInfoMaintainModel
} from 'app/customization/task-project-center-console/model/project-info-maintain/project-info-maintain.model';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DwUserService } from '@webdpt/framework/user';

@Component({
  selector: 'app-project-info-maintain',
  templateUrl: './project-info-maintain.component.html',
  styleUrls: ['./project-info-maintain.component.less'],
})
export class ProjectInfoMaintainComponent extends DynamicFormControlComponent implements OnInit {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicProjectInfoMaintainModel
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();

  // 母项目信息
  programInfo: any;
  // 子项目信息
  project_info: any;
  // 起讫时间是否被修改过
  isModified: boolean = false;
  // 是否显示提示消息
  tipMessage: boolean = false;
  hasPermission: boolean = false;


  constructor(
    protected elementRef: ElementRef,
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    public commonService: CommonService,
    private message: NzMessageService,
    private userService: DwUserService,

  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.commonService.content = this.model?.content;
    this.getProgramNumberAndInfo();
  }

  /**
   * 获取项目集编号和项目信息
  */
  getProgramNumberAndInfo(): void {
    const { projectSet_info } = this.model.content?.executeContext?.taskWithBacklogData?.bpmData ?? {};
    const { project_set_no } = projectSet_info.at(0);
    this.commonService.getInvData('bm.pisc.project.set.get', { project_set_info: [{ project_set_no }] }).subscribe((res: any): void => {
      this.programInfo = res.data?.project_set_info.at(0) ?? {};
      this.getPermission();
    });
    this.commonService.getInvData('bm.pisc.project.get', { project_info: [{ project_set_no: project_set_no }] })
      .subscribe((resp: any): void => {
        this.project_info = resp.data?.project_info ?? [];
        this.changeRef.markForCheck();
      });
  }

  /**
   *  查看当前是否具有编辑权限
   *  1 当前账号和卡负责人一致才可编辑
   *  2 历史卡不可编辑
   */
  getPermission(): void {
    const isHistory = this.programInfo.project_status === '40' || this.programInfo.project_status === '60';
    this.commonService.searchUserInfo({ userId: this.userService.getUser('userId') }).subscribe((resData: any): void => {
      const editable = resData.data.id === this.programInfo.leader_no ? true : false;
      this.hasPermission = !editable || isHistory;
      this.changeRef.markForCheck();
    });

  }

  /**
   * 更改时间
   */
  changeTime($event, type): void {
    const date = $event ? moment($event).format('YYYY-MM-DD') : '';
    if (this.programInfo[type] === date) {
      return;
    }
    if (type === 'plan_finish_date') {
      this.tipMessage = this.project_info.find((item) => { return date < moment(item.plan_finish_date).format('YYYY-MM-DD'); });
    }
    this.programInfo[type] = date;
    this.isModified = true;
    this.changeRef.markForCheck();
  }

  /**
   * 禁用早于开始时间的日期
   * @param endValue
   * @returns
   */
  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue || !this.programInfo.plan_start_date) {
      return false;
    }
    return (
      moment(endValue).format('YYYY-MM-DD') < moment(this.programInfo.plan_start_date).format('YYYY-MM-DD')
    );
  };

  disabledStartDate = (endValue: Date): boolean => {
    if (!endValue || !this.programInfo.plan_finish_date) {
      return false;
    }
    return (
      moment(endValue).format('YYYY-MM-DD') > moment(this.programInfo.plan_finish_date).format('YYYY-MM-DD')
    );
  };


  /**
   * 是否置灰提交按钮
   */
  isActive(): boolean {
    const isVaildDate =
      moment(this.programInfo?.plan_start_date).format('YYYY-MM-DD') <= moment(this.programInfo?.plan_finish_date).format('YYYY-MM-DD');
    return this.programInfo?.plan_start_date && this.programInfo?.plan_finish_date && this.isModified && isVaildDate;
  }

  /**
   * 提交母项目信息
   */
  submit(): void {
    if (this.isActive()) {
      const params = { project_set_info: [this.programInfo] };
      this.commonService.getInvData('project.set.info.update', params).subscribe((res: any): void => {
        this.message.success(this.translateService.instant('dj-default-提交成功'));
        this.isModified = false;
        this.changeRef.markForCheck();
      });
    }
  }
}
