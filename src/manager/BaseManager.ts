import { Client } from '../Client';
export class BaseManager {
  private _client: Client;

  constructor(client: Client) {
    Object.defineProperty(this, '_client', {
      enumerable: false,
      writable: false,
      value: client
    });
  }

  get client() {
    return this._client;
  }
}

export interface FetchOptions extends FetchManyOptions {
  force?: boolean;
}

export interface FetchManyOptions {
  cache?: boolean;
}
