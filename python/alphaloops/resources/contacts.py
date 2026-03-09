"""Contact search and enrichment."""

import time

from ..exceptions import AlphaLoopsError, AlphaLoopsPendingError
from ..api_object import APIObject


class ContactsResource:
    def __init__(self, http):
        self._http = http

    def search(self, dot_number=None, company_name=None, job_title=None,
               job_title_levels=None, page=1, limit=25, auto_retry=True, max_retries=6):
        """Find people at a carrier or company.

        Args:
            dot_number: The carrier's USDOT number.
            company_name: Company name (required if dot_number not provided).
            job_title: Filter by job title keyword.
            job_title_levels: Filter by seniority: "vp", "director", "manager", "c_suite".
            page: Page number (default 1).
            limit: Results per page (default 25, max 100).
            auto_retry: If True (default), auto-retries on 202 (async fetch).
            max_retries: Max retry attempts on 202 (default 6).
        """
        params = {"page": page, "limit": limit}
        if dot_number is not None:
            params["dot_number"] = dot_number
        if company_name is not None:
            params["company_name"] = company_name
        if job_title is not None:
            params["job_title"] = job_title
        if job_title_levels is not None:
            params["job_title_levels"] = job_title_levels

        for attempt in range(max_retries + 1):
            resp = self._http.get_raw(f"/v1/contacts/search", params=params)

            if resp.status_code == 200:
                return APIObject.from_response(resp.json())

            if resp.status_code == 202:
                if not auto_retry or attempt >= max_retries:
                    body = resp.json()
                    raise AlphaLoopsPendingError(
                        body.get("message", "Contacts still being fetched"),
                        retry_after=body.get("retry_after"),
                    )
                retry_after = int(resp.headers.get("Retry-After", 5))
                time.sleep(retry_after)
                continue

            # Any other status — let the HTTP client's error handling deal with it
            self._http._raise_for_status(resp)

        raise AlphaLoopsError("Contacts still pending after max retries")

    def search_iter(self, dot_number=None, company_name=None, job_title=None,
                    job_title_levels=None, limit=25, auto_retry=True):
        """Iterate all contacts, auto-paginating."""
        page = 1
        while True:
            resp = self.search(
                dot_number=dot_number, company_name=company_name,
                job_title=job_title, job_title_levels=job_title_levels,
                page=page, limit=limit, auto_retry=auto_retry,
            )
            contacts = resp.get("contacts", [])
            if not contacts:
                return
            yield from contacts
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    def enrich(self, contact_id):
        """Enrich a contact — verified emails, phones, skills, work history.

        Costs 1 enrichment credit per new enrichment. Cached results are free.

        Args:
            contact_id: The contact ID from search results.
        """
        return self._http.get(f"/v1/contacts/{contact_id}/enrich")
