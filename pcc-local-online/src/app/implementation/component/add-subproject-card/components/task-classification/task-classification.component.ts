import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { OpenWindowService } from '@athena/dynamic-ui';
import { CommonService } from '../../../../service/common.service';
import { AddSubProjectCardService } from '../../add-subproject-card.service';

@Component({
  selector: 'app-task-classification',
  templateUrl: './task-classification.component.html',
  styleUrls: ['./task-classification.component.less'],
})
export class TaskClassificationComponent implements OnInit, OnChanges {
  constructor(
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private fb: FormBuilder,
    public commonService: CommonService,
    public openWindowService: OpenWindowService,
    public addSubProjectCardService: AddSubProjectCardService,
  ) { }

  @Input() identifier: string = '';
  @Input() taskStatus: string = '';
  @Output() changeSubcomponents = new EventEmitter<any>();

  public form: FormGroup;
  public classificationList: any[] = [];

  ngOnInit(): void {
    this.getClassificationList('');
    this.form = this.fb.group({
      classificationType: null,
    });

    this.form.valueChanges.subscribe((o) => this.changeSubcomponents.emit(this.form));
  }
  ngOnChanges({ identifier }: SimpleChanges): void {
    if (identifier && identifier.currentValue) {
      this.getClassificationList(identifier.currentValue);
    }
  }

  /**
 * 不禁用状态
 */
  get isForbidden() {
    return this.addSubProjectCardService.isPreview || this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  // 获取任务分类列表
  getClassificationList(identifier): void {
    // 避免多次請求
    if (this.classificationList.length) {
      this.setEcho(identifier);
      return;
    }
    this.commonService.getInvData('bm.pisc.task.classification.get', { search_info: [] })
      .subscribe(({ data: { task_classification_info = [] } = {} }) => {
        this.classificationList = task_classification_info;
        if (identifier) {
          this.setEcho(identifier);
        }
      });
  }
  // 设置回显
  setEcho(identifier): void {
    console.log(identifier, 'identifier', 12);
    this.classificationList.forEach((o) => {
      if (o.task_classification_no === identifier) {
        this.form.patchValue({
          classificationType: JSON.stringify(o),
        });
        return true;
      }
    });
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateItem(item){
    return JSON.stringify(item)
  }
}
