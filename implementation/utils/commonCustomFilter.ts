import { GridApi, RowNode } from 'ag-grid-community';
import { flattenDeep } from 'lodash';

export class CustomFilter {
  checkValue = new Map();
  matchCheckedValues = new Set();
  constructor() {}
  protected createFilterValues(gridApi: GridApi, field, filterType = '1', ORGHIERARCHY: string) {
    const map = new Map(),
      callback = (node: RowNode, index: number) => {
        // if (this.matchCheckedValues.size && !this.matchCheckedValues.has(node)) {
        //   return;
        // }
        const col = node.data;
        const value = col.get(field).value,
          orgHierarchy = col.get(ORGHIERARCHY).value;
        if (filterType === '1') {
          filterTypeHandler(value, orgHierarchy);
          return;
        }
        if (orgHierarchy.length === 1) {
          filterTypeHandler(value, orgHierarchy);
        }
      };
    gridApi.forEachNodeAfterFilter(callback);

    function filterTypeHandler(value, orgHierarchy) {
      if (map.has(value)) {
        map.get(value).count++;
        return;
      }
      map.set(value, {
        value: JSON.stringify({
          matchValue: value,
          orgHierarchy,
          field,
        }),
        checked: false,
        label: value,
        count: 1,
        nameSchema: field,
      });
    }
    return [...map.values()];
  }
  getFilterOptions(column: any, options: any = {}) {
    const colData = column.gridOptionsWrapper.getRowData();
    const { headerName, field } = column.colDef;
    return [
      {
        key: field,
        name: headerName,
        values: this.createFilterValues(
          column.gridApi,
          field,
          options.filterType,
          options.ORGHIERARCHY
        ),
      },
    ];
  }
  doesFilterPass(params: any, filterModelValues: any, field: string, ORGHIERARCHY: string) {
    this.checkValue.set(field, filterModelValues);
    const data = params.data.get(field).value,
      orgHierarchy = params.data.get(ORGHIERARCHY).value,
      filterHandler = (filterModelValue: any) => {
        const {
          matchValue,
          orgHierarchy: filterModelOrgHierarchy,
          field: filterModelField,
        } = JSON.parse(filterModelValue);
        if (matchValue === data) {
          this.matchCheckedValues.add(params.node);
          return true;
        }
        if (
          orgHierarchy.length >= 1 &&
          (filterModelOrgHierarchy.toString().includes(orgHierarchy.toString()) ||
            orgHierarchy.toString().includes(filterModelOrgHierarchy.toString()))
        ) {
          return true;
        }
        return false;
      };
    const filterValues = filterModelValues;
    for (const item of filterValues) {
      const res = filterHandler(item);
      if (res) {
        return true;
      }
    }
    return false;
  }
}
