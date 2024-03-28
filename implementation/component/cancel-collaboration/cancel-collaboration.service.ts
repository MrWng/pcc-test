import { Inject, Injectable } from '@angular/core';
import { DynamicWbsService } from '../wbs/wbs.service';
import { CommonService } from '../../service/common.service';
import { Observable } from 'rxjs';
import { DW_AUTH_TOKEN, DwSystemConfigService, DwUserService } from '@webdpt/framework';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable()
export class CancelCollaborationService {
  smartDataUrl: string;
  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private http: HttpClient,
    public wbsService: DynamicWbsService,
    public commonService: CommonService,
    private userService: DwUserService,
    private configService: DwSystemConfigService
  ) {
    this.configService.get('smartDataUrl').subscribe((url: string) => {
      this.smartDataUrl = url;
    });
  }
  // 清理协同卡
  clearCollaborationCard(
    project_no: string,
    task_no: string,
    asyncComplete: boolean = true
  ): Observable<any> {
    const params = {
      serviceComposerId: 'pcc_closeTeamWork',
      eocMap: {},
      asyncComplete,
      tenantId: this.userService.getUser('tenantId'),
      params: {
        projectArr: [{ project_no: project_no, task_no: task_no }],
        type: 'canelAssist',
      },
    };
    const url = `${this.smartDataUrl}/scdispatcher/execution/dispatch`;
    return this.http.post(url, params, {
      headers: { invokerId: 'ExecutionEngine' },
    });
  }
  async hasTaskCard(info: any = {}): Promise<any> {
    const assist_schedule_seq = await this.commonService
      .getInvData('bm.pisc.assist.schedule.get', {
        assist_schedule_info: [
          {
            project_no: info.project_no,
            task_no: info.task_no,
            schedule_status: '1',
          },
        ],
      })
      .pipe(
        map((result: any) => {
          const data = result?.data?.assist_schedule_info?.[0] || {};
          return data.assist_schedule_seq;
        })
      )
      .toPromise();
    const params = {
      eocId: {},
      tenantId: this.userService.getUser('tenantId'),
      bkInfo: [
        {
          entityName: 'task_d_xt',
          bk: {
            project_no: info.project_no,
            task_no: info.task_no,
            teamwork_plan_seq: assist_schedule_seq,
          },
        },
      ],
      taskStates: [1, 2, 3, 4, 5],
      activityStates: [1, 2, 3, 4, 5, 6],
    };

    return this.wbsService
      .queryProjectId(params)
      .pipe(
        map((res) => {
          const subTasks =
            res.data[0]?.subTasks?.filter(
              (sub) =>
                sub.tmpId === 'projectCenterConsole_CoordinationPlanArrange_userProject' &&
                sub.state === 1
            ) || [];
          const temp = [];
          subTasks.forEach((s) => {
            s.activities?.forEach((t) => {
              if (t.actTmpId === 'completeCoordinationPlanArrange_DTD' && t.state === 1) {
                temp.push(t);
              }
            });
          });
          return !!temp.length;
        })
      )
      .toPromise();
  }
}
