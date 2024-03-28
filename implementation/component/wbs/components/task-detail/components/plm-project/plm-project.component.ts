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
} from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { PlmProjectService } from './plm-project.service';

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
  selector: 'app-plmProject',
  templateUrl: './plm-project.component.html',
  styleUrls: ['./plm-project.component.less'],
  providers: [PlmProjectService],
})
export class PlmProjectComponent implements OnInit, OnChanges {
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
      item.key = item.task_seq;
      item.children = [];
      record[item.task_seq] = item;
    }

    for (let i = 0; i < length; i++) {
      const item = list[i];
      if (
        item.upper_level_task_no &&
        record[item.upper_level_task_no] &&
        item.upper_level_task_no !== item.task_seq
      ) {
        record[item.upper_level_task_no].children.push(item);
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
