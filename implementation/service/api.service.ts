import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';
import { ProjectCostBreakdownStructureService } from './project-cost-breakdown-structure.service';

@Injectable({
  providedIn: 'root',
})
export class APIService {
  constructor(
    protected commonService: CommonService,
    protected httpService: ProjectCostBreakdownStructureService
  ) { }

  /** task.info.get 取得任务信息 */
  task_Info_Get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('task.info.get', {
          project_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.project_info);
        });
    });
  }
  /** uc.task.info.get 取得任务信息--乾冶 */
  uc_task_Info_Get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('uc.task.info.get', {
          project_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.project_info);
        });
    });
  }
  /** project.doc.info.process 取得项目单据资料 */
  project_Doc_Data_Get(params: any, eocMap: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData(
          'project.doc.info.process',
          {
            doc_info: params,
          },
          eocMap
        )
        .subscribe((res): void => {
          resolve(res.data.doc_info);
        });
    });
  }

  /** project.task.complete.rate.data.get 取得项目单据资料 */
  project_Task_complete_rate_data_Get(params: any, eocMap: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData(
          'project.task.complete.rate.data.get',
          {
            doc_info: params,
          },
          eocMap
        )
        .subscribe((res): void => {
          resolve(res.data.doc_info);
        });
    });
  }

  /** work.item.data.get 取得工作项资料 */
  work_Item_Data_Get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('work.item.data.get', {
          doc_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.doc_info);
        });
    });
  }
  /** project.wo.production.info.process 取得工作项资料 */
  project_Wo_Production_Info_Process(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData('project.wo.production.info.process', {
          doc_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.doc_info);
        });
    });
  }

  /** review 取得工作项资料 */
  project_Review_Data_Get(params: any, eocMap: any, urlType: any): Promise<any> {
    const param = { doc_info: params };
    return new Promise((resolve, reject): void => {
      this.commonService.getInvData(urlType, param, eocMap).subscribe((res): void => {
        const data = res.data.doc_info ? res.data.doc_info : res.data.project_instant_cost_info;
        resolve(data);
      });
    });
  }

  /** project.cost.breakdown.structure.info.process */
  project_Cost_Breakdown_Structure_Info_Process(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.httpService
        .getInvData('project.cost.breakdown.structure.info.process', {
          cost_breakdown_structure_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data);
        });
    });
  }
  /** project.cost.breakdown.structure.info.get */
  project_Cost_Breakdown_Structure_Info_Get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.httpService
        .getInvData('project.cost.breakdown.structure.info.get', {
          cost_breakdown_structure_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.cost_breakdown_structure_info);
        });
    });
  }
  /** project.type.info.get */
  project_Type_Info_Get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.httpService
        .getInvData('project.type.info.get', {
          project_type_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.project_type_info);
        });
    });
  }
  /** project.expenditure.classification.info.get */
  project_Expenditure_Classification_Info_Get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.httpService
        .getInvData('project.expenditure.classification.info.get', {
          expenditure_classification_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.expenditure_classification_info);
        });
    });
  }
  /** project.cost.item.info.get */
  project_Cost_Item_Info_Get(params: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.httpService
        .getInvData('project.cost.item.info.get', {
          cost_item_info: params,
        })
        .subscribe((res): void => {
          resolve(res.data.cost_item_info);
        });
    });
  }

  progress_data_get(params: any, site_no: string, eocMap: any): Promise<any> {
    return new Promise((resolve, reject): void => {
      this.commonService
        .getInvData(
          'current.project.wo.op.progress.data.get',
          {
            wo_op_data: params,
            site_no: site_no,

          },
          eocMap
        ).subscribe((res): void => {
          resolve(res.data?.wo_op_data);
        });
    });
  }


  /**
   * 获取项目卡最新的签核和交付物字段
   * @param project_type_no  项目编号
   * @returns is_approve：是否需要签核  is_attachment：是否需要交付物
   */
  getApproveAndAttachment(project_type_no: string): Promise<any> {
    const params = { project_type_info: [{ project_type_no }] };
    return new Promise((resolve): void => {
      this.commonService.getInvData('bm.pisc.project.type.get', params)
        .subscribe((res: any): void => {
          const { is_approve, is_attachment } = res.data.project_type_info[0] ?? {};
          resolve({ is_approve, is_attachment });
        });
    });
  }

}
