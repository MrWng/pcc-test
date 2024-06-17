import { DwFormGroup, isEmpty } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { GridApi, RowNode } from 'ag-grid-community';
import { flattenDeep } from 'lodash';

export class CustomFilter {
  curFilterField: string = '';
  userInstance;
  gridApi: GridApi;
  filteredNodeMap: Map<string, any> = new Map();
  filteredFieldNodeMap: Map<string, any> = new Map();
  allFilteredNodes = new Set();
  // 父子行层级关系对照
  filterOptionsMap = new Map();
  treeTablePath: string;
  translateService: TranslateService;
  constructor(treeTablePath, translateService: TranslateService) {
    this.treeTablePath = treeTablePath;
    this.translateService = translateService;
  }
  // 自定义排序时使用
  setGridApi(gridApi: GridApi) {
    this.gridApi = gridApi;
  }
  protected createFilterValues(gridApi: GridApi, field) {
    const res = new Map();
    const filteredNodeKeys = [...this.filteredNodeMap.keys()],
      filteredNodeKeyLen = filteredNodeKeys.length,
      filterValueMap = this.gridApi.getColumnDef(field)['filterValueMap'];
    this.filteredNodeKeys = filteredNodeKeys;
    this.filterOptionsMap.set(field, new Map());
    if (filteredNodeKeyLen === 0 || (filteredNodeKeyLen <= 1 && this.filteredNodeMap.has(field))) {
      gridApi.forEachNode((node: RowNode, index: number) => {
        this.setFilterOptions(node, res, field, this.filterOptionsMap, filterValueMap);
      });
    } else {
      const curFilterFieldIndex = filteredNodeKeys.indexOf(field),
        useFilteredNodeKeysIndex =
          curFilterFieldIndex !== filteredNodeKeyLen - 1
            ? filteredNodeKeyLen - 1
            : curFilterFieldIndex - 1;
      this.filteredNodeMap
        .get(filteredNodeKeys[useFilteredNodeKeysIndex])
        .forEach((node: RowNode) => {
          this.setFilterOptions(node, res, field, this.filterOptionsMap, filterValueMap);
        });
    }
    return [...res.values()];
  }
  private setFilterOptions(
    node: RowNode,
    map: Map<string, any>,
    field: string,
    filterOptionsMap?: Map<string, any>,
    filterValueMap?: any
  ) {
    const data = node.data as DwFormGroup;
    const { value, label } = this.getCurData(data, field, filterValueMap);
    if (map.has(value)) {
      map.get(value).count++;
      // eslint-disable-next-line no-unused-expressions
      filterOptionsMap &&
        filterOptionsMap.get(field).get(value).add(data.get(this.treeTablePath)?.value);
      return;
    }
    // eslint-disable-next-line no-unused-expressions
    filterOptionsMap &&
      filterOptionsMap.get(field).set(value, new Set([data.get(this.treeTablePath)?.value]));

    map.set(value, {
      value: value || '',
      checked: false,
      label: label,
      count: 1,
      nameSchema: field,
    });
  }
  private addFilterOptionsMap(node: RowNode, field: string) {
    const data = node.data as DwFormGroup;
    const value = data.get(field)?.value || '';
    if (this.filterOptionsMap.get(field)?.has(value)) {
      this.filterOptionsMap.get(field).get(value).add(data.get(this.treeTablePath)?.value);
    }
  }
  private resetFilteredOptionMap(field) {
    const filteredNodeKeys = [...this.filteredNodeMap.keys()];
    this.filteredNodeKeys = filteredNodeKeys;
    this.gridApi.forEachNode((node: RowNode, index: number) => {
      this.addFilterOptionsMap(node, field);
    });
  }
  private resetFilteredNodeMap(field, values) {}
  private resetFilteredAboutState() {
    const filterModel = this.gridApi.getFilterModel(),
      filterModelKeys = Object.keys(filterModel);
    filterModelKeys.forEach((key) => {
      const values = filterModel[key].values;
      if (values.length === 0) {
        this.filteredNodeMap.delete(key);
      } else {
        this.resetFilteredOptionMap(key);
      }
    });
  }
  getFilterOptions(column: any, options: any = {}) {
    this.gridApi = column.gridApi;
    const { headerName, field } = column.colDef;
    this.curFilterField = field;
    this.doesFilterPassKey = true;
    this.resetFilteredAboutState();
    return [
      {
        key: field,
        name: headerName,
        values: this.createFilterValues(column.gridApi, field),
      },
    ];
  }
  private catchColumnDef = {};
  getCurData(data: DwFormGroup, field: string, filterValueMap?: any) {
    let columnDef = this.catchColumnDef[field];
    if (!columnDef) {
      this.catchColumnDef[field] = this.gridApi?.getColumnDef(field);
      columnDef = this.catchColumnDef[field];
    }
    const customFilterContentFormat = columnDef['customFilterContentFormat'];
    if (customFilterContentFormat && typeof customFilterContentFormat === 'function') {
      const { label, value } = customFilterContentFormat(data, field);
      return {
        label: label || this.translateService.instant('dj-pcc-(空值)'),
        value: isEmpty(value) ? '' : value,
      };
    }

    if (!filterValueMap) {
      filterValueMap = columnDef['filterValueMap'];
    }
    if (!filterValueMap) {
      filterValueMap = this.gridApi.getColumnDef(field)['filterValueMap'];
    }
    let label = '',
      value = data.get(field)?.value;
    const emptyVal = this.translateService.instant('dj-pcc-(空值)');
    if (filterValueMap) {
      label = filterValueMap[value]
        ? filterValueMap[value] || emptyVal
        : filterValueMap['default']?.label?.toString() || emptyVal;
      value = !isEmpty(value) ? value : filterValueMap['default']?.value;
    } else {
      // eslint-disable-next-line eqeqeq
      label = isEmpty(value) ? emptyVal : value.toString();
      value = value || '';
    }
    return {
      label,
      value,
    };
  }
  doesFilterPassKey = true;
  filteredNodeKeys = [];
  doesFilterPass(params: any, filterModelValues: any[], field: string) {
    if (this.doesFilterPassKey) {
      this.resetFilteredAboutState();
      this.filteredNodeKeys = [...this.filteredNodeMap.keys()];
    }
    this.doesFilterPassKey = false;
    const { data, node } = params,
      filteredNodeSet = this.filteredNodeMap.get(field),
      curValue = this.getCurData(data, field).value;
    if (this.curFilterField === field && filteredNodeSet && !filterModelValues.includes(curValue)) {
      filteredNodeSet.delete(node);
    }
    if (filteredNodeSet?.has(node)) {
      return true;
    }
    const res = filterModelValues.some((filterValue) => {
      if (curValue === filterValue) {
        if (this.filteredNodeMap.has(field)) {
          this.filteredNodeMap.get(field).add(node);
        } else {
          this.filteredNodeMap.set(field, new Set([node]));
        }
        const curFilterFieldIndex = this.filteredNodeKeys.indexOf(field),
          useFilteredNodeKeysIndex =
            curFilterFieldIndex - 1 < 0
              ? this.filteredNodeKeys.length - 1
              : curFilterFieldIndex - 1;
        if (
          this.filteredNodeKeys.length > 0 &&
          !this.filteredNodeMap.get(this.filteredNodeKeys[useFilteredNodeKeysIndex])?.has(node)
        ) {
          this.filteredNodeMap.get(field).delete(node);
        }
        return true;
      }
      // 处理父子节点
      const o = [...(this.filterOptionsMap.get(field)?.get(filterValue) || [])],
        treeTablePath = data.get(this.treeTablePath)?.value;
      const flag = o.some((item: string[]) => {
        const itemLen = item.length,
          treeTablePathLen = treeTablePath.length;
        if (itemLen === treeTablePathLen) {
          // 同级节点比较上一个节点
          if (itemLen === 1) {
            //  可能时根节点
            return item[0] === treeTablePathLen[0] && curValue === filterValue;
          }
          return (
            item[itemLen - 2] === treeTablePath[treeTablePathLen - 2] && curValue === filterValue
          );
        } else if (itemLen > treeTablePathLen) {
          // item可能时父节点，treeTablePath可能时子节点
          return item[treeTablePathLen - 1] === treeTablePath[treeTablePathLen - 1];
        } else {
          // treeTablePath可能时父节点，item可能时子节点
          return item[itemLen - 1] === treeTablePath[itemLen - 1];
        }
      });
      if (flag) {
        if (filterModelValues.includes(curValue)) {
          if (this.filteredNodeMap.has(field)) {
            this.filteredNodeMap.get(field).add(node);
          } else {
            this.filteredNodeMap.set(field, new Set([node]));
          }
        }
        return true;
      }
    });
    return res;
  }
  customComparator(isInverted: boolean) {
    const data = (this.gridApi.getModel() as any).rowsToDisplay.map(
      (node) => node.data
    ) as DwFormGroup[];
    if (!isInverted) {
      console.log(11);
      // 升序
      this.gridApi.setRowData(data.reverse());
    }
  }
  isInverted;
  comparator(valueA, valueB, nodeA, nodeB, isInverted) {
    if (this.isInverted !== isInverted) {
      this.isInverted = isInverted;
      this.customComparator(isInverted);
    }
    return 0;
  }
}
