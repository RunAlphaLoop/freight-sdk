"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectionsResource = void 0;
class InspectionsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async list(dotNumber, options = {}) {
        const { limit = 50, offset = 0 } = options;
        return this.http.get(`/v1/carriers/${dotNumber}/inspections`, { limit, offset });
    }
    async violations(inspectionId, options = {}) {
        const { page = 1, limit = 25 } = options;
        return this.http.get(`/v1/inspections/${inspectionId}/violations`, { page, limit });
    }
}
exports.InspectionsResource = InspectionsResource;
