"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapResponse = wrapResponse;
function wrapResponse(data) {
    if (Array.isArray(data)) {
        return data.map(wrapResponse);
    }
    if (data !== null && typeof data === "object") {
        const wrapped = {};
        for (const [k, v] of Object.entries(data)) {
            wrapped[k] = wrapResponse(v);
        }
        return wrapped;
    }
    return data;
}
