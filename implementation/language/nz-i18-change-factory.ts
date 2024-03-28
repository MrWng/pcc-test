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
} from '@ng-dynamic-forms/core';
import { PluginLangLoaderService } from './plugin-lang-loader.service';

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

export function loadAllPluginI18nJsonFactory(
  pluginLangLoaderService: PluginLangLoaderService,
  pluginLanguageStoreService: PluginLanguageStoreService,
  configProvider: PluginsConfigProvider
): Function {
  const func = (): Promise<any> => {
    const promise = new Observable((observer): void => {
      configProvider.$loaded.subscribe((): void => {
        const obsList: Observable<any>[] = [];
        const config: PluginsConfig = configProvider.config;
        pluginLanguageStoreService.i18nArr.forEach((item): void => {
          const subject: Subject<any> = new Subject<any>();
          obsList.push(subject.asObservable());
          pluginLangLoaderService.getLangJson(config, subject, item);
        });
        forkJoin(obsList).subscribe((res): void => {
          res.forEach((lanJson, index): void => {
            pluginLanguageStoreService.store(pluginLanguageStoreService.i18nArr[index], lanJson);
          });
          observer.next(true);
          observer.complete();
        });
      });
    }).toPromise();
    return promise;
  };
  return func;
}
