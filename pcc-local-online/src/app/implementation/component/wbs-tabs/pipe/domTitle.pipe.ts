import { Input, Pipe, PipeTransform } from '@angular/core';
import { isEmpty } from '@athena/design-ui';

@Pipe({ name: 'domTitle' })
export class DomTitlePipe implements PipeTransform {
  transform(value: string): any {
    return value === ' ' || isEmpty(value) ? '' : value;
  }
}
