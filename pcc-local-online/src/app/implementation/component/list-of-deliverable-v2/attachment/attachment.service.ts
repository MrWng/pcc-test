import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { DW_AUTH_TOKEN } from '@webdpt/framework';
import { CommonService } from 'app/implementation/service/common.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  filePreviewPrefixUrl: string = `${this.commonService.dmcUrl}/api/dmc/v2/file/Athena/share/`;

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    public commonService: CommonService,
    private http: HttpClient
  ) {}
  fileFormate(fileList: any[], isPLMFile: boolean = false) {
    fileList.forEach((file) => {
      if (!isPLMFile) {
        file['url'] = this.filePreviewPrefixUrl + file.id;
        file['uid'] = file.id;
        file['status'] = 'done';
        file['lastModified'] = new Date(file.create_date).getTime();
        return;
      }
      file['name'] = file.delivery_name;
      file['status'] = 'done';
      file['uid'] = '222';
      file['id'] = '222';
      file['url'] = this.filePreviewPrefixUrl + file.id;
    });
    return fileList;
  }
  project_task_delivery_enclosure_data_get(params: any): Promise<any> {
    return this.commonService
      .getInvData('project.task.deliverable.attachment.data.get', params)
      .toPromise()
      .then((res) => res?.data?.doc_info[0]);
  }
  // 文档中心，下载方式
  public downloadMulti(params) {
    return this.http.get(params.deliverable_attachment_link, {
      responseType: 'blob',
      headers: {
        'digi-middleware-auth-user': params?.token ?? this.authToken?.token,
      },
    });
  }
  public downloadMultiUrl(params, fileName): Observable<any> {
    return new Observable((observer) => {
      // this.dwDmcRepository.login().subscribe((r1) => {
      this.downloadMulti(params).subscribe((res) => {
        const aLink = window.document.createElement('a');
        const blob = new Blob([res], { type: 'application/octet-stream' });
        const objUrl = window.URL.createObjectURL(blob);
        aLink.href = objUrl;
        aLink.download = fileName;
        aLink.style.visibility = 'hidden';
        document.body.appendChild(aLink);
        const evt = document.createEvent('MouseEvents');
        evt.initEvent('click', false, false);
        aLink.dispatchEvent(evt);
        window.URL.revokeObjectURL(objUrl);
        document.body.removeChild(aLink);
        observer.next(res);
        observer.complete();
      });
      // });
    });
  }
  checkFile(category: string, rowData) {
    return new Promise((resolve) => {
      if (
        category === 'athena_LaunchSpecialProject_create' ||
        category === 'manualAssignmentSampleDelivery'
      ) {
        const check_type = ['1', '2', '4', '5'];
        if ('manualAssignmentSampleDelivery' === category) {
          check_type.push('3');
        }
        this.commonService
          .getProjectChangeStatus(rowData.project_no, check_type, '1', rowData.task_no)
          .subscribe(
            (result: any) => {
              if (result.data?.project_info[0]?.check_result) {
                resolve(true);
              } else {
                // 刷新
                resolve(false);
              }
            },
            (error) => {
              // 刷新
              resolve(false);
            }
          );
      } else {
        resolve(true);
      }
    });
  }
}
