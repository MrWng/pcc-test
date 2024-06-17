import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  SkipSelf,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  DynamicFormLayoutService,
  DynamicFormService,
  DynamicFormValidationService,
} from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { AsscIsaOrderService } from './assc-isa-order.service';

export interface TreeNodeInterface {
  key: string;
  name: string;
  age?: number;
  level?: number;
  expand?: boolean;
  address?: string;
  children?: TreeNodeInterface[];
  parent?: TreeNodeInterface;
}

@Component({
  selector: 'app-assc-isa-order',
  templateUrl: './assc-isa-order.component.html',
  styleUrls: ['./assc-isa-order.component.less'],
  providers: [AsscIsaOrderService],
})
export class AsscIsaOrderComponent implements OnInit, OnChanges {
  @Input() list: any;
  listOfMapData: any = [];

  mapOfExpandedData: { [key: string]: TreeNodeInterface[] } = {};

  constructor(
    @SkipSelf()
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    protected translateService: TranslateService
  ) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.list) {
      this.listOfMapData = this.transformData(this.list);
      this.listOfMapData.forEach((item) => {
        this.mapOfExpandedData[item.key] = this.convertTreeToList(item);
      });
    }
  }

  transformData(list) {
    const record = {};
    const length = list.length;
    const data = [];

    for (let i = 0; i < length; i++) {
      const item = list[i];
      // item.key = item.task_seq;
      item.key = item.task_no;
      item.children = [];
      // record[item.task_seq] = item;
      record[item.task_no] = item;
    }

    for (let i = 0; i < length; i++) {
      const item = list[i];
      if (
        item.superior_task_no &&
        record[item.superior_task_no] &&
        // item.superior_task_no !== item.task_seq
        item.superior_task_no !== item.task_no
      ) {
        record[item.superior_task_no].children.push(item);
      } else {
        data.push(item);
      }
    }
    return data;
  }

  collapse(array: TreeNodeInterface[], data: TreeNodeInterface, $event: boolean): void {
    if (!$event) {
      if (data.children) {
        data.children.forEach((d) => {
          const target = array.find((a) => a.key === d.key)!;
          target.expand = false;
          this.collapse(array, target, false);
        });
      } else {
        return;
      }
    }
  }

  convertTreeToList(root: TreeNodeInterface): TreeNodeInterface[] {
    const stack: TreeNodeInterface[] = [];
    const array: TreeNodeInterface[] = [];
    const hashMap = {};
    stack.push({ ...root, level: 0, expand: true });

    while (stack.length !== 0) {
      const node = stack.pop()!;
      this.visitNode(node, hashMap, array);
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({ ...node.children[i], level: node.level! + 1, expand: true, parent: node });
        }
      }
    }

    return array;
  }

  visitNode(
    node: TreeNodeInterface,
    hashMap: { [key: string]: boolean },
    array: TreeNodeInterface[]
  ): void {
    if (!hashMap[node.key]) {
      hashMap[node.key] = true;
      array.push(node);
    }
  }
}
