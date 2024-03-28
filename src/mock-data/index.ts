const i18ntw = require('../assets/i18n/zh_TW/basic.json');
const i18ncn = require('../assets/i18n/zh_CN/basic.json');
const i18nen = require('../assets/i18n/en_US/basic.json');

// import { demo1DocumentOrder } from './showcase/demo1/document-order/document-order';


export const mockDB = {};

mockDB['assets/i18n/zh_TW/basic'] = i18ntw;
mockDB['assets/i18n/zh_CN/basic'] = i18ncn;
mockDB['assets/i18n/en_US/basic'] = i18nen;

// mockDB['DEMO_DAP_CURRENT/DemoOrder/List'] = demo1DocumentOrder.data;
// mockDB['DEMO_DAP_CURRENT/DemoOrder'] = demo1DocumentOrder.data;


export const requestMethodImpl = {};
// requestMethodImpl['DEMO_DAP_CURRENT/DemoOrder/List'] = {
//   get: demo1DocumentOrder.getList,
//   post: demo1DocumentOrder.postMethod,
//   delete: demo1DocumentOrder.deleteMethod,
//   put: demo1DocumentOrder.putMethod
// };
// requestMethodImpl['DEMO_DAP_CURRENT/DemoOrder'] = {
//   get: demo1DocumentOrder.getMethod,
//   post: demo1DocumentOrder.postMethod,
//   delete: demo1DocumentOrder.deleteMethod,
//   put: demo1DocumentOrder.putMethod
// };
