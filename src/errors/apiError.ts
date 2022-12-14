import { APIError } from 'guilded-api-typings';
import { IncomingHttpHeaders } from 'node:http';

export class GuildedApiError extends Error {
  /**
   * Emit errors
   * @param {any | APIError} name
   */

  constructor(err: APIError | any) {
    const errJSON = JSON.parse(err);
    const msg = !errJSON
      ? `"${err}"`
      : (errJSON.code ? errJSON.code + ': ' : '') +
        errJSON.message +
        (errJSON.meta
          ? ' - ' + errJSON.meta[Object.keys(errJSON.meta)[0]][0]
          : '');
    super(msg);
    /** 
      err.code === "ENOTFOUND"
        ? "You don't have access to the Guilded api.\n\nThis may due to the hosting server\n"
        : msg
        */
  }
}

Object.defineProperty(GuildedApiError.prototype, 'name', {
  value: 'GuildedApiError'
});

export type debugError = {
  hostname: string;
  path: string;
  complete: boolean;
  header: IncomingHttpHeaders;
  body: any;
  response: any;
  status: {
    code: number;
    message: string;
  };
  error: Error;
  httpVersion: string;
  method: string;
};
