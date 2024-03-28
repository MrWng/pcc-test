import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormsAntUIModule } from '@ng-dynamic-forms/ui-ant-web';
import { AgGridModule } from 'ag-grid-angular';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

import { AthDynamicCustomizedModule } from 'ngx-ui-athena/src/components/dynamic-customized';
import { AthButtonModule } from 'ngx-ui-athena/src/components/button';
import { AthSpinModule } from 'ngx-ui-athena/src/components/spin';
import { AthTagModule } from 'ngx-ui-athena/src/components/tag';
import { AthTooltipModule } from 'ngx-ui-athena/src/components/tooltip';
import { AthSelectModule } from 'ngx-ui-athena/src/components/select';
import { AthInputNumberModule } from 'ngx-ui-athena/src/components/input-number';
import { AthInputModule } from 'ngx-ui-athena/src/components/input';
import { AthTreeSelectModule } from 'ngx-ui-athena/src/components/tree-select';
import { IconModule } from 'ngx-ui-athena/src/components/icon';
import { AthCheckboxModule } from 'ngx-ui-athena/src/components/checkbox';
import { AthCascaderModule } from 'ngx-ui-athena/src/components/cascader';
import { AthDatePickerModule } from 'ngx-ui-athena/src/components/date-picker';
import { AthUploadModule, DmcService } from 'ngx-ui-athena/src/components/upload';

import { DragDropService } from './directive/dragdrop/dragdrop.service';
import { DroppableDirective } from './directive/dragdrop/droppable.directive';
import { DraggableDirective } from './directive/dragdrop/draggable.directive';
import { CanvasDirective } from './directive/dragdrop/canvas.directive';

const sharedModule = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  DynamicFormsAntUIModule,
  TranslateModule,
  NgxEchartsModule,
  IconModule,
  DragDropModule,
  
  NzModalModule,
  NzMessageModule,
  NzCheckboxModule,
  NzFormModule,
  NzInputModule,
  NzSelectModule,
  NzIconModule,
  NzTabsModule,
  NzButtonModule,
  NzSpinModule,
  NzTableModule,
  NzPopconfirmModule,
  NzToolTipModule,
  NzPopoverModule,
  NzDividerModule,
  NzInputNumberModule,
  NzTreeSelectModule,
  NzGridModule,
  NzCascaderModule,
  NzDropDownModule,
  NzTreeModule,
  NzDatePickerModule,

  AthDynamicCustomizedModule,
  AthSpinModule,
  AthCascaderModule,
  AthButtonModule,
  AthInputModule,
  AthInputNumberModule,
  AthTagModule,
  AthSelectModule,
  AthDatePickerModule,
  AthCheckboxModule,
  AthUploadModule,
  AthTooltipModule,
  AthTreeSelectModule
]
 
@NgModule({
  declarations: [
    DroppableDirective,
    DraggableDirective,
    CanvasDirective
  ],
  imports: [
    AgGridModule.withComponents([]),
    ...sharedModule
  ],
  exports: [
    AgGridModule,
    ...sharedModule,
    DroppableDirective,
    DraggableDirective,
    CanvasDirective
  ],
})
export class CustSharedModule { }
