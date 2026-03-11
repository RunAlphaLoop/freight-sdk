"""Async contact search and enrichment."""

import asyncio

from ..exceptions import AlphaLoopsError, AlphaLoopsPendingError
from ..api_object import APIObject


class AsyncContactsResource:
    def __init__(self, http):
        self._http = http

    async def search(self, dot_number=None, company_name=None, job_title=None,
                     job_title_levels=None, page=1, limit=25, auto_retry=True, max_retries=6):
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
            resp = await self._http.get_raw("/v1/contacts/search", params=params)

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
                await asyncio.sleep(retry_after)
                continue

            self._http._raise_for_status(resp)

        raise AlphaLoopsError("Contacts still pending after max retries")

    async def search_iter(self, dot_number=None, company_name=None, job_title=None,
                          job_title_levels=None, limit=25, auto_retry=True):
        page = 1
        while True:
            resp = await self.search(
                dot_number=dot_number, company_name=company_name,
                job_title=job_title, job_title_levels=job_title_levels,
                page=page, limit=limit, auto_retry=auto_retry,
            )
            contacts = resp.get("contacts", [])
            if not contacts:
                return
            for item in contacts:
                yield item
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    async def enrich(self, contact_id):
        return await self._http.get(f"/v1/contacts/{contact_id}/enrich")
