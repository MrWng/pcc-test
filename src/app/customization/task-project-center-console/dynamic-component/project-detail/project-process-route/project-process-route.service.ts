import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DwUserService } from '@webdpt/framework/user';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { Observable } from 'rxjs';
import { CommonService } from 'app/customization/task-project-center-console/service/common.service';

@Injectable()
export class ProjectProcessRouteService {
  smartDataUrl: string;
  taskEngineUrl: string;

  constructor(
    private http: HttpClient,
    private userService: DwUserService,
    private configService: DwSystemConfigService,
    public commonService: CommonService,
  ) {
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
    this.configService.get('taskEngineUrl').subscribe((url) => {
      this.taskEngineUrl = url;
    });
  }

  /**
   * 回收卡片
   * @param project_set_no 项目集编号
   * @returns
   */
  recoveryCard(project_set_no: string): Observable<any> {
    const params = {
      serviceComposerId: 'ProjectCenterConsole_closeProjectSet',
      eocMap: {},
      asyncComplete: false,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectSetInfo: [{ project_set_no }]
      }
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }
}


