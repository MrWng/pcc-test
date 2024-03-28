import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { DmcRepositoryService } from '@athena/dynamic-ui';
import { DwDmcRepository, DwUploadFileService } from '@webdpt/framework/dmc';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { DwUserService } from '@webdpt/framework/user';
import { DW_AUTH_TOKEN } from '@webdpt/framework/auth';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
const SLICESECTION: number = 255 * 1024 * 10; // 2.55M

@Injectable({
  providedIn: 'root',
})
export class UploadAndDownloadService {
  public dmcRootDirId: string = '00000000-0000-0000-0000-000000000000';
  public aamUrl: string;
  public dmcUrl: string;
  public dmcUrl2: string;

  constructor(
    @Inject(DW_AUTH_TOKEN) protected authToken: any,
    private dwDmcRepository: DwDmcRepository,
    private dmcRepository: DmcRepositoryService,
    private userService: DwUserService,
    private http: HttpClient,
    private translateService: TranslateService,
    private configService: DwSystemConfigService
  ) {
    this.configService.get('aamUrl').subscribe((url) => {
      this.aamUrl = url;
    });
    this.configService.get('dmcUrl').subscribe((url) => {
      this.dmcUrl = url + '/api/dmc/v1/';
    });
    this.configService.get('dmcUrl').subscribe((url) => {
      this.dmcUrl2 = url + '/api/dmc/v2/';
    });
  }
  /**
   * 上传文件
   * @param {File} file [ File对象 ]
   * @param {string} bucket [ bucket ]
   * @param {string} dirId [ 目录id]
   * @param {}
   * @returns
   */
  public upload(file: File, bucket: string, dirId?: string): Observable<any> {
    dirId = dirId ? dirId : this.dmcRootDirId;
    return new Observable((observer) => {
      if (typeof file !== 'object' || !bucket || !dirId) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-pcc-参数传递有误或者不能为空!')
        );
        return;
      }
      if (file.size <= SLICESECTION) {
        // 读取并上传整个文件
        this.pushFileMessage(observer, 'ongoing', 0);
        this.entireUpload(file, bucket, dirId, observer);
      } else {
        this.pushFileMessage(observer, 'ongoing', 0);
        this.newEmptyFile(file, bucket, dirId)
          .then((data) => {
            console.log('data: ', data);
            this.pushFileMessage(observer, 'ongoing', 5);
            const reader = new FileReader();
            this.sliceUpload(file, reader, bucket, dirId, data['id'], 0, SLICESECTION, observer);
          })
          .catch((data) => {
            this.pushFileMessage(observer, 'error', data);
          });
      }
    });
  }

  /**
   * 覆盖上传
   * @param {File} file [ File ]
   * @param {string} bucket [ bucket]
   * @param {string} dirId  [ 目录id ]
   * @param {string} fileId [ 文件id ]
   */
  public coverUpload(file: File, bucket: string, dirId: string, fileId: string): Observable<any> {
    return new Observable((observer) => {
      if (typeof file !== 'object' || !bucket || !dirId || !fileId) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-pcc-参数传递有误或者不能为空!')
        );
        return;
      }
      this.pushFileMessage(observer, 'ongoing', 0);
      if (file.size <= SLICESECTION) {
        this.entireCoverUpload(file, bucket, fileId, observer);
      } else {
        const reader = new FileReader();
        this.sliceUpload(file, reader, bucket, dirId, fileId, 0, SLICESECTION, observer, true);
      }
    });
  }

  /**
   * 上传并分享
   * @param {File} file
   * @param {string} bucket
   * @param {string} dirId
   */
  public uploadAndShare(file: File, bucket: string, dirId: string): Observable<any> {
    return new Observable((observer) => {
      if (typeof file !== 'object' || !bucket || !dirId) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-pcc-参数传递有误或者不能为空!')
        );
        return;
      }
      this.upload(file, bucket, dirId).subscribe(
        (res) => {
          observer.next(res);
          if (res.status !== 'success') {
            return;
          }
          const info = res;
          this.dwDmcRepository.login().subscribe(
            (r1) => {
              this.dmcRepository
                .dmcShareToAll(bucket, [res.fileId], r1, this.userService.getUser('tenantId'))
                .subscribe(
                  (r2) => {
                    info.shareUrl = r2[0];
                    observer.next(info);
                  },
                  (e2) => {
                    observer.error(e2);
                  }
                );
            },
            (e1) => {
              observer.error(e1);
            }
          );
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  /**
   * 上传整个文件
   * @private
   * @param {File} file [ File ]
   * @param {string} bucket [ buketName ]
   * @param {string} dirId [ 目录Id]
   * @param {*} resolve [ Function ]
   * @param {*} reject [ Function ]
   */
  private entireUpload(file: File, bucket: string, dirId: string, observer: any): void {
    const that = this;
    const reader = new FileReader(); // 阅读器
    reader.onload = (e) => {
      that.dwDmcRepository.login().subscribe(
        (r1) => {
          const fileInfo = {
            // 文件信息
            extension: this.getFileExtension(file.name),
            displayName: file.name,
            totalSize: file.size,
            segmentTotalSize: file.size,
            fileName: file.name,
            directoryId: dirId,
          };
          that.dmcRepository
            .dmcUploadEntireFile(
              fileInfo,
              e.target['result'],
              bucket,
              r1,
              this.userService.getUser('tenantId')
            )
            .subscribe(
              (r2) => {
                this.pushFileMessage(observer, 'success', 100, r2['id']);
              },
              (e2) => {
                this.pushFileMessage(observer, 'error', e2);
              }
            );
        },
        (e1) => {
          this.pushFileMessage(observer, 'error', e1);
        }
      );
    };
    reader.readAsArrayBuffer(file); // 读文件
  }

  /**
   * 整个文件覆盖上传
   * @private
   * @param {File} file
   * @param {string} bucket
   * @param {string} fileId
   * @param {*} observer
   */
  private entireCoverUpload(file: File, bucket: string, fileId: string, observer: any): void {
    const that = this;
    const reader = new FileReader(); // 阅读器
    reader.onload = (e) => {
      that.dwDmcRepository.login().subscribe(
        (r1) => {
          that.dmcRepository
            .dmcCoverUploadEntireFile(
              fileId,
              e.target['result'],
              bucket,
              r1,
              this.userService.getUser('tenantId')
            )
            .subscribe(
              (r2) => {
                this.pushFileMessage(observer, 'success', 100, r2['id']);
              },
              (e2) => {
                this.pushFileMessage(observer, 'error', e2);
              }
            );
        },
        (e1) => {
          this.pushFileMessage(observer, 'error', e1);
        }
      );
    };
    reader.readAsArrayBuffer(file); // 读文件
  }

  /**
   * 创建分段上传的空文件
   * @private
   * @param {File} file [ File ]
   * @param {string} bucket [ bucket ]
   * @param {string} dirId [ 目录Id ]
   * @returns Promise
   */
  private newEmptyFile(file: File, bucket: string, dirId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const fileInfo = {
        extension: this.getFileExtension(file.name),
        displayName: file.name,
        fileName: file.name,
        directoryId: dirId,
      };
      this.dwDmcRepository.login().subscribe(
        (res) => {
          this.dmcRepository
            .dmcCreateEmptyFile(fileInfo, bucket, res, this.userService.getUser('tenantId'))
            .subscribe(
              (res2) => {
                resolve(res2);
              },
              (error) => {
                reject(error);
              }
            );
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * 分段上传
   * @private
   * @param {File} file [ File ]
   * @param {FileReader} reader [ 阅读器 ]
   * @param {*} bucket [ bucket ]
   * @param {*} dirId [ 目录Id ]
   * @param {*} fileId  [ 文件id ]
   * @param {*} reader_start [ 开始上传位置 ]
   * @param {*} reader_end [ 结束上传位置 ]
   * @param {*} resolve [ Function ]
   * @param {*} reject [ Function ]
   */
  private sliceUpload(
    file: File,
    reader: FileReader,
    bucket: string,
    dirId: string,
    fileId: string,
    reader_start: number,
    reader_end: number,
    observer: any,
    cover?: boolean
  ): void {
    const that = this;
    const blob = file.slice(reader_start, reader_end); // 分割file
    cover = cover || false;
    reader.onload = (e) => {
      that.dwDmcRepository.login().subscribe(
        (r1) => {
          that.dmcRepository
            .dmcPieceUploadFile(
              fileId,
              reader_start,
              reader_end - 1,
              file.size,
              e.target['result'] as any,
              bucket,
              r1,
              cover,
              this.userService.getUser('tenantId')
            )
            .subscribe(
              (r2) => {
                if (reader_end === file.size) {
                  this.pushFileMessage(observer, 'success', 100, r2['id']);
                  return;
                }
                that.pushFileMessage(observer, 'ongoing', (100 * reader_end) / file.size);
                const new_reader_start = reader_start + SLICESECTION;

                const new_reader_end =
                  reader_end + SLICESECTION > file.size ? file.size : reader_end + SLICESECTION;
                that.sliceUpload(
                  file,
                  reader,
                  bucket,
                  dirId,
                  fileId,
                  new_reader_start,
                  new_reader_end,
                  observer,
                  cover
                );
              },
              (e2) => {
                that.pushFileMessage(observer, 'error', e2);
              }
            );
        },
        (e1) => {
          that.pushFileMessage(observer, 'error', e1);
        }
      );
    };
    reader.readAsArrayBuffer(blob);
  }

  /**
   * 下载文件 [ 整个下载，适合小文件 ]
   * @param {string} bucket
   * @param {string} fileId
   * @param {string} fileName
   * @returns Promise
   */
  public download(bucket: string, fileId: string, fileName: string): Observable<any> {
    return new Observable((observer) => {
      if (!bucket || !fileId || !fileName) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-default-函数参数不能为空')
        );
        return;
      }
      this.dwDmcRepository.login().subscribe(
        (r1) => {
          this.dmcRepository
            .dmcDownload(bucket, fileId, r1, this.userService.getUser('tenantId'))
            .subscribe(
              (blobFile) => {
                const aLink = window.document.createElement('a');
                const blob = new Blob([blobFile], { type: 'application/octet-stream' });
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
                this.pushFileMessage(observer, 'success', 100);
              },
              (e2) => {
                this.pushFileMessage(observer, 'error', e2);
              }
            );
        },
        (e1) => {
          this.pushFileMessage(observer, 'error', e1);
        }
      );
    });
  }

  /**
   * 批量删除文件
   * @param {string} bucket
   * @param {*} [fileIdArr=[]]
   * @memberof DwFileService
   */
  public deleteFile(bucket: string, fileIdArr: any = []): Observable<any> {
    return new Observable((observer) => {
      if (!bucket || fileIdArr.length === 0) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-default-bucket不能为空或者删除数组不能为空')
        );
        return;
      }
      this.dwDmcRepository.login().subscribe(
        (r1) => {
          this.dmcRepository
            .dmcBatchDelete(bucket, fileIdArr, r1, this.userService.getUser('tenantId'))
            .subscribe(
              (r2) => {
                observer.next(r2);
                observer.complete();
              },
              (e2) => {
                this.pushFileMessage(observer, 'error', e2);
              }
            );
        },
        (e1) => {
          this.pushFileMessage(observer, 'error', e1);
        }
      );
    });
  }

  public createDirectory(bucket: string, name: string): Observable<any> {
    return new Observable((observer) => {
      if (!bucket || !name) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-default-bucket不能为空或者文件夹名称不能为空')
        );
        return;
      }
      this.dwDmcRepository.login().subscribe(
        (r1) => {
          this.dmcRepository
            .dmcCreateDirectorys(
              bucket,
              this.dmcRootDirId,
              name,
              r1,
              this.userService.getUser('tenantId')
            )
            .subscribe(
              (r2) => {
                observer.next(r2);
                observer.complete();
              },
              (e2) => {
                observer.next(e2);
                observer.complete();
              }
            );
        },
        (e1) => {
          observer.next(e1);
          observer.complete();
        }
      );
    });
  }
  public dmcDirectoryList(bucket: string): Observable<any> {
    return new Observable((observer) => {
      if (!bucket) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-default-bucket不能为空或者目录ID不能为空')
        );
        return;
      }
      this.dwDmcRepository.login().subscribe(
        (r1) => {
          this.dmcRepository
            .dmcDirectoryList(bucket, this.dmcRootDirId, r1, this.userService.getUser('tenantId'))
            .subscribe(
              (r2) => {
                observer.next(r2);
                observer.complete();
              },
              (e2) => {
                observer.next(e2);
                observer.complete();
              }
            );
        },
        (e1) => {
          observer.next(e1);
          observer.complete();
        }
      );
    });
  }

  public dmcDirectoryInfo(bucket: string, dirName: string, pDirId?: string): Observable<any> {
    return new Observable((observer) => {
      if (!bucket || !dirName) {
        this.pushFileMessage(
          observer,
          'error',
          this.translateService.instant('dj-default-bucket不能为空或者目录名称不能为空')
        );
        return;
      }
      pDirId = pDirId || this.dmcRootDirId;
      this.dwDmcRepository.login().subscribe(
        (r1) => {
          this.dmcRepository
            .dmcDirectoryInfo(bucket, dirName, pDirId, r1, this.userService.getUser('tenantId'))
            .subscribe(
              (r2) => {
                observer.next(r2);
                observer.complete();
              },
              (e2) => {
                observer.next(e2);
                observer.complete();
              }
            );
        },
        (e1) => {
          observer.next(e1);
          observer.complete();
        }
      );
    });
  }

  /**
   * 获取文件名的后缀
   * @param fileName [ 文件名 ]
   */
  private getFileExtension(fileName: string): string {
    const pos = fileName.lastIndexOf('.');
    return fileName.substring(pos + 1);
  }

  /**
   * 推送文件上传、下载成功、进度等信息
   * @private
   * @param {*} callfun
   * @param {string} status
   * @param {*} data
   */
  private pushFileMessage(callfun: any, status: string, data: any, fileId?: string): void {
    const message: Message = {
      status: status,
      data: data,
    };
    if (fileId) {
      message.fileId = fileId;
    }
    if (status === 'error') {
      callfun.error(message);
    } else {
      callfun.next(message);
    }
  }

  public submitInfoToAi(params: any): Observable<any> {
    const url = `${this.aamUrl}/api/aam/v1/uploadAttachment`;
    return this.http.post(url, params);
  }

  public tableInfoToAi(urls: any, params: any): Observable<any> {
    const url = this.aamUrl + urls;
    return this.http.post(url, params);
  }

  public downloadTemplete(
    bucketName: string,
    fileId: string,
    tenantId: string,
    token: string
  ): Observable<any> {
    const headers = new HttpHeaders({
      'digi-middleware-auth-user': token,
      'Content-Type': 'application/octet-stream',
    });
    if (tenantId) {
      headers.append('tenantId', tenantId);
    }
    const url = this.dmcUrl + `buckets/${bucketName}/files/${fileId}`;
    return this.http.get(url, { responseType: 'blob', headers: headers });
  }

  public getFileUrl(bucketName: string, params): Observable<any> {
    return new Observable((observer) => {
      this.dwDmcRepository.login().subscribe((r1) => {
        this.getFile(bucketName, params, r1).subscribe(
          (res) => {
            observer.next(res);
            observer.complete();
          },
          (error) => {
            observer.next(error);
            observer.complete();
          }
        );
      });
    });
  }

  public getFile(bucketName: string, params, r1) {
    const url = this.dmcUrl + `buckets/${bucketName}/ShareFiles`;
    return this.http.post(url, params, {
      headers: {
        'digi-middleware-auth-user': r1,
        token: this.authToken?.token,
      },
    });
  }

  public downloadMultiUrl(bucketName: string, params, fileName): Observable<any> {
    return new Observable((observer) => {
      this.dwDmcRepository.login().subscribe((r1) => {
        this.downloadMulti(bucketName, params, r1).subscribe((res) => {
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
      });
    });
  }

  public downloadMulti(bucketName: string, params, r1) {
    const url = this.dmcUrl2 + `file/${bucketName}/download/multi`;
    return this.http.post(url, params, {
      responseType: 'blob',
      headers: {
        'digi-middleware-auth-user': r1,
        token: this.authToken?.token,
      },
    });
  }
}

export interface Message {
  status: string; // 'success', 'error', 'ongoing'
  data: any;
  fileId?: string;
  shareUrl?: string;
}
