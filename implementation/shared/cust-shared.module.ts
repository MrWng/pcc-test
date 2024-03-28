import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormsAntUIModule } from '@athena/dynamic-ui';
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

import { AthDynamicCustomizedModule } from '@athena/design-ui/src/components/dynamic-customized';
import { AthButtonModule } from '@athena/design-ui/src/components/button';
import { AthSpinModule } from '@athena/design-ui/src/components/spin';
import { AthTagModule } from '@athena/design-ui/src/components/tag';
import { AthTooltipModule } from '@athena/design-ui/src/components/tooltip';
import { AthSelectModule } from '@athena/design-ui/src/components/select';
import { AthSwitchModule } from '@athena/design-ui/src/components/switch';
import { AthInputNumberModule } from '@athena/design-ui/src/components/input-number';
import { AthInputModule } from '@athena/design-ui/src/components/input';
import { AthTreeSelectModule } from '@athena/design-ui/src/components/tree-select';
import { IconModule } from '@athena/design-ui/src/components/icon';
import { AthCheckboxModule } from '@athena/design-ui/src/components/checkbox';
import { AthCascaderModule } from '@athena/design-ui/src/components/cascader';
import { AthDatePickerModule } from '@athena/design-ui/src/components/date-picker';
import { AthUploadModule, DmcService } from '@athena/design-ui/src/components/upload';
import { AthModalModule } from '@athena/design-ui/src/components/modal';
import { AthFormModule } from '@athena/design-ui/src/components/form';
import { AthEmptyModule } from '@athena/design-ui/src/components/empty';

import { DragDropService } from '../directive/dragdrop/dragdrop.service';
import { DroppableDirective } from '../directive/dragdrop/droppable.directive';
import { DraggableDirective } from '../directive/dragdrop/draggable.directive';
import { CanvasDirective } from '../directive/dragdrop/canvas.directive';
/** 应用组件库 */
import { AcCollapseModule } from '@app-custom/ui/collapse';
import { AcUploadModule } from '@app-custom/ui/upload';
import { AcModalFormModule } from '@app-custom/ui/modal-form';
import { AcOpenWindowBusinessTypeModule } from '@app-custom/ui/open-window-business-type';
import { AcOpenWindowEmployeeModule } from '@app-custom/ui/open-window-employee';
import { AcTransferReturnModule } from '@app-custom/ui/transfer-return';
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
  AthModalModule,
  AthFormModule,
  AthDynamicCustomizedModule,
  AthSpinModule,
  AthCascaderModule,
  AthButtonModule,
  AthInputModule,
  AthInputNumberModule,
  AthTagModule,
  AthSelectModule,
  AthSwitchModule,
  AthDatePickerModule,
  AthCheckboxModule,
  AthUploadModule,
  AthTooltipModule,
  AthTreeSelectModule,
  AcCollapseModule,
  AcUploadModule,
  AthEmptyModule,
  AcModalFormModule,
  AcOpenWindowBusinessTypeModule,
  AcOpenWindowEmployeeModule,
  AcTransferReturnModule,
];

@NgModule({
  declarations: [DroppableDirective, DraggableDirective, CanvasDirective],
  imports: [AgGridModule.withComponents([]), ...sharedModule],
  exports: [AgGridModule, ...sharedModule, DroppableDirective, DraggableDirective, CanvasDirective],
})
export class CustSharedModule {}
