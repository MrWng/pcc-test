import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class PosumService {

  constructor(
    private translateService: TranslateService,
  ) { }


  /**
   * 计算数组中待处理和已完成的总数
   * @param data
   * @returns
   */
  getTotalSum(data: any[]): any {
    return data.reduce((accumulator, currentValue) => {
      if (currentValue.process_status === '1') {
        accumulator.watting++;
      } else {
        accumulator.compleate++;
      }
      return accumulator;
    }, {
      'watting': 0,
      'compleate': 0
    });
  }

  /**
 * 处理Posum任务类型的数据：按照单别单号品名规格进行分组。
 * 1: 相同单别单号品名规格，进行合并单元格
 * 2: 同单别单号品名规格，相同群组进行合并单元格
 * 3: 统计群组的总完成率、总进货量、总
 */
  handelPopurPosumAndData(list, handelData, callback, task_category): void {
    const mergeGroupData = this.getMergeGroup(list, callback);
    this.getMergeTableList(mergeGroupData, handelData, task_category);
  }

  /**
 * 按照单别单号品名规格分成大组,合并单元格
 * @returns
*/
  getMergeGroup(rawData: any, callBack: any): any {
    return rawData.reduce((acc, obj) => {
      const key = callBack(obj);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }

  /**
* 获取类似合并单元格的数据
* @param grouped
*/
  getMergeTableList(grouped, handelData, task_category): void {
    for (const k in grouped) {
      if (Object.prototype.hasOwnProperty.call(grouped, k)) {
        // 获取每个大组名称对应的数组
        const element = grouped[k];
        // 将大组名称对应的数组按照item_classification进行分组
        if (task_category === 'MOOP-SFT-APC') {
          element.forEach((o, i) => {
            if (i > 0) {
              o.status = '';  // 状态码
              o.wo_no = ''; // 工单号码
              o.item_no = ''; // 料号
              o.item_name_spec = ''; // 品名规格
              o.item_spec = '';
              o.production_qty = ''; // 生产数量
              o.production_control_name = ''; // 生管人员
            }
          });
          handelData.data = [...handelData.data, ...element];
        }
        if (task_category === 'POPUR') {
          element.forEach((o, i) => {
            if (i > 0) {
              o.close_status = '';  // 结案状态
              o.purchaser_name = ''; // 采购人员
              o.purchase_no = ''; // 采购单号
              o.purchase_seq = ''; // 项次
              o.purchase_sub_seq = ''; // 子项次
              o.item_no = ''; // 生產料號
              o.item_name_spec = ''; // 品名规格
              // o.item_spec = '';
              o.purchase_qty = ''; // 采购数量
              o.complete_rate = ''; //  完成率
            }
          });
          handelData.data = [...handelData.data, ...element];
        }
        if (task_category === 'POSUM') {
          const classification = this.getPosumClassificationGroup(element);
          const groupTotalData = this.getPosumGroupTotalData(classification, handelData);
          this.setPosumTotalData(groupTotalData, handelData);
        }
        if (task_category === 'PRSUM') {
          const classification = this.getPrsumClassificationGroup(element);
          Object.keys(classification).forEach((i) => {
            const completeRateClassification = this.getCompleteRateClassificationGroup(classification[i]);
            Object.keys(completeRateClassification).forEach((o) => {
              completeRateClassification[o].forEach((item, index) => {
                if (index === 0) {
                  item.complete_rate = String(item.complete_rate).length > 4
                    ? Number(item.complete_rate).toFixed(2) : Number(item.complete_rate);
                  item.complete_rate = item.complete_rate + '%';
                }
                if (index > 0) {
                  item.item_classification = '';
                  item.reference_type_no = '';
                  item.reference_doc_no = '';
                  item.item_name_spec = '';
                  item.item_spec = '';
                  item.complete_rate = '';
                }
              });
              // 保存处理数据的结果
              handelData.data = [...handelData.data, ...completeRateClassification[o]];
            });
          });
        }
      }
    }
  }

  getPrsumClassificationGroup(rawData: any): any {
    return rawData.reduce((acc, obj) => {
      const key = obj.item_classification;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        ...obj,
        ...{
          out_plan_time: obj.out_plan_time === 'Y' ? '*' : '',
          complete_rate: String(obj.complete_rate).length > 4 ? Number(obj.complete_rate).toFixed(2) : Number(obj.complete_rate)
        }
      });
      return acc;
    }, {}) ?? {};
  }

  getCompleteRateClassificationGroup(rawData: any): any {
    return rawData.reduce((acc, obj) => {
      const key = obj.complete_rate;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {}) ?? {};
  }

  /**
* 根据品号分类/群组分组: 遍历大组，将其按照群组进行分组，结果是{key: {group:[values]}}
* @param rawData
* @returns
*/
  getPosumClassificationGroup(rawData: any): any {
    return rawData.reduce((acc, obj) => {
      const key = obj.item_classification;
      if (!acc[key]) {
        acc[key] = [{
          reference_type_no: obj.reference_type_no,
          reference_doc_no: obj.reference_doc_no,
          item_name_spec: obj.item_name_spec,
          item_spec: obj.item_spec,
          item_classification: obj.item_classification,
          complete_rate: 0,
          purchase_qty: 0,
          stock_in_qty: 0
        }];
      }
      acc[key].push({
        ...obj,
        ...{
          reference_type_no: '',
          reference_doc_no: '',
          item_name_spec: '',
          item_spec: '',
          item_classification: '',
          out_plan_time: obj.out_plan_time === 'Y' ? '*' : '',
          complete_rate: String(obj.complete_rate).length > 4 ? Number(obj.complete_rate).toFixed(2) : Number(obj.complete_rate)
        }
      });
      return acc;
    }, {}) ?? {};
  }

  /**
 * 获取总明细信息
 * @param classification
 * @returns
 */
  getPosumGroupTotalData(classification: any, handelData): any {
    const groupTotalData = {
      total_purchase_qty: 0,
      total_stock_in_qty: 0,
    };
    this.getPosumClassificationTotalData(classification, groupTotalData, handelData);
    return groupTotalData;
  }

  /**
 * 获取群组分组总明细
 * @param classification
 * @param groupTotalData
 */
  getPosumClassificationTotalData(classification: any, groupTotalData, handelData): void {
    Object.keys(classification).forEach(((i, classificationIndex) => {
      const classificationTotalData = {
        complete_rate_number: 0,
        complete_rate: '0',
        purchase_qty: 0,
        stock_in_qty: 0,
        reference_type_no: '',
        reference_doc_no: '',
        item_name_spec: '',
        item_spec: '',
      };
      // 遍历每个小分组名字对应的数组，统计小组组的总完成率、总进货量和总出货量
      classification[i].forEach((item, index) => {
        if (classificationIndex > 0 && index === 0) {
          item.reference_type_no = '';
          item.reference_doc_no = '';
          item.item_name_spec = '';
          item.item_spec = '';
        }
        if (index > 0) {
          classificationTotalData.complete_rate_number += Number(item.complete_rate);
          classificationTotalData.purchase_qty += Number(item.purchase_qty);
          classificationTotalData.stock_in_qty += Number(item.stock_in_qty);
        }
      });
      // 给每个小分组名字对应的数组的第一个数组（总计组）赋值总完成率、总进货量和总出货量
      const caculeData = classificationTotalData.complete_rate_number / (classification[i].length - 1);
      if (String(caculeData).length > 4) {
        classification[i][0].complete_rate = Number(caculeData).toFixed(2) + '%';
      } else {
        classification[i][0].complete_rate = caculeData + '%';
      }
      classification[i][0].purchase_qty = this.judgeValue(classificationTotalData.purchase_qty) ?
        Number(classificationTotalData.purchase_qty).toFixed(2) : classificationTotalData.purchase_qty;
      classification[i][0].stock_in_qty =
        this.judgeValue(classificationTotalData.stock_in_qty) ?
          Number(classificationTotalData.stock_in_qty).toFixed(2) : classificationTotalData.stock_in_qty;
      // 将每个小组中的总计（总完成率、总进货量和总出货量）赋值给每个大组的总计明细
      groupTotalData.total_purchase_qty += Number(classification[i][0].purchase_qty);
      groupTotalData.total_stock_in_qty += Number(classification[i][0].stock_in_qty);
      // 将每个组的百分比数显示成%
      classification[i].forEach((item, index) => {
        if (index > 0) {
          item.complete_rate = item.complete_rate + '%';
        }
      });
      // 标记数据已经被处理
      groupTotalData.isCalculated = true;
      // 保存处理数据的结果
      handelData.data = [...handelData.data, ...classification[i]];
      console.log(
        handelData.data
      );

    }));
  }

  judgeValue(num): boolean {
    const resArray = num?.toString()?.split('.');
    const resa = resArray[1]?.toString()?.split('')?.length;
    return resa > 2;
  }

  /**
 * 统计总明细
 * @param groupTotalData
 */
  setPosumTotalData(groupTotalData, handelData): void {
    let completeRateAverage = 0;
    if (groupTotalData.total_purchase_qty) {
      completeRateAverage = (groupTotalData.total_stock_in_qty / groupTotalData.total_purchase_qty) * 100;
    }
    const complete_rate_number =
      String(completeRateAverage).length > 4
        ? completeRateAverage.toFixed(2) : completeRateAverage;
    handelData.data.push({
      reference_type_no: '',
      reference_doc_no: '',
      item_name_spec: '',
      item_spec: '',
      item_classification: this.translateService.instant('dj-pcc-汇总明细'),
      complete_rate: complete_rate_number + '%',
      purchase_qty: groupTotalData.total_purchase_qty,
      stock_in_qty: groupTotalData.total_stock_in_qty,
    });
  }


}
