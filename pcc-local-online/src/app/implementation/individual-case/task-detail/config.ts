import { DwFormGroup } from '@athena/dynamic-core';
import { TranslateService } from '@ngx-translate/core';
import { GridApi, RowNode } from 'ag-grid-community';
import { CustomFilter } from 'app/implementation/utils/commonCustomFilter';

export const FROM_GROUP_KEY = 'company_check';
export const ORGHIERARCHY = 'treeTablePath';

export const getColumnDefs = (
  customFilter: CustomFilter,
  translateService: TranslateService,
  componentParams
) => {
  // const comparator = customFilter.comparator.bind(customFilter, translateService);
  return [
    {
      headerName: translateService.instant('dj-pcc-工单&报工单'),
      field: 'ticketsTickets',
      valueType: '',
      width: 200,
      resizable: true,
      filter: true,
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
          return customFilter.doesFilterPass(params, filterModelValues, 'ticketsTickets');
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
      headerName: translateService.instant('dj-pcc-工时 (h)'),
      field: 'manHour',
      width: 200,
      filter: true,
      resizable: true,
      sortable: false,
      // comparator: comparator,
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
          return customFilter.doesFilterPass(params, filterModelValues, 'manHour');
        },
      },
      cellRendererParams: {
        models: [],
      },
    },
    {
      headerName: translateService.instant('dj-pcc-工作站'),
      field: 'workstation',
      valueType: '',
      width: 200,
      filter: true,
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
          return customFilter.doesFilterPass(params, filterModelValues, 'workstation');
        },
      },
      resizable: true,
      sortable: false,
    },
    {
      headerName: translateService.instant('dj-pcc-工作站类型'),
      field: 'workstationType',
      valueType: '',
      width: 180,
      filter: true,
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
          return customFilter.doesFilterPass(params, filterModelValues, 'workstationType');
        },
      },
      resizable: true,
      sortable: false,
      cellRendererParams: {
        componentType: 'workstation-type',
      },
    },
    {
      headerName: translateService.instant('dj-pcc-SN编号'),
      field: 'snNumber',
      width: 200,
      filter: true,
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
          return customFilter.doesFilterPass(params, filterModelValues, 'snNumber');
        },
      },
      resizable: true,
      sortable: false,
    },
    {
      headerName: translateService.instant('dj-pcc-整机百分比 (%)'),
      field: 'percentageOfTheWholeMachine',
      width: 200,
      filter: true,
      customFilterContentFormat: (data: DwFormGroup, field: string) => {
        const val = data.get(field).value;
        return {
          label: `${val}`,
          value: `${val}`,
        };
      },
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
          return customFilter.doesFilterPass(
            params,
            filterModelValues,
            'percentageOfTheWholeMachine'
          );
        },
      },
      resizable: true,
      sortable: false,
      cellRendererParams: {
        componentType: 'percent-display',
      },
    },
    {
      headerName: translateService.instant('dj-pcc-完工状态'),
      field: 'completionStatus',
      width: 200,
      filter: true,
      filterValueMap: {
        1: translateService.instant('dj-pcc-未完工'),
        2: translateService.instant('dj-pcc-已完工'),
        default: {
          label: translateService.instant('dj-pcc-未完工'),
          value: '1',
        },
      },
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
          return customFilter.doesFilterPass(params, filterModelValues, 'completionStatus');
        },
      },
      resizable: true,
      sortable: false,
      cellRendererParams: {
        componentType: 'completion-status',
      },
    },
    {
      headerName: translateService.instant('dj-pcc-开始日期'),
      field: 'startDate',
      width: 200,
      filter: true,
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
          return customFilter.doesFilterPass(params, filterModelValues, 'startDate');
        },
      },
      resizable: true,
      sortable: false,
    },
    {
      headerName: translateService.instant('dj-pcc-结束日期'),
      field: 'endDate',
      width: 200,
      filter: true,
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
          return customFilter.doesFilterPass(params, filterModelValues, 'endDate');
        },
      },
      resizable: true,
      sortable: false,
    },
  ];
};

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
