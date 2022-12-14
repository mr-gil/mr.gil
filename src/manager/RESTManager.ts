import { APIError } from 'guilded-api-typings';
import EventEmitter from 'events';
import { GuildedApiError } from '../errors/apiError';
import { request } from 'https';
import { Client } from '../Client';
import type TypedEmitter from 'typed-emitter';
import { IncomingMessage } from 'http';

const version = '1.0.0';
export const userAgent = `Mr.Gil (guilded, v${version} | nodejs: ${process.version})`;

let ratelimit = false;
let rateTime = 0;

export class RESTManager extends (EventEmitter as unknown as new () => TypedEmitter<{
  raw: (body: string, data: IncomingMessage) => void;
}>) {
  token?: string;
  readonly version?: number;
  readonly proxyUrl?: string;
  client: Client;

  constructor(public readonly options: RESTOptions) {
    super();
    this.token = options.token;
    this.proxyUrl = options.proxyUrl;
    if (!this.proxyUrl) this.version = options.version;
  }

  get baseUrl() {
    return this.proxyUrl
      ? this.proxyUrl
      : `https://www.guilded.gg/api/v${this.version}`;
  }

  parse(json: string) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return json;
    }
  }

  setSecret(token?: string) {
    this.token = token;
    return this;
  }

  async https<
    R = any,
    B = any,
    P extends Record<string, any> = Record<string, any>
  >(
    path: string,
    method: string,
    options?: APIFetchOptions<B, P>,
    retries = 0
  ): Promise<R> {
    return new Promise(async (resolve, reject) => {
      if (ratelimit)
        return console.log(
          `\nGuildedAPIError: Ratelimited !\n\nGuilded has rate-limited your requests. Try again after ${rateTime}ms.\n`
        );
      const searchParams = new URLSearchParams();
      if (options?.params)
        for (const [key, value] of Object.entries(options.params))
          searchParams.append(key, value.toString());

      const req = request(
        {
          hostname: options?.host || `www.guilded.gg`,
          path: options?.uri || `/api/v${this.version}` + path + searchParams,
          method,
          headers: options?.token
            ? {
                'Content-Type': 'application/json',
                'User-Agent': userAgent
              }
            : {
                'Content-Type': 'application/json',
                'User-Agent': userAgent,
                Authorization: `Bearer ${this.token}`
              }
        },
        async (response) => {
          var body = '';

          if (
            response.statusCode === 429 &&
            retries <= (this.options?.maxRetries ?? 3)
          ) {
            const retryAfter =
              Number(response.headers['retry-after']) ??
              this.options.retryInterval ??
              120000 / 1000;

            rateTime = retryAfter * 1000;
            ratelimit = true;
            await new Promise((resolve) =>
              setTimeout(resolve, retryAfter * 1000)
            );

            ratelimit = false;
            return this.https(path, method, options, retries++);
          }

          response.on('error', (error: APIError) => {
            response.headers['authorization'] = '';
            this.client.emit('debug', {
              hostname: options?.host || `www.guilded.gg`,
              path:
                options?.uri || `/api/v${this.version}` + path + searchParams,
              complete: response.complete,
              header: response.headers,
              body: options?.body,
              response: JSON.parse(body),
              status: {
                code: response.statusCode,
                message: response.statusMessage
              },
              error: response.errored,
              httpVersion: response.httpVersion,
              method: response.method
            });
            response.destroy();
            throw new GuildedApiError(error);
          });

          response.on('data', (chunk) => {
            body = body + chunk;

            if (response.complete) {
              this.emit('raw', body, response);
              return body;
            }
          });

          response.on('end', () => {
            try {
              if (!body) return;
              const json = JSON.parse(body);
              if (json.code) {
                response.headers['authorization'] = '';
                this.client.emit('debug', {
                  hostname: options?.host || `www.guilded.gg`,
                  path:
                    options?.uri ||
                    `/api/v${this.version}` + path + searchParams,
                  complete: response.complete,
                  header: response.headers,
                  body: options?.body,
                  response: JSON.parse(body),
                  status: {
                    code: response.statusCode,
                    message: response.statusMessage
                  },
                  error: response.errored,
                  httpVersion: response.httpVersion,
                  method: response.method
                });
                response.destroy();
                throw new GuildedApiError(JSON.stringify(json));
              } else resolve(json);
            } catch (e: any) {
              if (e instanceof SyntaxError) {
                return;
              }
              throw new GuildedApiError(e);
            }
          });
        }
      );

      if (options?.body) req.write(options.body);

      req.end(JSON.stringify);
    });
  }

  get<R = any, P extends Record<string, any> = Record<string, any>>(
    path: string,
    params?: P
  ) {
    if (params) path = path + '?';
    return this.https<R, any, P>(path, 'GET', { params });
  }

  post<R = any, B = any>(path: string, body?: B) {
    return this.https<R, B>(path, 'POST', body);
  }

  patch<R = any, B = any>(path: string, body?: B) {
    return this.https<R, B>(path, 'PATCH', body);
  }

  put<R = any, B = any>(path: string, body?: B) {
    return this.https<R, B>(path, 'PUT', body);
  }

  delete<R>(path: string) {
    return this.https<R>(path, 'DELETE');
  }
}

export interface RESTOptions {
  headers?: any;
  token?: string;
  version?: number;
  proxyUrl?: string;
  retryInterval?: number;
  maxRetries?: number;
}

export interface APIFetchOptions<
  B = any,
  P extends Record<string, any> = Record<string, any>
> {
  token?: string;
  uri?: string;
  host?: string;
  port?: any;
  params?: P;
  body?: B;
}
