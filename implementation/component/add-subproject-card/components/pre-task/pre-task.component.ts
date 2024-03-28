import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NzTreeNode } from 'ng-zorro-antd/tree';
import { AddSubProjectCardService } from '../../add-subproject-card.service';

@Component({
  selector: 'app-pre-task',
  templateUrl: './pre-task.component.html',
  styleUrls: ['./pre-task.component.less']
})
export class PreTaskComponent implements OnInit {
  /** 前置任务列表 */
  @Input() preTaskNumList: any

  @Input() taskDependencyInfoList: any[] = []

  /** 前置任务内容变化回调事件 */
  @Output() callPreTaskChange = new EventEmitter();

  // validateForm: FormArray = this.fb.array([]);

  validateForm: FormGroup = this.fb.group({
    preTaskList: this.fb.array([])
  })

  get preTaskList() {
    return this.validateForm.get('preTaskList') as FormArray;
  }

  /** 选择的前置任务被提前/排后 */
  advanceLagTypeOfOption = [
    { label: this.translateService.instant('dj-default-提前'), value: -1 },
    { label: this.translateService.instant('dj-default-滞后'), value: 1 },
  ];


  /** 前置任务下拉上拉状态 */
  isShowBeforeTaskStatus: boolean = false;

  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private fb: FormBuilder
  ) { }

  /**
  * 不禁用状态
  */
  get isForbidden() {
    return this.addSubProjectCardService.currentCardInfo?.isCollaborationCard;
  }

  ngOnInit(): void {
    this.taskDependencyInfoList.forEach(item => {
      const control = this.fb.group({
        before_task_no: item.before_task_no,
        dependency_type: item.dependency_type,
        advance_lag_type: item.advance_lag_type,
        advance_lag_days: item.advance_lag_days,
      });
      this.preTaskList.push(control);
    });
    this.validateForm.valueChanges.pipe().subscribe(res => {
      this.callPreTaskChange.emit(res.preTaskList);
    });

  }

  /**
   * 添加表单组项
   */
  addFormArrayItem() {
    const info = this.fb.group({
      before_task_no: '',
      dependency_type: 'FS',
      advance_lag_type: -1,
      advance_lag_days: 0,
    });
    this.preTaskList.push(info);
  }

  /**
   * 删除表单组项
   */
  deleteBeforeTask(index) {
    this.preTaskList.removeAt(index);
  }

  /**
   * html 中文字翻译
   * @param val
   */
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  /**
   * 更改前置任务下拉上拉状态
   */
  changeBeforeStatusFoldStatus(): void {
    this.isShowBeforeTaskStatus = !this.isShowBeforeTaskStatus;
  }

  displayWith = (node: NzTreeNode) => node.title

}
