import { Input, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'exist' })
export class ExistPipe implements PipeTransform {
  transform(value: string, arr: string[] = []): boolean {
    return arr.includes(value);
  }
}
