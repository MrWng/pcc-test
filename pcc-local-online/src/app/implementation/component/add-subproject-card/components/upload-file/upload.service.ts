import { HttpClient } from '@angular/common/http';
import { ComponentRef, Injectable } from '@angular/core';
import { DwSystemConfigService } from '@webdpt/framework/config';
import { Observable } from 'rxjs';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
// import { UploadImageViewerComponent } from './upload-image-viewer/upload-image-viewer.component';
import { ComponentPortal } from '@angular/cdk/portal';
import { UploadImageViewerComponent } from '@athena/dynamic-ui';

@Injectable()
export class MyUploadService {
  public aamUrl: string;
  constructor(
    private http: HttpClient,
    private configService: DwSystemConfigService,
    private overlay: Overlay
  ) {
    this.configService.get('aamUrl').subscribe((url): void => {
      this.aamUrl = url;
    });
  }

  public submitInfoToAi(url: string, params: any): Observable<any> {
    return this.http.post(this.aamUrl + url, params);
  }

  public checkFileIsImage(name: string): boolean {
    return /\.(png|jpg|gif|jpeg|webp|svg|ico|PNG|JPG|GIF|JPEG|WEBP|SVG|ICO)$/.test(name);
  }

  public showImageViewer(imageList: any[], index: number): void {
    const config = new OverlayConfig();
    config.height = '100%';
    config.width = '100%';
    config.positionStrategy = this.overlay.position().global();
    config.hasBackdrop = false;
    const overlayRef = this.overlay.create(config);
    const componentRef: ComponentRef<UploadImageViewerComponent> = overlayRef.attach(
      new ComponentPortal(UploadImageViewerComponent)
    );
    componentRef.instance.imageList = imageList;
    componentRef.instance.imageIndex = index;
    componentRef.instance.closeEvent.subscribe((): void => {
      overlayRef.dispose();
    });
  }
}
