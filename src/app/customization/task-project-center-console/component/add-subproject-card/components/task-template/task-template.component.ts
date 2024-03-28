import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AddSubProjectCardService } from '../../add-subproject-card.service';
import { TaskTemplateService } from '../../services/task-template.service';

@Component({
  selector: 'app-task-template',
  templateUrl: './task-template.component.html',
  styleUrls: ['./task-template.component.less']
})
export class TaskTemplateComponent implements OnInit {
  @Input() openWindowDefine = {}

  @Output() taskTemplateChange = new EventEmitter();
  @Output() taskTemplateDelete = new EventEmitter();


  constructor(
    public addSubProjectCardService: AddSubProjectCardService,
    protected changeRef: ChangeDetectorRef,
    private messageService: NzMessageService,
    private translateService: TranslateService,
    private taskTemplateService: TaskTemplateService,
  ) { }

  ngOnInit(): void {
  }

  /**
   * 选择任务模板开窗
   * @returns
   */
  chooseTaskTemplate(): void {
    if (!this.addSubProjectCardService.eocCompanyId) {
      this.messageService.error(
        this.translateService.instant(
          'dj-default-必须有公司、据点、营运编号后才可以选择任务模板开窗'
        )
      );
      return;
    }
    this.taskTemplateService.openChooseTaskTemplate(this.openWindowDefine).subscribe(selectOption => {
      this.taskTemplateChange.emit(selectOption);
    });
  }

  translateWord(value) {
    return this.translateService.instant(`dj-default-${value}`);
  }

  deleteTaskTemplate(e) {
    e.stopPropagation();
    this.taskTemplateDelete.emit();
  }

}
