import { RowNode } from 'ag-grid-community';
import { CustomFilter } from 'app/implementation/utils/commonCustomFilter';
const customFilter = new CustomFilter();

export const FROM_GROUP_KEY = 'company_check';
export const ORGHIERARCHY = 'treeTablePath';

export const columnDefs = [
  {
    headerName: '工单&报工单',
    field: 'ticketsTickets',
    valueType: '',
    width: 200,
    resizable: true,
    filter: true,
    filterParams: {
      // 自定义筛选备选项
      getFilterOptions: (column: any) => {
        return customFilter.getFilterOptions(column, {
          filterType: '0',
          ORGHIERARCHY,
        });
      },
      // 自定义筛选的回调函数
      doesFilterPass: (params: any, filterModelValues: any) => {
        return customFilter.doesFilterPass(
          params,
          filterModelValues,
          'ticketsTickets',
          ORGHIERARCHY
        );
      },
    },
    pinned: 'left',
    cellRendererParams: {
      models: [{}],
      componentType: 'cascade',
      compProps: {
        hideIcon: true,
        editable: false,
        indentation: 0,
        // 层级展示字段
        orgHierarchy: ORGHIERARCHY,
        fromGroupKey: FROM_GROUP_KEY,
        setValue: () => {},
      },
    },
  },
  {
    headerName: '工时 (h)',
    field: 'manHour',
    width: 200,
    filter: true,
    resizable: true,
    sortable: false,
    filterParams: {
      // 自定义筛选备选项
      getFilterOptions: (column: any) => {
        return customFilter.getFilterOptions(column, {
          filterType: '1',
          ORGHIERARCHY,
        });
      },
      // 自定义筛选的回调函数
      doesFilterPass: (params: any, filterModelValues: any) => {
        return customFilter.doesFilterPass(params, filterModelValues, 'manHour', ORGHIERARCHY);
      },
    },
    cellRendererParams: {
      models: [],
    },
  },
  {
    headerName: '工作站',
    field: 'workstation',
    valueType: '',
    width: 200,
    filter: true,
    resizable: true,
    sortable: false,
  },
  {
    headerName: '工作站类型',
    field: 'workstationType',
    valueType: '',
    width: 180,
    filter: true,
    resizable: true,
    sortable: false,
  },
  {
    headerName: 'SN编号',
    field: 'snNumber',
    width: 200,
    filter: true,
    resizable: true,
    sortable: false,
  },
  {
    headerName: '整机百分比 (%)',
    field: 'percentageOfTheWholeMachine',
    width: 200,
    filter: true,
    resizable: true,
    sortable: false,
  },
  {
    headerName: '完工状态',
    field: 'completionStatus',
    width: 200,
    filter: true,
    resizable: true,
    sortable: false,
  },
  {
    headerName: '开始日期',
    field: 'startDate',
    width: 200,
    filter: true,
    resizable: true,
    sortable: false,
  },
  {
    headerName: '结束日期',
    field: 'endDate',
    width: 200,
    filter: true,
    resizable: true,
    sortable: false,
  },
];

export const rules: any = [
  {
    schema: 'ticketsTickets',
    linkageSchemas: [],
    path: 'company_check',
    trigger: {
      condition: `true`,
      type: 'sync',
      point: 'default',
    },
    key: 'disabled',
  },
];
