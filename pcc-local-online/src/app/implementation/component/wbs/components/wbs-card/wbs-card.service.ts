import {
  ComponentRef,
  EmbeddedViewRef,
  Injectable,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class WbsCardService {
  cardOperationSpace: any = {
    editBtnLoading: false,
    addBtnLoading: false,
    removeBtnLoading: false,
  };
  cacheMap = new Map();
  constructor(private translateService: TranslateService) {}
  // 返回【任务类型名称：任务类型】
  getTaskCategoryInfo(item, onlyShowTaskType = false) {
    let info = '';
    if (item.task_category === 'ORD') {
      info = !onlyShowTaskType
        ? this.translatePccWord('一般') + '：' + this.translatePccWord('手动任务')
        : this.translatePccWord('手动任务');
    } else {
      // const category = this.wbsService.TaskType[item.task_category];
      // info = !onlyShowTaskType ? item.task_template_name + '：' + category : category;
      info = item.task_template_name;
    }
    return info;
  }
  translatePccWord(val: string, op = {}): string {
    return this.translateService.instant(`dj-pcc-${val}`, op);
  }

  cacheProperties(key, properties) {
    this.cacheMap.set(key, properties);
  }
  getCacheProperties(key) {
    return this.cacheMap.get(key);
  }
}
