"""Async carrier profiles, search, authority history, and news."""


class AsyncCarriersResource:
    def __init__(self, http):
        self._http = http

    async def get(self, dot_number, fields=None):
        params = {}
        if fields is not None:
            params["fields"] = fields
        return await self._http.get(f"/v1/carriers/{dot_number}", params=params or None)

    async def get_by_mc(self, mc_number, fields=None):
        params = {}
        if fields is not None:
            params["fields"] = fields
        return await self._http.get(f"/v1/carriers/mc/{mc_number}", params=params or None)

    async def search(self, company_name, domain=None, state=None, city=None, page=1, limit=10):
        params = {"company_name": company_name, "page": page, "limit": limit}
        if domain is not None:
            params["domain"] = domain
        if state is not None:
            params["state"] = state
        if city is not None:
            params["city"] = city
        return await self._http.get("/v1/carriers/search", params=params)

    async def search_iter(self, company_name, domain=None, state=None, city=None, limit=10):
        page = 1
        while True:
            resp = await self.search(company_name, domain=domain, state=state, city=city, page=page, limit=limit)
            results = resp.get("results", [])
            if not results:
                return
            for item in results:
                yield item
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    async def authority(self, dot_number, limit=50, offset=0):
        params = {"limit": limit, "offset": offset}
        return await self._http.get(f"/v1/carriers/{dot_number}/authority", params=params)

    async def authority_iter(self, dot_number, limit=50):
        offset = 0
        while True:
            resp = await self.authority(dot_number, limit=limit, offset=offset)
            records = resp.get("authority_history", [])
            if not records:
                return
            for item in records:
                yield item
            offset += len(records)
            if offset >= resp.get("total_records", 0):
                return

    async def filtered_query(self, include, exclude=None, sort_by=None, sort_order=None,
                             page=1, limit=25, fields=None):
        body = {"include": include, "page": page, "limit": limit}
        if exclude is not None:
            body["exclude"] = exclude
        if sort_by is not None:
            body["sort_by"] = sort_by
        if sort_order is not None:
            body["sort_order"] = sort_order
        if fields is not None:
            body["fields"] = fields
        return await self._http.post("/v1/carriers/query", json=body)

    async def filtered_query_iter(self, include, exclude=None, sort_by=None, sort_order=None,
                                  limit=25, fields=None):
        page = 1
        while True:
            resp = await self.filtered_query(
                include=include, exclude=exclude, sort_by=sort_by,
                sort_order=sort_order, page=page, limit=limit, fields=fields,
            )
            results = resp.get("results", [])
            if not results:
                return
            for item in results:
                yield item
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    async def timeline(self, dot_number, start_date=None, end_date=None, category=None,
                       limit=50, offset=0):
        params = {"limit": limit, "offset": offset}
        if start_date is not None:
            params["start_date"] = start_date
        if end_date is not None:
            params["end_date"] = end_date
        if category is not None:
            params["category"] = category
        return await self._http.get(f"/v1/carriers/{dot_number}/timeline", params=params)

    async def timeline_iter(self, dot_number, start_date=None, end_date=None, category=None,
                            limit=50):
        offset = 0
        while True:
            resp = await self.timeline(dot_number, start_date=start_date, end_date=end_date,
                                       category=category, limit=limit, offset=offset)
            events = resp.get("events", [])
            if not events:
                return
            for item in events:
                yield item
            offset += len(events)
            if offset >= resp.get("total", 0):
                return

    async def insurance(self, dot_number, coverage_type=None, status=None, page=1, limit=50):
        params = {"page": page, "limit": limit}
        if coverage_type is not None:
            params["coverage_type"] = coverage_type
        if status is not None:
            params["status"] = status
        return await self._http.get(f"/v1/carriers/{dot_number}/insurance", params=params)

    async def insurance_iter(self, dot_number, coverage_type=None, status=None, limit=50):
        page = 1
        while True:
            resp = await self.insurance(dot_number, coverage_type=coverage_type, status=status,
                                        page=page, limit=limit)
            records = resp.get("insurance", [])
            if not records:
                return
            for item in records:
                yield item
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    async def insurance_by_mc(self, mc_number, coverage_type=None, status=None, page=1, limit=50):
        params = {"page": page, "limit": limit}
        if coverage_type is not None:
            params["coverage_type"] = coverage_type
        if status is not None:
            params["status"] = status
        return await self._http.get(f"/v1/carriers/mc/{mc_number}/insurance", params=params)

    async def insurance_by_mc_iter(self, mc_number, coverage_type=None, status=None, limit=50):
        page = 1
        while True:
            resp = await self.insurance_by_mc(mc_number, coverage_type=coverage_type, status=status,
                                              page=page, limit=limit)
            records = resp.get("insurance", [])
            if not records:
                return
            for item in records:
                yield item
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    async def news(self, dot_number, start_date=None, end_date=None, page=1, limit=25):
        params = {"page": page, "limit": limit}
        if start_date is not None:
            params["start_date"] = start_date
        if end_date is not None:
            params["end_date"] = end_date
        return await self._http.get(f"/v1/carriers/{dot_number}/news", params=params)

    async def news_iter(self, dot_number, start_date=None, end_date=None, limit=25):
        page = 1
        while True:
            resp = await self.news(dot_number, start_date=start_date, end_date=end_date, page=page, limit=limit)
            articles = resp.get("articles", [])
            if not articles:
                return
            for item in articles:
                yield item
            total = resp.get("total_results", 0)
            if page * limit >= total:
                return
            page += 1
