import { resolveConfig } from "./config.js";
import { AlphaLoopsAuthError } from "./errors.js";
import { HTTPClient } from "./http-client.js";
import { CarriersResource } from "./resources/carriers.js";
import { ContactsResource } from "./resources/contacts.js";
import { CrashesResource } from "./resources/crashes.js";
import { FleetResource } from "./resources/fleet.js";
import { InspectionsResource } from "./resources/inspections.js";

const VERSION = "0.1.0";

export interface AlphaLoopsOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryBaseDelay?: number;
}

export class AlphaLoops {
  private _http: HTTPClient;
  private _carriers?: CarriersResource;
  private _fleet?: FleetResource;
  private _inspections?: InspectionsResource;
  private _crashes?: CrashesResource;
  private _contacts?: ContactsResource;

  constructor(options: AlphaLoopsOptions = {}) {
    const {
      timeout = 30,
      maxRetries = 3,
      retryBaseDelay = 1.0,
    } = options;

    const { apiKey, baseUrl } = resolveConfig(options.apiKey, options.baseUrl);

    if (!apiKey) {
      throw new AlphaLoopsAuthError();
    }

    this._http = new HTTPClient({
      baseUrl,
      apiKey,
      timeout,
      maxRetries,
      retryBaseDelay,
      version: VERSION,
    });
  }

  get carriers(): CarriersResource {
    if (!this._carriers) this._carriers = new CarriersResource(this._http);
    return this._carriers;
  }

  get fleet(): FleetResource {
    if (!this._fleet) this._fleet = new FleetResource(this._http);
    return this._fleet;
  }

  get inspections(): InspectionsResource {
    if (!this._inspections) this._inspections = new InspectionsResource(this._http);
    return this._inspections;
  }

  get crashes(): CrashesResource {
    if (!this._crashes) this._crashes = new CrashesResource(this._http);
    return this._crashes;
  }

  get contacts(): ContactsResource {
    if (!this._contacts) this._contacts = new ContactsResource(this._http);
    return this._contacts;
  }
}
