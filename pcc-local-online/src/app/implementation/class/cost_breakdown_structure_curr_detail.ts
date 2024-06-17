class PersonClass {
  /**
   * 合并数据
   * @param data 数据对象
   */
  extend(data: any = {}): void {
    Object.entries(data).forEach((o): void => {
      this[o[0]] = data[o[0]];
    });
  }
}
export class CostBreakdownStructureCurrModel extends PersonClass {
  /** 成本分解结构编号 */
  cost_breakdown_structure_no: string = '0';
  /** 序号 */
  seq: number = 0;
  /** 支出分类编号 */
  expenditure_classification_no: string = '';
  /** 成本项编号 */
  cost_item_no: string = '';
  /** 成本项性质 1.项目材料 2.直接费用 */
  cost_item_nature: string = '';
  /** 备注 */
  remark: string = '';
  /** 状态 */
  manage_status: string = 'Y';
  constructor(initData?: any) {
    super();
    this.extend(initData);
  }
}
