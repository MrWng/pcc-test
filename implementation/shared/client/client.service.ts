import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private clientId: string;
  constructor() {}

  generateClientId(): void {
    this.clientId = UUID.UUID().replace(/-/g, '').toLocaleUpperCase();
    // console.log(this.clientId);
  }

  getClientId(): string {
    return this.clientId;
  }
}
