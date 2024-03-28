import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { DwAuthService } from '@webdpt/framework/auth';
import { DwLanguageListService, DwLanguageService } from '@webdpt/framework/language';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DwTenantService, DwUserService } from '@webdpt/framework/user';
import { Subject, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { en_US, NzI18nInterface, NzI18nService, zh_CN, zh_TW } from 'ng-zorro-antd/i18n';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ClientService } from 'app/implementation/shared/client/client.service';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.less'],
})
export class MenuBarComponent implements OnInit, OnDestroy {
  @Output() clickEvent = new EventEmitter();

  currentTenant: string;
  currentTenantId: string;
  currTenantList = []; // 租户清单
  tenantShow: boolean = true;
  currentUser = {
    name: '',
    id: '',
  };

  defaultLanguage: string;
  defaultLanguageLabel: string;
  languageList: Array<any> = [];
  private subscription: Subscription = new Subscription();
  destroy$ = new Subject();
  metadata: any[];

  constructor(
    private notificationService: NzNotificationService,
    private router: Router,
    private dwTenantService: DwTenantService,
    private userService: DwUserService,
    private loginService: DwAuthService,
    private i18n: NzI18nService,
    private languageService: DwLanguageService,
    private languageListService: DwLanguageListService,
    private configService: DwSystemConfigService,
    private clientService: ClientService,
    public changeRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initLanguage();
    this.currentTenantId = this.userService.getUser('tenantSid');
    this.tenantShow = this.currentTenantId && this.currentTenantId !== '0';
    this.currentTenant = this.userService.getUser('tenantName');
    this.currentUser.name = this.userService.getUser('userName');
    this.currentUser.id = this.userService.getUser('userId');
    this.initTenant();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.loginService.logout();
    localStorage.clear();
    sessionStorage.removeItem('backRouter');
    sessionStorage.removeItem('saveCurrentTag');
    sessionStorage.removeItem('taskNameList');
  }

  /**
   * 有操作權限的租戶清單-選擇一個進行切換租戶刷新token.
   *
   * param {number} tenantSid: 租戶的 Sid.
   */
  changeTenant(tenantSid: number): void {
    this.subscription.add(
      this.dwTenantService.tokenRefreshTenant(tenantSid).subscribe(
        () => {
          // console.log(this.userService.getUser('acceptLanguage'));
          this.currentTenant = this.userService.getUser('tenantName');
          this.clientService.generateClientId();
          sessionStorage.removeItem('taskNameList');
          window.location.reload();
        },
        (error: any) => {
          this.unsubscribe();
          this.loginService.logout();
        }
      )
    );
  }

  /**
   * 初始化租户清单
   *
   * @author xuchen
   */
  initTenant(): void {
    this.dwTenantService.currTenantList$.subscribe((lists) => {
      this.currTenantList = lists;
    });
  }

  /**
   * 初始化语言设置
   */
  private initLanguage(): void {
    this.defaultLanguage =
      this.userService.getUser('acceptLanguage') || this.languageService.currentLanguage;
    this.languageListService.getLanguagesList().subscribe((data) => {
      this.languageList = data;
      this.defaultLanguageLabel = this.languageList.find(
        (d) => d.value === this.defaultLanguage
      ).label;
    });
    this.i18n.setLocale(this.switchLanguage(this.defaultLanguage));
    this.languageService.setUp(this.defaultLanguage);
  }

  switchLanguage(type: string): NzI18nInterface {
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

  /**
   * 在開啟多頁簽模式下, 沒有觸發 OnDestroy, 所以在選擇完租戶後, 手動 unsubscribe(),
   * 因為選擇完租戶後, 如果正常,會進行導頁, 如果不正常,會進行登出並導向 login 頁.
   */
  private unsubscribe(): void {
    this.subscription.unsubscribe();
  }

  userSetting(): void {
    // console.log(this.router.url);
    sessionStorage.setItem('backRouter', this.router.url);
    this.router.navigate(['../user-set']);
  }

  goHome(): void {
    this.router.navigate(['/']);
    const saveCurrentTag = '0';
    sessionStorage.setItem('saveCurrentTag', saveCurrentTag);
    this.clickEvent.emit(saveCurrentTag);
  }
}
