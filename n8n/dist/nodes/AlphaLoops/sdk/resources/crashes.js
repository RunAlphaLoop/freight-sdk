"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrashesResource = void 0;
class CrashesResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async list(dotNumber, options = {}) {
        const { startDate, endDate, severity, page = 1, limit = 25 } = options;
        const params = { page, limit };
        if (startDate !== undefined)
            params.start_date = startDate;
        if (endDate !== undefined)
            params.end_date = endDate;
        if (severity !== undefined)
            params.severity = severity;
        return this.http.get(`/v1/carriers/${dotNumber}/crashes`, params);
    }
}
exports.CrashesResource = CrashesResource;
