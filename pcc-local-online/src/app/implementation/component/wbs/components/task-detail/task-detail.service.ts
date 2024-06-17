import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../../service/common.service';
import { DwUserService } from '@webdpt/framework/user';
import { map, pluck } from 'rxjs/operators';
import * as moment from 'moment';

@Injectable()
export class TaskDetailService {
  uibotUrl: string;
  knowledgeMapsUrl: string;
  // 记录机制的content参数
  content: any;
  // 开窗所需参数
  executeContext: any;
  // 开窗定义
  OpenWindowDefine: any;
  smartDataUrl: string;
  taskDetail: any;
  qianyeTenantId = []; // 乾冶租户id
  atmcUrl: any;
  hasT100: boolean = false;
  Unit = {
    '0': this.translateService.instant('dj-default-无'),
    '1': this.translateService.instant('dj-default-工时'),
    '2': this.translateService.instant('dj-default-重量'),
    '3': this.translateService.instant('dj-default-张数'),
    '4': this.translateService.instant('dj-default-数量'),
    '5': this.translateService.instant('dj-default-项数'),
  };

  statusList = {
    N: this.translateService.instant('dj-default-未结案'),
    Y: this.translateService.instant('dj-default-自动结案'),
    y: this.translateService.instant('dj-default-指定结案'),
    '0': this.translateService.instant('dj-default-未结束'),
    '1': this.translateService.instant('dj-default-指定结束'),
    '2': this.translateService.instant('dj-default-已结束'),
  };

  statusList1 = {
    '1': this.translateService.instant('dj-default-未生产'),
    '2': this.translateService.instant('dj-default-已发料'),
    '3': this.translateService.instant('dj-default-生产中'),
    Y: this.translateService.instant('dj-default-已完工'),
    y: this.translateService.instant('dj-default-指定完工'),
    N: this.translateService.instant('dj-default-未完工'),
    F: this.translateService.instant('dj-default-已发出'),
    W: this.translateService.instant('dj-default-送签中'),
    M: this.translateService.instant('dj-default-成本结案'),
  };

  statusList2 = {
    notAssigned: this.translateService.instant('dj-default-未指派'),
    notStart: this.translateService.instant('dj-default-未启动'),
    inProgress: this.translateService.instant('dj-default-进行中'),
    completed: this.translateService.instant('dj-default-已完成'),
    cancel: this.translateService.instant('dj-default-已取消'),
    pause: this.translateService.instant('dj-default-暂停'),
  };

  statusList3 = {
    '0': this.translateService.instant('dj-default-未确认'),
    '1': this.translateService.instant('dj-default-确认中'),
    '2': this.translateService.instant('dj-default-已确认'),
    '3': this.translateService.instant('dj-default-允许开立生产批'),
    '6': this.translateService.instant('dj-default-退货仓的工单'),
    '99': this.translateService.instant('dj-default-工单结案'),
  };

  statusList4 = {
    '1': this.translateService.instant('dj-default-厂内制程'),
    '2': this.translateService.instant('dj-default-托外制程'),
    '3': this.translateService.instant('dj-default-二者皆有'),
  };

  statusList5 = {
    Y: this.translateService.instant('dj-default-已审核'),
    N: this.translateService.instant('dj-default-未审核'),
    V: this.translateService.instant('dj-default-作废'),
  };

  resourceTypeList = {
    A: this.translatePccWord('库存冗余'),
    B: this.translatePccWord('购料未结'),
    C: this.translatePccWord('生产未结'),
    D: this.translatePccWord('接单未结'),
    E: this.translatePccWord('帐款未请单据'),
  };
  resourcePositionList = {
    A: this.translatePccWord('请购单据未结案'),
    K: this.translatePccWord('采购单据未结案'),
    L: this.translatePccWord('进货单据未结案'),
    D: this.translatePccWord('工单单据未结案'),
    E: this.translatePccWord('订单单据未结案'),
    F: this.translatePccWord('销货单据未结案'),
    G: this.translatePccWord('借出单据未结案'),
    H: this.translatePccWord('分批订金单据未结案'),
    I: this.translatePccWord('进货单据未请款'),
    J: this.translatePccWord('销货单据未请款'),
  };
  level = {
    veryHigh: '极高',
    high: '高',
    low: '低',
    common: '普通',
  };
  taskStatus = {
    INI: '未启动',
    RUN: '运行中',
    COP: '已完成',
    PUS: '已暂停',
    SSP: '已取消',
    30: '进行中',
    40: '已结案',
    50: '暂停',
    60: '指定结案',
  };
  assc_isa_order_task_status = {
    0: this.translatePccWord('未开始'),
    1: this.translatePccWord('进行中'),
    2: this.translatePccWord('已完成'),
    3: this.translateWord('已暂停'),
  };
  timeStatus = {
    potentialRisk: '潜在进度风险',
    notStarted: '未启动',
    delay: '延迟',
    progressonTime: '进度准时',
  };

  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    protected translateService: TranslateService,
    private userService: DwUserService,
    public commonService: CommonService
  ) {
    this.configService.get('uibotUrl').subscribe((url: string): void => {
      this.uibotUrl = url;
    });
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('knowledgeMapsUrl').subscribe((url: string): void => {
      this.knowledgeMapsUrl = url;
    });
    this.configService.get('atmcUrl').subscribe((url: string): void => {
      this.atmcUrl = url;
    });
    this.configService.get('qianyeTenantId').subscribe((url: string) => {
      const id = url || '72007522,72007522_001';
      this.qianyeTenantId = id.split(',');
    });
  }

  setTemplateJson(
    category: string, // 任务类型
    responseData: Array<any>, // 表格数据
    state: string,
    executeContext: any
  ): any {
    let columns;
    if (['ORD', 'MO_H'].includes(category)) {
      columns = [
        {
          headerName: this.translateService.instant('dj-default-负责人名称'),
          schema: 'liable_person_name',
        },
        {
          headerName: this.translateService.instant('dj-default-预计开始日'),
          schema: 'plan_start_date',
        },
        {
          headerName: this.translateService.instant('dj-default-预计完成日'),
          schema: 'plan_finish_date',
        },
        {
          headerName: this.translateService.instant('dj-default-实际开始日'),
          schema: 'actual_start_date',
        },
        {
          headerName: this.translateService.instant('dj-default-报工说明'),
          schema: 'remarks',
          type: 'LABEL',
          editable: 'true',
        },
        {
          headerName: this.translateService.instant('dj-default-实际完成日'),
          schema: 'actual_finish_date',
        },
        {
          headerName: this.translateService.instant('dj-default-耗用总工时'),
          schema: 'total_work_hours',
        },
        {
          headerName: this.translateService.instant('dj-default-任务说明'),
          schema: 'attachment_remark',
        },
        { headerName: this.translateService.instant('dj-default-备注'), schema: 'remark' },
        { headerName: this.translateService.instant('dj-default-签核'), schema: 'is_approve' },
        {
          headerName: this.translateService.instant('dj-default-交付物样板'),
          schema: 'attachment',
          upload: true,
        },
      ];
      let list = [];
      if (['ORD'].includes(category)) {
        if (!['无', '無', 'no', undefined].includes(responseData[0]?.main_unit)) {
          list = [
            { headerName: this.translateService.instant('dj-default-工时'), schema: 'work_hours' },
            {
              headerName: this.translateService.instant('dj-default-主单位'),
              schema: 'main_unit',
              addHide: true,
            },
            {
              headerName: this.translateService.instant('dj-default-预计值(主单位)'),
              schema: 'plan_main_unit_value',
              addHide: true,
            },
            {
              headerName: this.translateService.instant('dj-default-已完成(主单位)'),
              schema: 'complete_main_unit_value',
              addHide: true,
            },
            {
              headerName: this.translateService.instant('dj-default-次单位'),
              schema: 'second_unit',
              addHide: true,
            },
            {
              headerName: this.translateService.instant('dj-default-预计值(次单位)'),
              schema: 'plan_second_unit_value',
              addHide: true,
            },
            {
              headerName: this.translateService.instant('dj-default-已完成(次单位)'),
              schema: 'complete_second_unit_value',
              addHide: true,
            },
            {
              headerName: this.translateService.instant('dj-default-已返工图数'),
              schema: 'complete_rework_drawing_qty',
              addHide: true,
            },
            {
              headerName: this.translateService.instant('dj-default-已返工时数'),
              schema: 'complete_rework_work_hours',
              addHide: true,
            },
          ];
        } else {
          list = [
            { headerName: this.translateService.instant('dj-default-工时'), schema: 'work_hours' },
          ];
        }
        if (this.taskDetail.task_status !== 60) {
          list.push({
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          });
        }
        columns.splice(
          columns.findIndex(
            (col) => col.headerName === this.translateService.instant('dj-default-报工说明')
          ) + 1,
          0,
          {
            headerName: this.translateService.instant('dj-default-预计工时'),
            schema: 'plan_work_hours',
            type: 'LABEL',
            editable: 'true',
          }
        );
      } else {
        list = [
          { headerName: this.translateService.instant('dj-default-单别'), schema: 'doc_type_no' },
          { headerName: this.translateService.instant('dj-default-单号'), schema: 'doc_no' },
          {
            headerName: this.translateService.instant('dj-default-类型条件值'),
            schema: 'type_condition_value',
          },
          {
            headerName: this.translateService.instant('dj-default-次类型条件值'),
            schema: 'sub_type_condition_value',
          },
          {
            headerName: this.translateService.instant('dj-default-托外条件值'),
            schema: 'outsourcing_condition_value',
          },
        ];
        if (this.taskDetail.task_status !== 60) {
          list.push({
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          });
        }
      }
      columns.splice(5 + 1, 0, ...list);
      // 个案
      if (
        ['ORD'].includes(category) &&
        this.qianyeTenantId.indexOf(this.userService.getUser('tenantId')) >= 0
      ) {
        columns.push(
          ...[
            {
              headerName: this.translateService.instant('dj-default-已完成A1图数'),
              schema: 'complete_drawing_qty1',
            },
            {
              headerName: this.translateService.instant('dj-default-已完成A2图数'),
              schema: 'complete_drawing_qty2',
            },
            {
              headerName: this.translateService.instant('dj-default-已完成A3图数'),
              schema: 'complete_drawing_qty3',
            },
            {
              headerName: this.translateService.instant('dj-default-已完成A4图数'),
              schema: 'complete_drawing_qty4',
            },
          ]
        );
      }
    } else if (['MOOP', 'MES', 'SFT', 'APC', 'APC_O'].includes(category)) {
      if (['MOOP'].includes(category)) {
        // 工单工艺
        columns = [
          { headerName: this.translateService.instant('dj-default-状态码'), schema: 'status' },
          {
            headerName: this.translateService.instant('dj-default-生管人员'),
            schema: 'production_control_name',
          },
          { headerName: this.translateService.instant('dj-pcc-工单号码'), schema: 'wo_no' },
          { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
          {
            headerName: this.translateService.instant('dj-default-品名规格'),
            columns: [
              {
                schema: 'item_name_spec',
                headerName: this.translateService.instant('dj-default-品名'),
                level: 0,
                path: 'item_name_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_name_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
              {
                schema: 'item_spec',
                headerName: this.translateService.instant('dj-default-规格'),
                level: 0,
                path: 'item_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
            ],
          },
          {
            headerName: this.translateService.instant('dj-default-生产数量'),
            schema: 'production_qty',
          },
          // {
          //   headerName: this.translateService.instant('dj-default-已发料套数'),
          //   schema: 'issue_set_qty',
          // },
          {
            headerName: this.translateService.instant('dj-default-加工顺序'),
            schema: 'process_seq',
          },
          {
            headerName: this.translateService.instant('dj-default-制程代号'),
            schema: 'process_no',
          },
          { headerName: this.translateService.instant('dj-default-制程名称'), schema: 'op_name' },
          { headerName: this.translateService.instant('dj-default-性质'), schema: 'op_type' },
          {
            headerName: this.translateService.instant('dj-default-线别/厂商名称'),
            schema: 'supplier_name',
          },
          { headerName: this.translateService.instant('dj-default-投入数量'), schema: 'feed_qty' },
          {
            headerName: this.translateService.instant('dj-default-完成数量'),
            schema: 'complete_qty',
          },
          { headerName: this.translateService.instant('dj-pcc-预计开工日'), schema: 'plan_date_s' },
          { headerName: this.translateService.instant('dj-pcc-预计完工日'), schema: 'plan_date_e' },
          {
            headerName: this.translateService.instant('dj-pcc-实际开工日'),
            schema: 'actual_date_s',
          },
          {
            headerName: this.translateService.instant('dj-pcc-实际完工日'),
            schema: 'actual_date_e',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
        ];
      }
      if (['MES'].includes(category)) {
        columns = [
          { headerName: this.translateService.instant('dj-default-状态码'), schema: 'status' },
          { headerName: this.translateService.instant('dj-default-工单单号'), schema: 'wo_no' },
          {
            headerName: this.translateService.instant('dj-default-品名规格'),
            schema: 'item_name_spec',
          },
          { headerName: this.translateService.instant('dj-default-设备号'), schema: 'machine_no' },
          {
            headerName: this.translateService.instant('dj-default-生产数量'),
            schema: 'production_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-加工顺序'),
            schema: 'process_seq',
          },
          { headerName: this.translateService.instant('dj-default-工艺名称'), schema: 'op_name' },
          { headerName: this.translateService.instant('dj-default-工艺性质'), schema: 'op_type' },
          {
            headerName: this.translateService.instant('dj-default-线别/厂商名称'),
            schema: 'supplier_name',
          },
          { headerName: this.translateService.instant('dj-default-投入数量'), schema: 'feed_qty' },
          {
            headerName: this.translateService.instant('dj-default-完成数量'),
            schema: 'complete_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-预定完工日'),
            schema: 'plan_date_e',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
          { headerName: this.translateService.instant('dj-default-工时'), schema: 'work_hours' },
        ];
      }
      if (['SFT'].includes(category)) {
        columns = [
          { headerName: this.translateService.instant('dj-default-状态码'), schema: 'status_code' },
          {
            headerName: this.translateService.instant('dj-default-生管人员'),
            schema: 'reporter_name',
          },
          { headerName: this.translateService.instant('dj-default-工单单号'), schema: 'wo_no' },
          {
            headerName: this.translateService.instant('dj-default-料号'),
            schema: 'item_no',
          },
          {
            headerName: this.translateService.instant('dj-default-品名规格'),
            schema: 'item_name_spec',
          },
          {
            headerName: this.translateService.instant('dj-default-生产数量'),
            schema: 'plan_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-加工顺序'),
            schema: 'op_seq',
          },
          {
            headerName: this.translateService.instant('dj-default-制程代号'),
            schema: 'op_no',
          },
          { headerName: this.translateService.instant('dj-default-制程名称'), schema: 'op_name' },
          {
            headerName: this.translateService.instant('dj-default-性质'),
            schema: 'outsourcing_type',
          },
          {
            headerName: this.translateService.instant('dj-default-线别/厂商名称'),
            schema: 'supplier_name',
          },
          { headerName: this.translateService.instant('dj-default-投入数量'), schema: 'input_qty' },
          {
            headerName: this.translateService.instant('dj-default-完成数量'),
            schema: 'complete_qty',
          },
          {
            headerName: this.translateService.instant('dj-pcc-预计开工日'),
            schema: 'plan_start_date',
          },
          {
            headerName: this.translateService.instant('dj-default-非计划时程内'),
            schema: 'out_plan_time',
          },
          {
            headerName: this.translateService.instant('dj-pcc-预计完工日'),
            schema: 'plan_complete_date',
          },
          {
            headerName: this.translateService.instant('dj-pcc-实际开工日'),
            schema: 'actual_start_date',
          },
          {
            headerName: this.translateService.instant('dj-pcc-实际完工日'),
            schema: 'actual_complete_date',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
        ];
      }
      if (['APC', 'APC_O'].includes(category)) {
        columns = [
          { headerName: this.translateService.instant('dj-default-状态码'), schema: 'status' },
          { headerName: this.translateService.instant('dj-default-工单单号'), schema: 'wo_no' },
          { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
          {
            headerName: this.translateService.instant('dj-default-品名规格'),
            columns: [
              {
                schema: 'item_name_spec',
                headerName: this.translateService.instant('dj-default-品名'),
                level: 0,
                path: 'item_name_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_name_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
              {
                schema: 'item_spec',
                headerName: this.translateService.instant('dj-default-规格'),
                level: 0,
                path: 'item_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
            ],
          },

          {
            headerName: this.translateService.instant('dj-default-制程代号'),
            schema: 'process_no',
          },
          { headerName: this.translateService.instant('dj-default-制程名称'), schema: 'op_name' },
          { headerName: this.translateService.instant('dj-default-性质'), schema: 'op_type' },
          {
            headerName: this.translateService.instant('dj-default-线别/厂商名称'),
            schema: 'supplier_name',
          },
          { headerName: this.translateService.instant('dj-pcc-预计开工日'), schema: 'plan_date_s' },
          { headerName: this.translateService.instant('dj-pcc-预计完工日'), schema: 'plan_date_e' },
          {
            headerName: this.translateService.instant('dj-pcc-实际开工日'),
            schema: 'actual_date_s',
          },
          {
            headerName: this.translateService.instant('dj-pcc-实际完工日'),
            schema: 'actual_date_e',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
        ];
      }
    } else if (['REVIEW'].includes(category)) {
      if (state === '1') {
        columns = [
          {
            headerName: this.translateService.instant('dj-default-资源类型'),
            schema: 'resourceTypeName',
          },
          {
            headerName: this.translateService.instant('dj-default-资源位置'),
            schema: 'resourcePositionName',
          },
          { headerName: this.translateService.instant('dj-default-品号'), schema: 'item' },
          { headerName: this.translateService.instant('dj-default-品名'), schema: 'item_name' },
          { headerName: this.translateService.instant('dj-default-规格'), schema: 'item_spec' },
          {
            headerName: this.translateService.instant('dj-default-确认日期'),
            schema: 'confirm_date',
          },
          {
            headerName: this.translateService.instant('dj-default-金额'),
            schema: 'local_curr_amount',
          },
          { headerName: this.translateService.instant('dj-default-数量'), schema: 'qty' },
        ];
        if (responseData[0]?.enable_material_picking_count) {
          columns.splice(2, 0, {
            headerName: this.translateService.instant('dj-default-专案用料'),
            schema: 'project_material_type',
          });
        }
      } else if (state === '2') {
        columns = [
          {
            headerName: this.translateService.instant('dj-default-异常类型'),
            schema: 'abnormal_type',
          },
          { headerName: this.translateService.instant('dj-default-任务名称'), schema: 'task_name' },
          {
            headerName: this.translateService.instant('dj-default-异常原因'),
            schema: 'abnormal_no',
          },
          {
            headerName: this.translateService.instant('dj-default-异常次数'),
            schema: 'abnormal_number_of_times',
          },
          {
            headerName: this.translateService.instant('dj-default-执行者'),
            schema: 'executor_name',
          },
          {
            headerName: this.translateService.instant('dj-default-异常方案选择'),
            schema: 'abnormal_handle_plan',
          },
        ];
      } else if (state === '3') {
        columns = [
          { headerName: this.translateService.instant('dj-default-类型'), schema: 'get_type' },
          {
            headerName: this.translateService.instant('dj-default-预计完成日'),
            schema: 'plan_finish_date',
          },
          {
            headerName: this.translateService.instant('dj-default-实际完成日'),
            schema: 'actual_finish_date',
          },
          {
            headerName: this.translateService.instant('dj-default-差异天数'),
            schema: 'difference_days',
          },
          {
            headerName: this.translateService.instant('dj-default-关键要项'),
            schema: 'key_reason',
          },
        ];
      } else if (state === '4') {
        columns = [
          {
            headerName: this.translateService.instant('dj-default-客户简称'),
            schema: 'customer_shortname',
          },
          {
            headerName: this.translateService.instant('dj-default-专案风险评估'),
            schema: 'project_risk_assessment',
          },
          {
            headerName: this.translateService.instant('dj-default-购料预算超额率'),
            schema: 'project_purchase_material_budget_over_amount_rate',
          },
          {
            headerName: this.translateService.instant('dj-default-预算执行率'),
            schema: 'project_budget_execute_rate',
          },
          {
            headerName: this.translateService.instant('dj-default-购料超支金额'),
            schema: 'item_budget_over_amount',
          },
          {
            headerName: this.translateService.instant('dj-default-实际采购金额'),
            schema: 'purchase_local_curr_amount',
          },
          {
            headerName: this.translateService.instant('dj-default-已执行预算金额'),
            schema: 'budget_execute_local_curr_amount',
          },
          {
            headerName: this.translateService.instant('dj-default-预算成本金额'),
            schema: 'budget_total_local_curr_amount',
          },
          {
            headerName: this.translateService.instant('dj-default-部门'),
            schema: 'project_leader_dept_name',
          },
          {
            headerName: this.translateService.instant('dj-default-专案经理'),
            schema: 'project_leader_name',
          },
        ];
      }
    } else if (['PLM'].includes(category)) {
      columns = [
        { headerName: this.translateService.instant('dj-default-编号'), schema: 'design_no' },
        { headerName: this.translateService.instant('dj-default-名称'), schema: 'design_name' },
        {
          headerName: this.translateService.instant('dj-default-执行人名称'),
          schema: 'executor_name',
        },
        { headerName: this.translateService.instant('dj-default-详细描述'), schema: 'remark' },
        {
          headerName: this.translateService.instant('dj-default-实际开始日'),
          schema: 'actual_start_date',
        },
        {
          headerName: this.translateService.instant('dj-default-实际完成日'),
          schema: 'actual_finish_date',
        },
        {
          headerName: this.translateService.instant('dj-default-个人加总工时'),
          schema: 'work_hours',
        },
        { headerName: this.translateService.instant('dj-default-状态'), schema: 'design_status' },
        { headerName: this.translateService.instant('dj-default-完成率'), schema: 'complete_rate' },
        {
          headerName: this.translateService.instant('dj-default-报工说明'),
          schema: 'report_work_description',
          type: 'LABEL',
          editable: 'true',
        },
        {
          headerName: this.translateService.instant('dj-default-交付物'),
          schema: 'deliverable',
          type: 'pcc_deliverable',
        },
      ];
    } else if (['ODAR'].includes(category)) {
      columns = [
        { headerName: this.translateService.instant('dj-default-合同编号'), schema: 'contract_no' },
        {
          headerName: this.translateService.instant('dj-default-合同签订日期'),
          schema: 'contract_date',
        },
        {
          headerName: this.translateService.instant('dj-default-客户单号'),
          schema: 'customer_doc_no',
        },
        { headerName: this.translateService.instant('dj-default-客户'), schema: 'customer_name' },
        {
          headerName: this.translateService.instant('dj-default-收款方式'),
          schema: 'payment_method',
        },
        {
          headerName: this.translateService.instant('dj-default-交易货币'),
          schema: 'trans_currency',
        },
        {
          headerName: this.translateService.instant('dj-default-分期金额'),
          schema: 'instalment_trans_curr_amount',
        },
        {
          headerName: this.translateService.instant('dj-default-应收账款'),
          schema: 'trans_curr_ar_amount',
        },
        {
          headerName: this.translateService.instant('dj-default-收款'),
          schema: 'trans_curr_received_amount',
        },
      ];
    } else if (['PR'].includes(category)) {
      columns = [
        {
          headerName: this.translateService.instant('dj-default-结案状态'),
          schema: 'close_status',
        },
        {
          headerName: this.translateService.instant('dj-default-请购人员'),
          schema: 'requisitioner_name',
        },
        {
          headerName: this.translateService.instant('dj-default-请购单号'),
          schema: 'requisitions_no',
        },
        // s10: 新增请购日期栏位
        {
          headerName: this.translateService.instant('dj-pcc-请购日期'),
          schema: 'pr_date',
        },
        { headerName: this.translateService.instant('dj-default-项次'), schema: 'purchase_seq' },
        {
          headerName: this.translateService.instant('dj-default-子项次'),
          schema: 'purchase_sub_seq',
        },
        { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
        {
          headerName: this.translateService.instant('dj-default-品名规格'),
          columns: [
            {
              schema: 'item_name_spec',
              headerName: this.translateService.instant('dj-default-品名'),
              level: 0,
              path: 'item_name_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_name_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
            {
              schema: 'item_spec',
              headerName: this.translateService.instant('dj-default-规格'),
              level: 0,
              path: 'item_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
          ],
        },
        {
          headerName: this.translateService.instant('dj-default-请购数量'),
          schema: 'requisitions_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-采购人员'),
          schema: 'purchaser_name',
        },
        {
          headerName: this.translateService.instant('dj-default-采购数量'),
          schema: 'purchase_qty',
        },
        { headerName: this.translateService.instant('dj-default-需求日期'), schema: 'demand_date' },
        { headerName: this.translateService.instant('dj-default-完成率'), schema: 'complete_rate' },
      ];
    } else if (['POPUR'].includes(category)) {
      columns = [
        {
          headerName: this.translateService.instant('dj-default-结案状态'),
          schema: 'close_status',
        },
        {
          headerName: this.translateService.instant('dj-default-采购人员'),
          schema: 'purchaser_name',
        },
        { headerName: this.translateService.instant('dj-pcc-采购单号'), schema: 'purchase_no' },
        { headerName: this.translateService.instant('dj-default-项次'), schema: 'purchase_seq' },
        {
          headerName: this.translateService.instant('dj-default-子项次'),
          schema: 'purchase_sub_seq',
        },
        { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
        {
          headerName: this.translateService.instant('dj-default-品名规格'),
          columns: [
            {
              schema: 'item_name_spec',
              headerName: this.translateService.instant('dj-default-品名'),
              level: 0,
              path: 'item_name_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_name_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
            {
              schema: 'item_spec',
              headerName: this.translateService.instant('dj-default-规格'),
              level: 0,
              path: 'item_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
          ],
        },
        { headerName: this.translateService.instant('dj-default-完成率'), schema: 'complete_rate' },
        {
          headerName: this.translateService.instant('dj-default-采购数量'),
          schema: 'purchase_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-入库数量'),
          schema: 'stock_in_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-待验数量'),
          schema: 'wait_inspection_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-验退数量'),
          schema: 'accepted_return_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-预计交货日'),
          schema: 'plan_delivery_date',
        },
        {
          headerName: this.translateService.instant('dj-pcc-到货日期'),
          schema: 'arrival_date',
        },
      ];
      if (this.hasT100) {
        const t100Columns = [
          {
            headerName: this.translateService.instant('dj-default-待验数量'),
            schema: 'wait_inspection_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-验退数量'),
            schema: 'accepted_return_qty',
          },
        ];
        columns.push(...t100Columns);
      }
    } else if (['MO'].includes(category)) {
      columns = [
        { headerName: this.translateService.instant('dj-default-状态码'), schema: 'status' },
        {
          headerName: this.translateService.instant('dj-default-生管人员'),
          schema: 'production_control_name',
        },
        { headerName: this.translateService.instant('dj-pcc-工单号码'), schema: 'wo_no' },
        { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
        {
          headerName: this.translateService.instant('dj-default-品名规格'),
          columns: [
            {
              schema: 'item_name_spec',
              headerName: this.translateService.instant('dj-default-品名'),
              level: 0,
              path: 'item_name_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_name_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
            {
              schema: 'item_spec',
              headerName: this.translateService.instant('dj-default-规格'),
              level: 0,
              path: 'item_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
          ],
        },
        {
          headerName: this.translateService.instant('dj-default-生产数量'),
          schema: 'production_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-入库数量'),
          schema: 'stock_in_qty',
        },
        {
          headerName: this.translateService.instant('dj-default-已发料套数'),
          schema: 'issue_set_qty',
        },
        { headerName: this.translateService.instant('dj-pcc-预计完工日'), schema: 'plan_date_e' },
        { headerName: this.translateService.instant('dj-default-完成率'), schema: 'complete_rate' },
      ];
    } else if (['MOMA'].includes(category)) {
      columns = [
        { headerName: this.translateService.instant('dj-default-状态码'), schema: 'status' },
        {
          headerName: this.translateService.instant('dj-default-生管人员'),
          schema: 'production_control_name',
        },
        { headerName: this.translateService.instant('dj-pcc-工单号码'), schema: 'wo_no' },
        {
          headerName: this.translateService.instant('dj-default-生产料号'),
          schema: 'production_item_no',
        },
        {
          headerName: this.translateService.instant('dj-default-生产料号规格'),
          schema: 'production_item_spec',
        },
        {
          headerName: this.translateService.instant('dj-default-制令生产数量'),
          schema: 'wo_production_qty',
        },
        { headerName: this.translateService.instant('dj-pcc-预计完工日'), schema: 'plan_date_e' },
        { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
        {
          headerName: this.translateService.instant('dj-pcc-预计领料日'),
          schema: 'plan_picking_date',
        },
        { headerName: this.translateService.instant('dj-pcc-仓库编号'), schema: 'warehouse_no' },
        { headerName: this.translateService.instant('dj-pcc-仓库名称'), schema: 'warehouse_name' },
        {
          headerName: this.translateService.instant('dj-default-品名规格'),
          columns: [
            {
              schema: 'item_name_spec',
              headerName: this.translateService.instant('dj-default-品名'),
              level: 0,
              path: 'item_name_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_name_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
            {
              schema: 'item_spec',
              headerName: this.translateService.instant('dj-default-规格'),
              level: 0,
              path: 'item_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
          ],
        },
        {
          headerName: this.translateService.instant('dj-default-需领用量'),
          schema: 'required_qty',
        },
        { headerName: this.translateService.instant('dj-default-已发料数量'), schema: 'issue_qty' },
        { headerName: this.translateService.instant('dj-default-完成率'), schema: 'complete_rate' },
      ];
    } else if (['PO', 'PO_KEY', 'PO_NOT_KEY', 'OD', 'EXPORT', 'SHIPMENT'].includes(category)) {
      let oddNo, count, counted, date, title, secondTitle, title_name;
      oddNo = 'so_no';
      count = 'so_qty';
      counted = 'shipping_qty';
      title_name = 'salesman_name';
      secondTitle = this.translateService.instant('dj-default-业务人员');
      if (category === 'PO') {
        oddNo = 'purchase_no';
        count = 'purchase_qty';
        counted = 'stock_in_qty';
        date = 'plan_delivery_date';
        title = this.translateService.instant('dj-default-入库数量');
        secondTitle = this.translateService.instant('dj-default-采购人员');
        title_name = 'purchaser_name';
      } else if (category === 'OD') {
        counted = 'delivery_qty';
        date = 'plan_delivery_date';
        title = this.translateService.instant('dj-default-已交数量');
      } else if (category === 'EXPORT') {
        date = 'shipping_date';
        title = this.translateService.instant('dj-default-出货数量');
      } else if (category === 'SHIPMENT') {
        date = 'shipping_date';
        title = this.translateService.instant('dj-default-出货数量');
      }
      columns = [
        {
          headerName: this.translateService.instant('dj-default-结案状态'),
          schema: 'close_status',
        },
        { headerName: secondTitle, schema: title_name },
        { headerName: this.translateService.instant('dj-pcc-订单单号'), schema: oddNo },
        { headerName: this.translateService.instant('dj-default-项次'), schema: 'purchase_seq' },
        {
          headerName: this.translateService.instant('dj-default-子项次'),
          schema: 'purchase_sub_seq',
        },
        { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
        {
          headerName: this.translateService.instant('dj-default-品名规格'),
          columns: [
            {
              schema: 'item_name_spec',
              headerName: this.translateService.instant('dj-default-品名'),
              level: 0,
              path: 'item_name_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_name_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
            {
              schema: 'item_spec',
              headerName: this.translateService.instant('dj-default-规格'),
              level: 0,
              path: 'item_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
          ],
        },
        { headerName: this.translateService.instant('dj-pcc-订单数量'), schema: count },
        { headerName: title, schema: counted },
        // { headerName: this.translateService.instant('dj-default-已发料套数'), schema: 'issue_set_qty' },
        { headerName: this.translateService.instant('dj-default-预计交货日'), schema: date },
        { headerName: this.translateService.instant('dj-default-完成率'), schema: 'complete_rate' },
      ];

      if (category === 'SHIPMENT') {
        this.removeArrayItem(columns, 'close_status');
        this.editColumnLabel(
          columns,
          'shipping_date',
          this.translateService.instant('dj-pcc-出货日期')
        );
      }
      if (category === 'EXPORT') {
        this.removeArrayItem(columns, 'close_status');
        this.editColumnLabel(
          columns,
          'shipping_date',
          this.translateService.instant('dj-pcc-出货日期')
        );
      }
      if (category === 'PO') {
        columns = [];
        columns = [
          {
            headerName: this.translateService.instant('dj-default-结案状态'),
            schema: 'close_status',
          },
          {
            headerName: this.translateService.instant('dj-default-采购人员'),
            schema: 'purchaser_name',
          },
          {
            headerName: this.translateService.instant('dj-default-预计交货日'),
            schema: 'plan_delivery_date',
          },
          { headerName: this.translateService.instant('dj-pcc-采购单号'), schema: 'purchase_no' },
          { headerName: this.translateService.instant('dj-default-项次'), schema: 'purchase_seq' },
          {
            headerName: this.translateService.instant('dj-default-子项次'),
            schema: 'purchase_sub_seq',
          },
          { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
          {
            headerName: this.translateService.instant('dj-default-品名规格'),
            columns: [
              {
                schema: 'item_name_spec',
                headerName: this.translateService.instant('dj-default-品名'),
                level: 0,
                path: 'item_name_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_name_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
              {
                schema: 'item_spec',
                headerName: this.translateService.instant('dj-default-规格'),
                level: 0,
                path: 'item_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
            ],
          },
          {
            headerName: this.translateService.instant('dj-default-采购数量'),
            schema: 'purchase_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-入库数量'),
            schema: 'stock_in_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-入库日期'),
            schema: 'stock_in_date',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
        ];
      }
      if (['PO_KEY', 'PO_NOT_KEY'].includes(category)) {
        columns = [];
        columns = [
          {
            headerName: this.translateService.instant('dj-default-结案状态'),
            schema: 'close_status',
          },
          {
            headerName: this.translateService.instant('dj-default-采购人员'),
            schema: 'purchaser_name',
          },
          {
            headerName: this.translateService.instant('dj-default-预计交货日'),
            schema: 'plan_delivery_date',
          },
          { headerName: this.translateService.instant('dj-pcc-采购单号'), schema: 'purchase_no' },
          { headerName: this.translateService.instant('dj-default-项次'), schema: 'purchase_seq' },
          {
            headerName: this.translateService.instant('dj-default-子项次'),
            schema: 'purchase_sub_seq',
          },
          { headerName: this.translateService.instant('dj-default-料号'), schema: 'item_no' },
          {
            headerName: this.translateService.instant('dj-default-品名规格'),
            columns: [
              {
                schema: 'item_name_spec',
                headerName: this.translateService.instant('dj-default-品名'),
                level: 0,
                path: 'item_name_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_name_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
              {
                schema: 'item_spec',
                headerName: this.translateService.instant('dj-default-规格'),
                level: 0,
                path: 'item_spec',
                editor: {
                  id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                  schema: 'item_spec',
                  showIcon: false,
                  type: 'INPUT',
                  editable: false,
                  disabled: true,
                },
              },
            ],
          },
          {
            headerName: this.translateService.instant('dj-default-采购数量'),
            schema: 'purchase_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-入库数量'),
            schema: 'stock_in_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-入库日期'),
            schema: 'stock_in_date',
          },
          {
            headerName: this.translateService.instant('dj-default-完成率'),
            schema: 'complete_rate',
          },
          {
            headerName: this.translateService.instant('dj-pcc-到货日期'),
            schema: 'arrival_date',
          },
        ];
      }
    } else if (['PRSUM', 'POSUM'].includes(category)) {
      columns = [
        {
          headerName: this.translateService.instant('dj-pcc-参考单别'),
          schema: 'reference_type_no',
        },
        {
          headerName: this.translateService.instant('dj-pcc-参考单号'),
          schema: 'reference_doc_no',
        },
        {
          headerName: this.translateService.instant('dj-default-品名规格'),
          columns: [
            {
              schema: 'item_name_spec',
              headerName: this.translateService.instant('dj-default-品名'),
              level: 0,
              path: 'item_name_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_name_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
            {
              schema: 'item_spec',
              headerName: this.translateService.instant('dj-default-规格'),
              level: 0,
              path: 'item_spec',
              editor: {
                id: '4c37a838-9a3d-48b9-938a-bd19cc2b6ad5',
                schema: 'item_spec',
                showIcon: false,
                type: 'INPUT',
                editable: false,
                disabled: true,
              },
            },
          ],
        },
        {
          headerName: this.translateService.instant('dj-default-品号类别/群组'),
          schema: 'item_classification',
        },
        { headerName: this.translateService.instant('dj-default-完成率'), schema: 'complete_rate' },
      ];
      let columsType;
      if (['POSUM'].includes(category)) {
        columsType = [
          {
            headerName: this.translateService.instant('dj-default-采购人员'),
            schema: 'purchaser_name',
          },
          { headerName: this.translateService.instant('dj-pcc-采购单号'), schema: 'purchase_no' },
          {
            headerName: this.translateService.instant('dj-default-采购数量'),
            schema: 'purchase_qty',
          },
          {
            headerName: this.translateService.instant('dj-default-入库数量'),
            schema: 'stock_in_qty',
          },
        ];
      } else if (['PRSUM'].includes(category)) {
        columsType = [
          {
            headerName: this.translateService.instant('dj-default-请购人员'),
            schema: 'requisitioner_name',
          },
          {
            headerName: this.translateService.instant('dj-default-请购单号'),
            schema: 'requisitions_no',
          },
          {
            headerName: this.translateService.instant('dj-default-请购数量'),
            schema: 'requisitions_qty',
          },
          // s10: 新增请购日期栏位
          {
            headerName: this.translateService.instant('dj-pcc-请购日期'),
            schema: 'pr_date',
          },
          {
            headerName: this.translateService.instant('dj-default-采购数量'),
            schema: 'purchase_qty',
          },
        ];
      }
      columns = columns.concat(columsType);
    } else if (['PCM'].includes(category)) {
      columns = [
        { headerName: this.translateService.instant('dj-default-项目编号'), schema: 'project_no' },
        {
          headerName: this.translateService.instant('dj-default-项目负责人'),
          schema: 'project_leader_name',
        },
        {
          headerName: this.translateService.instant('dj-default-预算负责人'),
          schema: 'budget_editor_name',
        },
        {
          headerName: this.translateService.instant('dj-default-材料负责人'),
          schema: 'material_leader_name',
        },
        {
          headerName: this.translateService.instant('dj-default-费用负责人'),
          schema: 'expense_leader_name',
        },
        { headerName: this.translateService.instant('dj-default-版本号'), schema: 'version_no' },
        { headerName: this.translateService.instant('dj-default-状态'), schema: 'manage_status' },
        {
          headerName: this.translateService.instant('dj-default-审核时间'),
          schema: 'approve_time',
        },
      ];
    }
    if (['PO', 'MO'].includes(category)) {
      columns.push({
        headerName: this.translateService.instant('dj-pcc-实际差异天数'),
        schema: 'diff_days',
      }, {
        headerName: this.translateService.instant('dj-pcc-预计差异天数'),
        schema: 'plan_diff_days',
      });
    }
    if (['PO_KEY', 'PO_NOT_KEY', 'MOOP', 'POPUR'].includes(category)) {
      columns.push({
        headerName: this.translateService.instant('dj-default-差异天数'),
        schema: 'diff_days',
      });
    }
    const orderFields = [];
    columns?.forEach((element) => {
      orderFields.push({
        name: element.schema,
        description: element.headerName,
      });
    });

    const taskCategoryLayout = [
      {
        id: 'inquiry',
        type: 'ATHENA_TABLE',
        schema: 'inquiry',
        editable: true,
        rowIndex: false,
        checkbox: false,
        rowDelete: false,
        disabledUserDefined: false,
        columnDefs: this.commonService.getLayoutNew(columns),
        allFields: this.commonService.getAllFields(columns),
        suppressFirstAddRow: true,
        saveColumnsWidth: true,
        setting: {
          order: {
            options: [
              {
                schema: 'liable_person_name',
                orderType: 'string-asc',
                isFirst: false,
              },
            ],
          },
          orderFields: orderFields,
        },
      },
    ];

    const data = {
      layout: taskCategoryLayout,
      pageData: {
        inquiry: responseData,
      },
      content: {
        pattern: 'DATA_ENTRY',
        category: 'SIGN-DOCUMENT',
        executeContext: executeContext,
      },
      rules: [],
      style: {},
    };

    return data;
  }

  getReportslist(): Observable<any> {
    const url = `${this.knowledgeMapsUrl}/knowledgegraph/task/reportsByBizCodeNType?type=2&bizCode=review_DTD_Assignment`;
    return this.http.get(url);
  }

  getTaskId(params: any): Observable<any> {
    const url = `${this.smartDataUrl}/DataFootprint/task/queryByState`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }

  getTaskApproval(params: any): Observable<any> {
    params = [params];
    const url = `${this.atmcUrl}/api/atmc/v1/approval/getTaskApprovalByTaskIds`;
    return this.http.post(url, params, {
      headers: this.commonService.getHeader(),
    });
  }

  project_Doc_Data_Get(params) {
    const { taskDetail, process_status } = params;
    const doc_info = [
      {
        ...taskDetail,
        process_status: process_status,
      },
    ];
    return this.commonService
      .getInvData('project.doc.info.process', { doc_info: doc_info }, taskDetail.eoc_company_id)
      .pipe(
        pluck('data', 'doc_info'),
        map((doc_info) => {
          return doc_info.map((item) => ({
            ...item,
            process_status,
            close_status: this.statusList[item.close_status] || item.close_status,
            status: this.statusList1[item.status] || item.status,
            op_type: this.statusList4[item.op_type] || item.op_type,
          }));
        })
      );
  }

  budget_view_get(params) {
    const search_info = {
      use_has_next: false,
      project_budget_view_search_info: [
        {
          project_info: [{ project_no: params.project_no }],
          range: 0,
          manage_status: 'ALL',
          contain_cancel: true,
          contain_history: true,
          no_show_detail: true,
        },
      ],
    };
    return this.commonService.getInvData('bm.pcsc.budget.view.get', search_info).pipe(
      pluck('data', 'project_budget_view_info'),
      map((project_budget_view_info) => {
        return project_budget_view_info.map((item) => ({
          ...item,
          manage_status: this.statusList5[item.manage_status],
          approve_time: item.approve_time ? moment(item.approve_time).format('YYYY-MM-DD') : '',
        }));
      })
    );
  }

  project_Task_complete_rate_data_Get(params) {
    const { taskDetail, process_status } = params;
    const doc_info = [
      {
        ...taskDetail,
        process_status: process_status,
      },
    ];
    return this.commonService
      .getInvData(
        'project.task.complete.rate.data.get',
        { doc_info: doc_info },
        taskDetail.eoc_company_id
      )
      .pipe(
        pluck('data', 'doc_info'),
        map((doc_info) => {
          return doc_info.map((item) => ({
            ...item,
            process_status,
            is_on_schedule: this.timeStatus[item.is_on_schedule],
            task_status: this.taskStatus[item.task_status],
            important: this.level[item.important],
            plan_start_date: item.plan_start_date
              ? moment(item.plan_start_date).format('YYYY-MM-DD')
              : '',
            plan_finish_date: item.plan_finish_date
              ? moment(item.plan_finish_date).format('YYYY-MM-DD')
              : '',
            actual_start_date: item.actual_start_date
              ? moment(item.actual_start_date).format('YYYY-MM-DD')
              : '',
            actual_finish_date: item.actual_finish_date
              ? moment(item.actual_finish_date).format('YYYY-MM-DD')
              : '',
            complete_rate: item.task_complete_rate,
            milestone_type: item.milestone_type === 'true' ? '是' : '否',
          }));
        })
      );
  }

  isa_order_plan_Get(params) {
    const { taskDetail, process_status } = params;
    const param = [
      {
        project_no: taskDetail?.project_no,
        task_no: taskDetail?.task_no,
        // process_status: process_status,
      },
    ];
    return this.commonService
      .getInvData('isa.order.plan.get', { isa_order: param }, taskDetail.eoc_company_id)
      .pipe(
        pluck('data', 'isa_order'),
        map((isa_order) => {
          const isaOrder = [];
          isa_order.forEach((isaOrderObj) => {
            if (process_status === '1' && !['3', '5'].includes(isaOrderObj.project_status)) {
              isaOrderObj?.isa_order_plan.forEach((item) => {
                const obj = {
                  ...item,
                  plan_start_time: item.plan_start_time
                    ? moment(item.plan_start_time).format('YYYY-MM-DD')
                    : '',
                  plan_end_time: item.plan_end_time
                    ? moment(item.plan_end_time).format('YYYY-MM-DD')
                    : '',
                  actual_start_time: item.actual_start_time
                    ? moment(item.actual_start_time).format('YYYY-MM-DD')
                    : '',
                  actual_end_time: item.actual_end_time
                    ? moment(item.actual_end_time).format('YYYY-MM-DD')
                    : '',
                  task_progress: item.task_progress
                    ? this.commonService.accMul(item.task_progress, 100) + '%'
                    : '0%',
                  task_status: this.assc_isa_order_task_status[item.task_status],
                  project_status: isa_order.project_status,
                  process_status,
                };
                isaOrder.push(obj);
              });
            }
            // 完成
            if (process_status === '2' && ['3', '5'].includes(isaOrderObj.project_status)) {
              isaOrderObj?.isa_order_plan.forEach((item) => {
                const obj = {
                  ...item,
                  plan_start_time: item.plan_start_time
                    ? moment(item.plan_start_time).format('YYYY-MM-DD')
                    : '',
                  plan_end_time: item.plan_end_time
                    ? moment(item.plan_end_time).format('YYYY-MM-DD')
                    : '',
                  actual_start_time: item.actual_start_time
                    ? moment(item.actual_start_time).format('YYYY-MM-DD')
                    : '',
                  actual_end_time: item.actual_end_time
                    ? moment(item.actual_end_time).format('YYYY-MM-DD')
                    : '',
                  task_progress: item.task_progress
                    ? this.commonService.accMul(item.task_progress, 100) + '%'
                    : '0%',
                  task_status: this.assc_isa_order_task_status[item.task_status],
                  project_status: isa_order.project_status,
                  process_status,
                };
                isaOrder.push(obj);
              });
            }
          });
          return isaOrder;
        })
      );
  }

  /** review 取得工作项资料 */
  project_Review_Data_Get(params: any, eocMap: any, urlType: any) {
    const param = { doc_info: params };
    return this.commonService.getInvData(urlType, param, eocMap).pipe(
      map((res) => {
        return res.data.doc_info || res.data.project_instant_cost_info;
      })
    );
  }

  /**
   * 'project.remaining.resource.data.get'
   */
  getRemainingResourceData(params: any) {
    const { doc_info, eocMap } = params;
    const param = { doc_info };
    return this.commonService.getInvData('project.remaining.resource.data.get', param, eocMap).pipe(
      map((res) => {
        const remaining = res.data.doc_info || res.data.project_instant_cost_info;
        let money = 0,
          num = 0;
        remaining.forEach((o) => {
          o.process_status = '1';
          o.resourceTypeName = this.resourceTypeList[o.resource_type];
          if (o.resource_type !== 'A') {
            o.resourcePositionName = this.resourcePositionList[o.resource_position];
          } else {
            o.resourcePositionName = o.resource_position;
          }
          // money = money + o.local_curr_amount;
          // num = num + o.qty;
          money = this.commonService.accAdd(money, o.local_curr_amount);
          num = this.commonService.accAdd(num, o.qty);
        });
        if (remaining?.length) {
          remaining.push({
            process_status: '1',
            resourceTypeName: this.translatePccWord('小计'),
            local_curr_amount: money,
            qty: num,
          });
        }
        return remaining;
      })
    );
  }

  /**
   * 'project.abnormal.review.info.get'
   */
  getAbnormalReviewInfo(params: any) {
    const { doc_info, eocMap } = params;
    const param = { doc_info };
    return this.commonService.getInvData('project.abnormal.review.info.get', param, eocMap).pipe(
      map((res) => {
        const data = res.data.doc_info || res.data.project_instant_cost_info;
        return data.map((item) => ({
          ...item,
          process_status: '2',
          app_category: this.translatePccWord('专案中控台'),
        }));
      })
    );
  }

  /**
   * 'project.schedule.review.info.get'
   */
  getScheduleReviewInfo(params: any) {
    const { doc_info, eocMap } = params;
    const param = { doc_info };
    return this.commonService.getInvData('project.schedule.review.info.get', param, eocMap).pipe(
      map((res) => {
        const data = res.data.doc_info || res.data.project_instant_cost_info;
        return data.map((item) => ({
          ...item,
          process_status: '3',
          get_type: this.translatePccWord('进度'),
          difference_days: `${this.translatePccWord('专案延迟')}${
            item.difference_days
          }${this.translateWord('天')}`,
        }));
      })
    );
  }

  getTaskInfo(params: any) {
    const { taskDetail, process_status, apiName } = params;
    const project_info = [
      {
        project_no: taskDetail.project_no,
        task_no: taskDetail.task_no,
        control_mode: '1',
        process_status,
      },
    ];
    return this.commonService
      .getInvData(apiName, {
        project_info,
      })
      .pipe(
        map((res) => {
          const data = res.data.project_info;
          data.forEach((o) => {
            o.is_approve = o.is_approve
              ? this.translateService.instant('dj-default-需签核')
              : this.translateService.instant('dj-default-无需签核');
            o.process_status = process_status;
            o.main_unit = o.main_unit ? this.Unit[o.main_unit] : '';
            o.second_unit = o.second_unit ? this.Unit[o.second_unit] : '';
            if (o.attachment?.data && o.attachment?.data.length) {
              o.attachment?.data.forEach((res) => {
                res.uploadUserName = res.upload_user_name;
              });
            } else {
              o.attachment = {
                data: [],
              };
            }
          });
          return data;
        })
      );
  }

  task_Info_Get(params: any) {
    return this.commonService.getInvData('task_Info_Get', params).pipe(
      map((res) => {
        const data = res.data.doc_info || res.data.project_instant_cost_info;
        return data.map((item) => ({
          ...item,
          process_status: '3',
          get_type: this.translatePccWord('进度'),
          difference_days: `${this.translatePccWord('专案延迟')}${
            item.difference_days
          }${this.translateWord('天')}`,
        }));
      })
    );
  }

  project_Wo_Production_Info_Process(params) {
    const { taskDetail, process_status } = params;
    const doc_info = [
      {
        project_no: taskDetail.project_no,
        task_no: taskDetail.task_no,
        display_project_no: taskDetail.display_project_no,
        process_status,
      },
    ];

    return this.commonService
      .getInvData('project.wo.production.info.process', {
        doc_info: doc_info,
      })
      .pipe(
        pluck('data', 'doc_info'),
        map((doc_info) => {
          return doc_info.map((item) => ({
            ...item,
            process_status,
            status: this.statusList3[item.status] || item.status,
            op_type: this.statusList4[item.op_type] || item.op_type,
          }));
        })
      );
  }

  progress_data_get(params) {
    const { taskDetail, process_status } = params;
    const wo_op_data: any = [
      {
        ...taskDetail,
        process_status,
      },
    ];
    const site_no: string = taskDetail.eoc_site_id;
    const eocMap: any = taskDetail.eoc_company_id;
    return this.commonService
      .getInvData(
        'current.project.wo.op.progress.data.get',
        {
          wo_op_data,
          site_no: site_no,
        },
        eocMap
      )
      .pipe(
        pluck('data', 'wo_op_data'),
        map((wo_op_data) => {
          return wo_op_data.map((item) => ({
            ...item,
            status_code: this.statusList1[item.status_code] || item.status_code,
            outsourcing_type: this.statusList4[item.outsourcing_type] || item.outsourcing_type,
            process_status,
          }));
        })
      );
  }

  work_Item_Data_Get(params) {
    const { taskDetail, process_status } = params;
    const doc_info = [
      {
        project_no: taskDetail.project_no,
        task_no: taskDetail.task_no,
        process_status,
      },
    ];
    return this.commonService
      .getInvData('work.item.data.get', {
        doc_info: doc_info,
      })
      .pipe(
        pluck('data', 'doc_info'),
        map((doc_info) => {
          return doc_info.map((item) => ({
            ...item,
            process_status,
            design_status: this.statusList2[item.design_status] || item.outsourcing_type,
          }));
        })
      );
  }

  translatePccWord(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }
  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  /**
   * 删除数组中匹配到的schema的一项
   * @param arr 数组
   * @param schema 要删除的元素
   * @returns 数组
   */
  removeArrayItem(arr: Array<any>, schema: string): void {
    for (let index = 0; index < arr.length; index++) {
      if (arr[index].schema === schema) {
        arr.splice(index, 1);
        break;
      }
    }
  }

  editColumnLabel(arr: Array<any>, schema: string, newHeaderName: string): void {
    for (let index = 0; index < arr.length; index++) {
      if (arr[index].schema === schema) {
        arr[index].headerName = newHeaderName;
        break;
      }
    }
  }

  /**
   * 存在T100的任务，hasT100=true
   */
  getTenantProductOperationList(): void {
    const tenantId = this.userService.getUser('tenantId');
    this.commonService.getTenantProductOperationList(tenantId).subscribe(
      (res: any) => {
        // prod_name：产品别
        this.hasT100 =
          res.prod_eoc_mapping.filter((item) => {
            return item.prod_name === 'T100';
          }).length > 0;
      },
      (error) => {}
    );
  }
}
