import { style } from '@angular/animations';
import base64Map from './base64-map';
// eslint-disable-next-line no-shadow
export enum CardStatusCode {
  SUCCESS = 1,
  WARNING = 2,
  TASK = 3,
  ERROR = -1,
  PRIMARY = 4,
}
// eslint-disable-next-line no-shadow
export enum cardExecutionStatusCode {
  NOSTART = 10,
  ONGOING = 20,
  DONE = 30,
  DESIGNATEDCOMPLETION = 40,
  TIMEOUT = 50,
  SIGNOFF = 60,
  LATE = -1, // 逾期
}
// eslint-disable-next-line no-shadow
export enum cardStatusId {
  SIGNED_OFF = 1, // 已签核
  SIGN_OFF_REQUIRED = 2, // 需签核
  SIGN_OFF = 3, // 签核中
  DELIVERABLES_ARE_ALREADY_AVAILABLE = 4, // 已有交付物
  DELIVERABLES = 5, // 需交付物
  DELIVERED = 6, // 已下发
  NOT_DELIVERED = 7, // 未下发
  CHANGED = 8, // 已变更
  SYNERGIZING = 9, // 协同中
  MILESTONE = 10, // 里程碑
  N_DAYS_OVERDUE = 11, // 逾期n天,
  NEW_ADD = 12, // 新增
}
export const cardExecutionStatus = {
  [cardExecutionStatusCode.NOSTART]: 'no-start', // 未开始
  [cardExecutionStatusCode.ONGOING]: 'ongoing', // 进行中
  [cardExecutionStatusCode.DONE]: 'done', // 已完成
  [cardExecutionStatusCode.DESIGNATEDCOMPLETION]: 'designated-completion', // 指定完成
  [cardExecutionStatusCode.TIMEOUT]: 'time-out', // 暂停
  [cardExecutionStatusCode.SIGNOFF]: 'sign-off', // 签核中
  [cardExecutionStatusCode.LATE]: 'late', // 逾期
};

const successCardStatus = {
    status: CardStatusCode.SUCCESS,
    style: {
      'background-color': 'rgba(34, 163, 86, 0.1)',
      color: '#22a356',
    },
  },
  warningCardStatus = {
    status: CardStatusCode.WARNING,
    style: {
      'background-color': 'rgba(245,139,0,0.10)',
      color: '#f58b00',
    },
  },
  taskCardStatus = {
    status: CardStatusCode.TASK,
    style: {
      color: '#6167cc',
      'background-color': 'rgba(97, 103, 204, 0.1)',
    },
  },
  errorCardStatus = {
    status: CardStatusCode.ERROR,
    style: {
      color: '#ea435d',
      'background-color': 'rgba(234,67,93,0.10)',
    },
  },
  primaryCardStatus = {
    status: CardStatusCode.PRIMARY,
    style: {
      color: '#266AE5',
      'background-color': 'rgba(38,106,229,0.10)',
    },
  };
const cardStatus = [
  successCardStatus,
  warningCardStatus,
  taskCardStatus,
  errorCardStatus,
  primaryCardStatus,
];
const initCardStatus = () => {
  const status = new Map();
  cardStatus.forEach((s) => {
    status.set(s.status, s);
  });
  return status;
};
export const cardStatusMap = initCardStatus();
const assign = Object.assign;
const commonCardStatus = {
  text: '',
  hidden: false,
  statusCode: 0,
  tooltipVisible: false,
  icon: '',
};
export const setCardStatus = (text, statusCode, hidden = false) => {
  return assign({}, commonCardStatus, {
    text,
    hidden,
    statusCode,
    icon: base64Map[statusCode - 1],
  });
};
export const successStatusGen = (text, hidden = false) =>
  assign({}, cardStatusMap.get(CardStatusCode.SUCCESS), {
    text,
    hidden,
  });
export const warningStatusGen = (text, hidden = false) =>
  assign({}, cardStatusMap.get(CardStatusCode.WARNING), {
    text,
    hidden,
  });
export const taskStatusGen = (text, hidden = false) =>
  assign({}, cardStatusMap.get(CardStatusCode.TASK), {
    text,
    hidden,
  });
export const errorStatusGen = (text, hidden = false) =>
  assign({}, cardStatusMap.get(CardStatusCode.ERROR), {
    text,
    hidden,
  });
export const primaryStatusGen = (text, hidden = false) =>
  assign({}, cardStatusMap.get(CardStatusCode.PRIMARY), {
    text,
    hidden,
  });
