import * as XLSX from 'xlsx';
import _ from 'lodash';

export default class ExportExcelForXLSX {
  static btn_export(columns, tableList, excelName) {
    const tableData = this.transData(columns, tableList);
    // 创建 workbook
    const wb = XLSX.utils.book_new();
    // 将一组 JS 数据数组转换为工作表
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    // todo 设置单元格 目前无效，只用了xlsx插件，设置单元格样式需要额外第三方插件
    this.setCell(ws);
    // 设置列宽
    const colWidth = [];
    columns.forEach(() => {
      colWidth.push({
        wpx: 150,
      });
    });
    ws['!cols'] = colWidth; // 单元格列宽
    // // 设置行高
    // const rawHeight = [];
    // tableData.forEach(()=>{
    //   rawHeight.push({
    //     hpt: 80
    //   })
    // })
    // ws["!rows"] = rawHeight; //单元格列宽

    // 将 工作表 添加到 workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    // 将 workbook 写入文件
    XLSX.writeFile(wb, `${excelName}.xlsx`);
  }

  static setCell(ws) {
    // 找出 这个表格的 单元格 范围
    const range = XLSX.utils.decode_range(ws['!ref']);
    // 表头设置
    for (let c = range.s.c; c <= range.e.c; c++) {
      const header = XLSX.utils.encode_col(c) + '' + '1';
      ws[header].s = {
        // font 字体属性
        font: {
          bold: true,
          sz: 14,
          name: '宋体',
        },
        // alignment 对齐方式
        alignment: {
          vertical: 'center', // 垂直居中
          horizontal: 'center', // 水平居中
          wrapText: true,
        },
        // border 边框属性
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        },
        // fill 颜色填充属性
        fill: {
          fgColor: { rgb: '87CEEB' },
        },
      };
    }
  }

  static transData(columns, tableList) {
    const tableHead = columns.map((item) => item.title);
    const tableBody = tableList.map((item) => {
      return columns.map((column, index) => {
        let value = _.get(item, column.dataIndex);
        if (_.isFunction(column.render)) {
          value = column.render(value, item, index);
        }
        return value;
      });
    });
    return [tableHead, ...tableBody];
  }
}
