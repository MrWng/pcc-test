import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.less']
})
export class ErrorMessageComponent implements OnInit {
  @Input() messageInfo = []
  constructor() { }

  ngOnInit(): void {
  }
}
