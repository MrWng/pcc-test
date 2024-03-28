import { NzI18nInterface } from 'ng-zorro-antd/i18n/nz-i18n.interface';
import { NzI18nService } from 'ng-zorro-antd/i18n/nz-i18n.service';
import { en_US } from 'ng-zorro-antd/i18n';
import { zh_CN } from 'ng-zorro-antd/i18n';
import { zh_TW } from 'ng-zorro-antd/i18n';
import { DwLanguageService } from '@webdpt/framework/language';
import { forkJoin, Observable, Subject } from 'rxjs';
import {
  isEqual,
  PluginLanguageStoreService,
  PluginsConfig,
  PluginsConfigProvider,
} from '@athena/dynamic-core';

export function nzI18nChangeFactory(
  languageService: DwLanguageService,
  nzI18n: NzI18nService
): Function {
  const func = (): Promise<any> => {
    const promise = new Observable((observer): void => {
      languageService.language$.subscribe((language): void => {
        const languageObj = switchLanguage(language);
        if (!isEqual(languageObj, nzI18n.getLocale())) {
          nzI18n.setLocale(languageObj);
        }
      });
      observer.next(true);
      observer.complete();
    }).toPromise();
    return promise;
  };
  return func;
}

function switchLanguage(type: string): NzI18nInterface {
  switch (type) {
  case 'zh_CN':
    return zh_CN;
  case 'zh_TW':
    return zh_TW;
  case 'en_US':
    return en_US;
  default:
    return zh_CN;
  }
}
