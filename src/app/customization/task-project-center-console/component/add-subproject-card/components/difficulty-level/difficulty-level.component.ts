import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, SimpleChanges, OnChanges, } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { OpenWindowService } from '@ng-dynamic-forms/ui-ant-web';
import { CommonService } from '../../../../service/common.service';
import { AddSubProjectCardService } from '../../add-subproject-card.service';

// 难度等级
@Component({
  selector: 'app-difficulty-level',
  templateUrl: './difficulty-level.component.html',
  styleUrls: ['./difficulty-level.component.less']
})
export class DifficultyLevelComponent implements OnInit, OnChanges {

  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private fb: FormBuilder,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    public addSubProjectCardService: AddSubProjectCardService
  ) { }

  @Input() identifier: string = '';
  @Input() taskStatus: string = ''; // 任务状态>10，未开始，该项为只读
  @Output() changeSubcomponents = new EventEmitter<any>();

  public form: FormGroup;
  public dataList: any[] = [];
  task_status: number = 0;

  ngOnInit(): void {
    this.task_status = Number(this.taskStatus);
    this.getClassificationList('');
    this.form = this.fb.group({ difficultyLevelObj: null });
    this.form.valueChanges.subscribe((o) => this.changeSubcomponents.emit(this.form));
  }

  ngOnChanges({ identifier }: SimpleChanges): void {
    this.task_status = Number(this.taskStatus);
    if (identifier && identifier.currentValue) {
      this.getClassificationList(identifier.currentValue);
    }
  }

  /**
* 不禁用状态
*/
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  // 获取任务分类列表
  getClassificationList(identifier): void {
    // 避免多次請求
    if (this.dataList.length) {
      this.setEcho(identifier);
      return;
    }
    const params = {
      enterprise_no: '企業編號',
      site_no: '營運據點'
    };
    this.commonService.getInvData('bm.pisc.difficulty.level.get', params)
      .subscribe(({ data: { difficulty_level_info = [] } = {} }) => {
        this.dataList = difficulty_level_info;
        if (identifier) {
          this.setEcho(identifier);
        }
      });
  }

  // 设置回显
  setEcho(identifier): void {
    console.log(identifier, 'identifier');
    this.dataList.forEach((obj) => {
      if (obj.difficulty_level_no === identifier) {
        this.form.patchValue({ difficultyLevelObj: obj, });
        return true;
      }
    });
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

}
