import type { HTTPClient } from "../http-client.js";
import type { APIObject } from "../api-object.js";
import { wrapResponse } from "../api-object.js";
import { AlphaLoopsError, AlphaLoopsPendingError } from "../errors.js";

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export class ContactsResource {
  constructor(private http: HTTPClient) {}

  async search(options: {
    dotNumber?: string;
    companyName?: string;
    jobTitle?: string;
    jobTitleLevels?: string;
    page?: number;
    limit?: number;
    autoRetry?: boolean;
    maxRetries?: number;
  } = {}): Promise<APIObject> {
    const {
      dotNumber,
      companyName,
      jobTitle,
      jobTitleLevels,
      page = 1,
      limit = 25,
      autoRetry = true,
      maxRetries = 6,
    } = options;

    const params: Record<string, any> = { page, limit };
    if (dotNumber !== undefined) params.dot_number = dotNumber;
    if (companyName !== undefined) params.company_name = companyName;
    if (jobTitle !== undefined) params.job_title = jobTitle;
    if (jobTitleLevels !== undefined) params.job_title_levels = jobTitleLevels;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const resp = await this.http.getRaw("/v1/contacts/search", params);

      if (resp.status === 200) {
        return wrapResponse(resp.body);
      }

      if (resp.status === 202) {
        if (!autoRetry || attempt >= maxRetries) {
          throw new AlphaLoopsPendingError(
            resp.body?.message ?? "Contacts still being fetched",
            resp.body?.retry_after
          );
        }
        const parsed = parseInt(resp.headers.get("Retry-After") ?? "", 10);
        const retryAfter = isNaN(parsed) ? 5 : parsed;
        await sleep(retryAfter);
        continue;
      }

      // Any other status — let error handling deal with it
      this.http.raiseForStatus(resp.status, resp.body);
    }

    throw new AlphaLoopsError("Contacts still pending after max retries");
  }

  async *searchIter(options: {
    dotNumber?: string;
    companyName?: string;
    jobTitle?: string;
    jobTitleLevels?: string;
    limit?: number;
    autoRetry?: boolean;
  } = {}): AsyncGenerator<APIObject> {
    const { limit = 25, ...rest } = options;
    let page = 1;
    while (true) {
      const resp = await this.search({ ...rest, page, limit });
      const contacts = resp.contacts ?? [];
      if (!contacts.length) return;
      yield* contacts;
      const totalPages = resp.pagination?.total_pages ?? page;
      if (page >= totalPages) return;
      page++;
    }
  }

  async enrich(contactId: string): Promise<APIObject> {
    return this.http.get(`/v1/contacts/${contactId}/enrich`);
  }
}
