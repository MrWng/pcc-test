import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-svg-file',
  templateUrl: './svg-file.component.html',
  styleUrls: ['./svg-file.component.less'],
})
export class SvgFileComponent implements OnInit {
  @Input() type: string;

  constructor(protected changeRef: ChangeDetectorRef) {}

  ngOnInit(): void {}
}
