"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetResource = void 0;
class FleetResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async trucks(dotNumber, options = {}) {
        const { limit = 50, offset = 0 } = options;
        return this.http.get(`/v1/carriers/${dotNumber}/trucks`, { limit, offset });
    }
    async trailers(dotNumber, options = {}) {
        const { limit = 50, offset = 0 } = options;
        return this.http.get(`/v1/carriers/${dotNumber}/trailers`, { limit, offset });
    }
}
exports.FleetResource = FleetResource;
