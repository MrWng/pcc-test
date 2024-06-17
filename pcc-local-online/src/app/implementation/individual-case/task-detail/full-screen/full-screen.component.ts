import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';
import { TaskDetailService } from '../task-detail.service';

@Component({
  selector: 'app-full-screen',
  templateUrl: './full-screen.component.html',
  styleUrls: ['./full-screen.component.less'],
})
export class FullScreenComponent implements OnInit {
  @Input() fullScreenDom: HTMLElement;
  constructor(
    public taskDetailService: TaskDetailService,
    private changeRef: ChangeDetectorRef,
    private renderer: Renderer2
  ) {}
  get isFullScreen() {
    return this.taskDetailService.isFullScreen;
  }
  set isFullScreen(val) {
    this.taskDetailService.isFullScreen = val;
  }
  icon = 'iconapp_quanping';
  ngOnInit() {
    this.renderer.listen(this.fullScreenDom, 'fullscreenchange', (e) => {
      if (document.fullscreenElement === this.fullScreenDom) {
        this.isFullScreen = true;
      } else {
        this.isFullScreen = false;
      }
      this.changeRef.markForCheck();
    });
    this.renderer.listen(this.fullScreenDom, 'fullscreenerror', (e) => {
      this.isFullScreen = false;
      this.changeRef.markForCheck();
    });
  }
  async toggleFullScreen() {
    try {
      if (!this.fullScreenDom) {
        return;
      }
      if (document.fullscreenElement === this.fullScreenDom) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          this.isFullScreen = false;
        } else if (document['mozCancelFullScreen']) {
          await document['mozCancelFullScreen']();
          this.isFullScreen = false;
        } else if (document['webkitCancelFullScreen']) {
          await document['webkitCancelFullScreen']();
          this.isFullScreen = false;
        } else if (document['msExitFullscreen']) {
          await document['msExitFullscreen']();
          this.isFullScreen = false;
        }
      } else {
        if (this.fullScreenDom.requestFullscreen) {
          await this.fullScreenDom.requestFullscreen();
          this.isFullScreen = true;
        } /* FireFox */ else if (this.fullScreenDom['mozRequestFullScreen']) {
          await this.fullScreenDom['mozRequestFullScreen']();
          this.isFullScreen = true;
        } /* Chrome等 */ else if (this.fullScreenDom['webkitRequestFullScreen']) {
          await this.fullScreenDom['webkitRequestFullScreen']();
          this.isFullScreen = true;
        } /* IE11 */ else if (this.fullScreenDom['msRequestFullscreen']) {
          await this.fullScreenDom['msRequestFullscreen']();
          this.isFullScreen = true;
        }
      }
      this.changeRef.markForCheck();
    } catch (error) {
      console.log(error);
    }
  }
}
