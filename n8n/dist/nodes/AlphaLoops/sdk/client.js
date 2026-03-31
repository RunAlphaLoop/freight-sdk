"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaLoops = void 0;
const http_client_1 = require("./http-client");
const carriers_1 = require("./resources/carriers");
const contacts_1 = require("./resources/contacts");
const crashes_1 = require("./resources/crashes");
const fleet_1 = require("./resources/fleet");
const inspections_1 = require("./resources/inspections");
const VERSION = '0.1.0';
const BASE_URL = 'https://api.runalphaloops.com';
class AlphaLoops {
    _http;
    _carriers;
    _fleet;
    _inspections;
    _crashes;
    _contacts;
    constructor(options) {
        this._http = new http_client_1.HTTPClient({
            baseUrl: options.baseUrl ?? BASE_URL,
            apiKey: options.apiKey,
            timeout: 30,
            maxRetries: 3,
            retryBaseDelay: 1.0,
            version: VERSION,
        });
    }
    get carriers() {
        if (!this._carriers)
            this._carriers = new carriers_1.CarriersResource(this._http);
        return this._carriers;
    }
    get fleet() {
        if (!this._fleet)
            this._fleet = new fleet_1.FleetResource(this._http);
        return this._fleet;
    }
    get inspections() {
        if (!this._inspections)
            this._inspections = new inspections_1.InspectionsResource(this._http);
        return this._inspections;
    }
    get crashes() {
        if (!this._crashes)
            this._crashes = new crashes_1.CrashesResource(this._http);
        return this._crashes;
    }
    get contacts() {
        if (!this._contacts)
            this._contacts = new contacts_1.ContactsResource(this._http);
        return this._contacts;
    }
}
exports.AlphaLoops = AlphaLoops;
