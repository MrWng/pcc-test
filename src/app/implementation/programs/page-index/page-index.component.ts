import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { programs, IProgramInfo} from 'app/config/custom-app-config';

@Component({
  selector: 'app-page-index',
  templateUrl: './page-index.component.html',
  styleUrls: ['./page-index.component.less']
})
export class PageIndexComponent implements OnInit {
  public objectKeys = Object.keys
  public programs: IProgramInfo = programs
  selectedValue: string = '';
  constructor(private router: Router) { }

  ngOnInit(): void { }

  onSelected(value) {
    if (value) {
      this.router.navigate(['/dev/xxx'], {
        queryParams: {
          programName: value
        }
      });
    }
  }
}
