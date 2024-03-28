import { Injectable } from '@angular/core';
import { forkJoin, Observable, Subject } from 'rxjs';
import { retry } from 'rxjs/operators';
import {
  CustomHttpService,
  isNotEmpty,
  PluginLanguageStoreService,
  PluginsConfig,
  PluginsConfigProvider,
  timerFun,
} from '@ng-dynamic-forms/core';
import assign from 'lodash/assign';

import { globalI18n } from '../../config/i18n';

@Injectable()
export class PluginLangLoaderService {
  constructor(
    private http: CustomHttpService,
    private configProvider: PluginsConfigProvider,
    private storeService: PluginLanguageStoreService
  ) {}

  /**
   * 畫面翻譯檔載入器,不限已登入
   * @param lang 語系
   * @param [programId] 作業編號
   * @returns translation 畫面翻譯檔
   */
  getTranslation(lang: string, programId?: string): Observable<any> {
    const subject: Subject<any> = new Subject<any>();
    if (isNotEmpty(this.configProvider.config)) {
      const config: PluginsConfig = this.configProvider.config;
      if (isNotEmpty(this.storeService.storage[lang])) {
        timerFun(0, (): void => {
          subject.next(this.storeService.storage[lang]);
        });
      } else {
        this.getLangJson(config, subject, lang);
      }
    } else {
      this.configProvider.$loaded.subscribe((): void => {
        const config: PluginsConfig = this.configProvider.config;
        if (isNotEmpty(this.storeService.storage[lang])) {
          subject.next(this.storeService.storage[lang]);
        } else {
          this.getLangJson(config, subject, lang);
        }
      });
    }
    return subject.asObservable();
  }

  getLangJson(config: PluginsConfig, subject: Subject<any>, lang: string): void {
    const allLanRequestList: Observable<any>[] = [];

    Object.values(config).forEach((item): void => {
      if (!item.i18n) {
        return;
      }
      const url = `${item.root}/i18n/${lang}/default.json?t=` + new Date().getTime();
      const languageLoaderObs = this.http.get(url).pipe(retry(3));
      allLanRequestList.push(languageLoaderObs);
    });

    const subscription = forkJoin(allLanRequestList).subscribe(
      (langDataList: object[]): void => {
        const lanJson = assign(...langDataList, globalI18n[lang]);
        subject.next(lanJson);
        subject.complete();
        subscription.unsubscribe();
      },
      (error): void => {
        console.error(error);
      }
    );
  }
}
