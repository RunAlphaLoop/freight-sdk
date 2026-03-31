"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsResource = void 0;
const api_object_1 = require("../api-object");
const errors_1 = require("../errors");
function sleep(seconds) {
    return Promise.resolve();
}
class ContactsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async search(options = {}) {
        const { dotNumber, companyName, jobTitle, jobTitleLevels, page = 1, limit = 25, autoRetry = true, maxRetries = 6, } = options;
        const params = { page, limit };
        if (dotNumber !== undefined)
            params.dot_number = dotNumber;
        if (companyName !== undefined)
            params.company_name = companyName;
        if (jobTitle !== undefined)
            params.job_title = jobTitle;
        if (jobTitleLevels !== undefined)
            params.job_title_levels = jobTitleLevels;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const resp = await this.http.getRaw("/v1/contacts/search", params);
            if (resp.status === 200) {
                return (0, api_object_1.wrapResponse)(resp.body);
            }
            if (resp.status === 202) {
                if (!autoRetry || attempt >= maxRetries) {
                    throw new errors_1.AlphaLoopsPendingError(resp.body?.message ?? "Contacts still being fetched", resp.body?.retry_after);
                }
                const parsed = parseInt(resp.headers.get("Retry-After") ?? "", 10);
                const retryAfter = isNaN(parsed) ? 5 : parsed;
                await sleep(retryAfter);
                continue;
            }
            // Any other status — let error handling deal with it
            this.http.raiseForStatus(resp.status, resp.body);
        }
        throw new errors_1.AlphaLoopsError("Contacts still pending after max retries");
    }
    async enrich(contactId) {
        return this.http.get(`/v1/contacts/${contactId}/enrich`);
    }
}
exports.ContactsResource = ContactsResource;
