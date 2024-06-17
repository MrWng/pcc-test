import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  ElementRef,
  ViewChild,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CommonService, Entry } from 'app/implementation/service/common.service';
import { DwFormControl, DwFormGroup } from '@athena/dynamic-core';
import { ICellRendererParams } from 'ag-grid-community';
import { AddSubProjectCardService } from '../add-subproject-card/add-subproject-card.service';
import { TranslateService } from '@ngx-translate/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { PersonInChargeService } from './person-in-charge.service';
import { AcBaseCellComponent } from '@app-custom/ui/ac-table-cell';
import { AthTreeSelectComponent } from '@athena/design-ui/src/components/tree-select';
import { NzTreeNode } from 'ng-zorro-antd/tree';
import { WbsTabsService } from '../wbs-tabs/wbs-tabs.service';

@Component({
  selector: 'app-person-in-charge',
  templateUrl: './person-in-charge.component.html',
  styleUrls: ['./person-in-charge.component.less'],
  providers: [PersonInChargeService],
})
// @ts-ignore
export class PersonInChargeComponent extends AcBaseCellComponent implements OnInit, OnChanges {
  @Input() nodes;
  @Input() source;
  @Input() nzCheckable = false;
  @Input() nzPlaceHolder;
  @Input() valueChanged;
  @Input() personList;
  @Input() nzShowSearch;
  @Input() isCanSelectParentNode = false;
  @Output() changeWbsTaskCardProportion = new EventEmitter<any>();
  @ViewChild('nzTreeComponent', { static: false }) nzTreeComponent: AthTreeSelectComponent;

  value?: any;
  control?: any;
  Entry = Entry;
  public treeNodes?: any = [];
  constructor(
    public wbsService: DynamicWbsService,
    public addSubProjectCardService: AddSubProjectCardService,
    private translateService: TranslateService,
    public commonService: CommonService,
    public changeRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    public wbsTabsService: WbsTabsService
  ) {
    super(elementRef, changeRef);
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
    this.value = formGroup.value[field];
    this.control = formGroup.controls[field];
    this.treeNodes = this.source !== Entry.maintain ? [...this.nodes] : [...this.nodes[0].children];
    if (Array.isArray(this.value) && this.value?.length > 0) {
      this.value.forEach((node, index) => {
        let isInnerList = 0;
        const personList = this.personList;
        personList.forEach((person) => {
          const { role_name, role_no, department_name, department_no, employee_name, employee_no } =
            person;
          const person_code_key = node.split('/');
          if (
            (person_code_key[0] === role_no || person_code_key[0] === role_name) &&
            person_code_key[1] === department_no &&
            person_code_key[2] === employee_no
          ) {
            isInnerList += 1;
          }
        });
        if (isInnerList === 0) {
          this.treeNodes.push({
            title: formGroup.controls['task_member_info_name']?.value[index],
            key: node,
            isLeaf: true,
          });
        }
      });
    } else if (this.value && !Array.isArray(this.value)) {
      let isInnerList = 0;
      const personList = this.personList;
      personList.forEach((person) => {
        const { role_name, role_no, department_name, department_no, employee_name, employee_no } =
          person;
        const liable_person_code_key = this.value.split('/');
        if (
          (liable_person_code_key[0] === role_no || liable_person_code_key[0] === role_name) &&
          liable_person_code_key[1] === department_no &&
          liable_person_code_key[2] === employee_no
        ) {
          isInnerList += 1;
        }
      });
      if (isInnerList === 0) {
        this.treeNodes.push({
          title: formGroup.controls['liable_person_name_key'].value,
          key: this.value,
          isLeaf: true,
        });
      }
    }
    this.changeRef.markForCheck();
  }

  getDropdownClassName() {
    const isMaintain = this.source === Entry.maintain;
    if (!this.isCanSelectParentNode) {
      return !isMaintain ? 'cus-pcc-add-role' : 'cus-pcc-add-role personInCharge-maintain';
    } else {
      return !isMaintain ? 'cus-pcc-add-role1' : 'cus-pcc-add-role1 personInCharge-maintain';
    }
  }

  displayWith = (node: NzTreeNode) => {
    if (this.source !== Entry.maintain) {
      return `${node.title}${
        node.origin?.department_name ? ' ' + node.origin?.department_name : ''
      }${node.origin?.role_name ? ' ' + node.origin?.role_name : ''}`;
    }
    return `${node.title}${node.origin?.department_name ? ' ' + node.origin?.department_name : ''}`;
  };
  onChange($event: any) {
    const {
      data: formGroup,
      rowIndex,
      // @ts-ignore
      compProps: { fromGroupKey },
      // @ts-ignore
      colDef: { field },
      // @ts-ignore
    } = this.data.params;
    if (this.control && this.control.patchValue) {
      let nowValue = $event;
      if (Array.isArray($event) && this.isCanSelectParentNode) {
        nowValue = [];
        $event.forEach((node) => {
          this.getChildrenNodes(node, nowValue);
        });
      }

      this.control.patchValue(Array.isArray(nowValue) && nowValue.length === 0 ? null : nowValue);
      this.value = nowValue;
      if (this.valueChanged) {
        setTimeout(() => {
          this.valueChanged({
            newValue: nowValue,
            control: this.control,
            path: this.control._path,
          });
        }, 0);
      }
      if (this.control.errors) {
        this._validator();
      }
    }
  }
  log(e) {
    console.log(e);
  }
  getChildrenNodes(parentKey, nowValue) {
    const treeNode = this.nzTreeComponent.getTreeNodeByKey(parentKey);
    if (treeNode?.origin?.children && treeNode?.origin?.children.length > 0) {
      treeNode.origin.children.forEach((child) => {
        this.getChildrenNodes(child.key, nowValue);
      });
    } else {
      nowValue.push(parentKey);
    }
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  // 处理数据被共用问题，其他选中的值会保留
  onClick() {
    this.treeNodes = this.clearExtraSelect(this.treeNodes);
  }

  clearExtraSelect(parentNodes) {
    return parentNodes.map((node) => {
      if (node.selected) {
        if (node.key !== this.value) {
          node.selected = false;
        }
      }
      if (node.children && node.children.length > 0) {
        node.children = this.clearExtraSelect(node.children);
      }
      return node;
    });
  }

  clear(e: Event) {
    e.stopPropagation();
    // @ts-ignore
    this.control.setValue(this.nzCheckable ? [] : '');
    this.value = this.nzCheckable ? [] : '';
    this.callback(this.group);
  }
}
