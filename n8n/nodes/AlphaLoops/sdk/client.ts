import { HTTPClient } from './http-client';
import { CarriersResource } from './resources/carriers';
import { ContactsResource } from './resources/contacts';
import { CrashesResource } from './resources/crashes';
import { FleetResource } from './resources/fleet';
import { InspectionsResource } from './resources/inspections';

const VERSION = '0.1.0';
const BASE_URL = 'https://api.runalphaloops.com';

export class AlphaLoops {
	private _http: HTTPClient;
	private _carriers?: CarriersResource;
	private _fleet?: FleetResource;
	private _inspections?: InspectionsResource;
	private _crashes?: CrashesResource;
	private _contacts?: ContactsResource;

	constructor(options: { apiKey: string; baseUrl?: string }) {
		this._http = new HTTPClient({
			baseUrl: options.baseUrl ?? BASE_URL,
			apiKey: options.apiKey,
			timeout: 30,
			maxRetries: 3,
			retryBaseDelay: 1.0,
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
