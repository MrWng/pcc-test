import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonService } from 'app/implementation/service/common.service';
import { AthBasicComponent } from '@athena/design-ui/src/components/table';
import { ICellRendererParams } from 'ag-grid-community';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { TaskStatusService } from './task-status.service';

@Component({
  selector: 'app-task-status',
  templateUrl: './task-status.component.html',
  styleUrls: ['./task-status.component.less'],
  providers: [TaskStatusService],
})
export class TaskStatusComponent extends AthBasicComponent {
  @Input() source;
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();

  taskStatusName;
  taskStatusColor: string = 'noStart';

  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    public commonService: CommonService,
    protected changeRef: ChangeDetectorRef
  ) {
    super();
  }
  /**
   * 初始化勾子函数
   *
   * @param params
   */
  athOnInit(params: ICellRendererParams) {
    super.athOnInit(params);
    const {
      colDef: { field },
      data: formGroup,
    } = params;
    const taskStatus = formGroup.value[field];
    let taskStatusName;
    switch (taskStatus){
      case '10':
        taskStatusName = '未开始';
        this.taskStatusColor = 'table_noStart';
        break;
      case '20':
        taskStatusName = '进行中';
        this.taskStatusColor = 'table_inProgress';
        break;
      case '30':
        taskStatusName = '已完成';
        this.taskStatusColor = 'table_completed';
        break;
      case '40':
        taskStatusName = '指定完成';
        this.taskStatusColor = 'table_specifyCompleted';
        break;
      case '50':
        taskStatusName = '暂停';
        this.taskStatusColor = 'table_pause';
        break;
      case '60':
        taskStatusName = '签核中';
        this.taskStatusColor = 'table_signing';
        break;
      default:
        taskStatusName = '未开始';
        this.taskStatusColor = 'table_noStart';
    }
    this.taskStatusName = this.translateService.instant(`dj-pcc-${taskStatusName}`);
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }
}
