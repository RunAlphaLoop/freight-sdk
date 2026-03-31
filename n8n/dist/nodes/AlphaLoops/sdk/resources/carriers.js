"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarriersResource = void 0;
class CarriersResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async get(dotNumber, fields) {
        const params = {};
        if (fields !== undefined)
            params.fields = fields;
        return this.http.get(`/v1/carriers/${dotNumber}`, Object.keys(params).length ? params : undefined);
    }
    async getByMc(mcNumber, fields) {
        const params = {};
        if (fields !== undefined)
            params.fields = fields;
        return this.http.get(`/v1/carriers/mc/${mcNumber}`, Object.keys(params).length ? params : undefined);
    }
    async search(companyName, options = {}) {
        const { domain, state, city, page = 1, limit = 10 } = options;
        const params = { company_name: companyName, page, limit };
        if (domain !== undefined)
            params.domain = domain;
        if (state !== undefined)
            params.state = state;
        if (city !== undefined)
            params.city = city;
        return this.http.get("/v1/carriers/search", params);
    }
    async authority(dotNumber, options = {}) {
        const { limit = 50, offset = 0 } = options;
        return this.http.get(`/v1/carriers/${dotNumber}/authority`, { limit, offset });
    }
    async filteredQuery(include, options = {}) {
        const { exclude, sortBy, sortOrder, page = 1, limit = 25, fields } = options;
        const body = { include, page, limit };
        if (exclude !== undefined)
            body.exclude = exclude;
        if (sortBy !== undefined)
            body.sort_by = sortBy;
        if (sortOrder !== undefined)
            body.sort_order = sortOrder;
        if (fields !== undefined)
            body.fields = fields;
        return this.http.post("/v1/carriers/query", body);
    }
    async news(dotNumber, options = {}) {
        const { startDate, endDate, page = 1, limit = 25 } = options;
        const params = { page, limit };
        if (startDate !== undefined)
            params.start_date = startDate;
        if (endDate !== undefined)
            params.end_date = endDate;
        return this.http.get(`/v1/carriers/${dotNumber}/news`, params);
    }
}
exports.CarriersResource = CarriersResource;
