"""Carrier profiles, search, authority history, and news."""


class CarriersResource:
    def __init__(self, http):
        self._http = http

    def get(self, dot_number, fields=None):
        """Full carrier profile by USDOT number (200+ fields).

        Args:
            dot_number: The carrier's USDOT number.
            fields: Optional comma-separated field names for projection.
        """
        params = {}
        if fields is not None:
            params["fields"] = fields
        return self._http.get(f"/v1/carriers/{dot_number}", params=params or None)

    def get_by_mc(self, mc_number, fields=None):
        """Full carrier profile by MC/MX docket number.

        Args:
            mc_number: The carrier's MC or MX docket number.
            fields: Optional comma-separated field names for projection.
        """
        params = {}
        if fields is not None:
            params["fields"] = fields
        return self._http.get(f"/v1/carriers/mc/{mc_number}", params=params or None)

    def search(self, company_name, domain=None, state=None, city=None, page=1, limit=10):
        """Fuzzy-match a company to carriers with confidence scoring.

        Args:
            company_name: Company name (fuzzy matching).
            domain: Website domain for improved accuracy.
            state: State abbreviation (e.g. "TX").
            city: City name.
            page: Page number (default 1).
            limit: Results per page (default 10, max 50).
        """
        params = {"company_name": company_name, "page": page, "limit": limit}
        if domain is not None:
            params["domain"] = domain
        if state is not None:
            params["state"] = state
        if city is not None:
            params["city"] = city
        return self._http.get("/v1/carriers/search", params=params)

    def search_iter(self, company_name, domain=None, state=None, city=None, limit=10):
        """Iterate all search results, auto-paginating."""
        page = 1
        while True:
            resp = self.search(company_name, domain=domain, state=state, city=city, page=page, limit=limit)
            results = resp.get("results", [])
            if not results:
                return
            yield from results
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    def authority(self, dot_number, limit=50, offset=0):
        """Operating authority history — grants, revocations, reinstatements.

        Args:
            dot_number: The carrier's USDOT number.
            limit: Results per page (default 50).
            offset: Number of results to skip (default 0).
        """
        params = {"limit": limit, "offset": offset}
        return self._http.get(f"/v1/carriers/{dot_number}/authority", params=params)

    def authority_iter(self, dot_number, limit=50):
        """Iterate all authority records, auto-paginating."""
        offset = 0
        while True:
            resp = self.authority(dot_number, limit=limit, offset=offset)
            records = resp.get("authority_history", [])
            if not records:
                return
            yield from records
            offset += len(records)
            if offset >= resp.get("total_records", 0):
                return

    def filtered_query(self, include, exclude=None, sort_by=None, sort_order=None,
                       page=1, limit=25, fields=None):
        """Query carriers with include/exclude condition blocks and optional geo radius.

        Args:
            include: Dict of conditions carriers MUST meet. Supports text exact
                (state, status, ...), text partial (city, domain, ...), name search,
                array contains (cargo, services, ...), range (power_units, drivers, ...
                with min/max), boolean (has_bipd_coverage, hazmat_threshold, ...),
                authority (has_common_authority, ...), and location
                ({latitude, longitude, radius_miles}).
            exclude: Optional dict of conditions carriers must NOT meet (same filter
                types as include, except location).
            sort_by: Sort field (default "dot_number", or "distance" with location).
            sort_order: "asc" or "desc".
            page: Page number (default 1).
            limit: Results per page (1–100, default 25).
            fields: Optional comma-separated field projection.
        """
        body = {"include": include, "page": page, "limit": limit}
        if exclude is not None:
            body["exclude"] = exclude
        if sort_by is not None:
            body["sort_by"] = sort_by
        if sort_order is not None:
            body["sort_order"] = sort_order
        if fields is not None:
            body["fields"] = fields
        return self._http.post("/v1/carriers/query", json=body)

    def filtered_query_iter(self, include, exclude=None, sort_by=None, sort_order=None,
                            limit=25, fields=None):
        """Iterate all filtered_query results, auto-paginating."""
        page = 1
        while True:
            resp = self.filtered_query(
                include=include, exclude=exclude, sort_by=sort_by,
                sort_order=sort_order, page=page, limit=limit, fields=fields,
            )
            results = resp.get("results", [])
            if not results:
                return
            yield from results
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    def timeline(self, dot_number, start_date=None, end_date=None, category=None,
                 limit=50, offset=0):
        """Merged chronological feed of carrier change events and authority history.

        Args:
            dot_number: The carrier's USDOT number.
            start_date: Filter from date (ISO 8601).
            end_date: Filter to date (ISO 8601).
            category: Event category filter (e.g. "contact", "authority", "fleet").
            limit: Results per page (default 50).
            offset: Number of results to skip (default 0).
        """
        params = {"limit": limit, "offset": offset}
        if start_date is not None:
            params["start_date"] = start_date
        if end_date is not None:
            params["end_date"] = end_date
        if category is not None:
            params["category"] = category
        return self._http.get(f"/v1/carriers/{dot_number}/timeline", params=params)

    def timeline_iter(self, dot_number, start_date=None, end_date=None, category=None,
                      limit=50):
        """Iterate all timeline events, auto-paginating."""
        offset = 0
        while True:
            resp = self.timeline(dot_number, start_date=start_date, end_date=end_date,
                                category=category, limit=limit, offset=offset)
            events = resp.get("events", [])
            if not events:
                return
            yield from events
            offset += len(events)
            if offset >= resp.get("total", 0):
                return

    def insurance(self, dot_number, coverage_type=None, status=None, page=1, limit=50):
        """Insurance filings (BIPD, cargo, bond) for a carrier.

        Args:
            dot_number: The carrier's USDOT number.
            coverage_type: Filter by type (e.g. "BIPD", "CARGO", "BOND").
            status: Filter by status.
            page: Page number (default 1).
            limit: Results per page (default 50).
        """
        params = {"page": page, "limit": limit}
        if coverage_type is not None:
            params["coverage_type"] = coverage_type
        if status is not None:
            params["status"] = status
        return self._http.get(f"/v1/carriers/{dot_number}/insurance", params=params)

    def insurance_iter(self, dot_number, coverage_type=None, status=None, limit=50):
        """Iterate all insurance filings, auto-paginating."""
        page = 1
        while True:
            resp = self.insurance(dot_number, coverage_type=coverage_type, status=status,
                                 page=page, limit=limit)
            records = resp.get("insurance", [])
            if not records:
                return
            yield from records
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    def insurance_by_mc(self, mc_number, coverage_type=None, status=None, page=1, limit=50):
        """Insurance filings by MC docket number.

        Args:
            mc_number: The carrier's MC or MX docket number.
            coverage_type: Filter by type (e.g. "BIPD", "CARGO", "BOND").
            status: Filter by status.
            page: Page number (default 1).
            limit: Results per page (default 50).
        """
        params = {"page": page, "limit": limit}
        if coverage_type is not None:
            params["coverage_type"] = coverage_type
        if status is not None:
            params["status"] = status
        return self._http.get(f"/v1/carriers/mc/{mc_number}/insurance", params=params)

    def insurance_by_mc_iter(self, mc_number, coverage_type=None, status=None, limit=50):
        """Iterate all insurance filings by MC, auto-paginating."""
        page = 1
        while True:
            resp = self.insurance_by_mc(mc_number, coverage_type=coverage_type, status=status,
                                        page=page, limit=limit)
            records = resp.get("insurance", [])
            if not records:
                return
            yield from records
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1

    def news(self, dot_number, start_date=None, end_date=None, page=1, limit=25):
        """Recent news articles and press mentions.

        Args:
            dot_number: The carrier's USDOT number.
            start_date: Filter from date (ISO 8601).
            end_date: Filter to date (ISO 8601).
            page: Page number (default 1).
            limit: Results per page (default 25, max 100).
        """
        params = {"page": page, "limit": limit}
        if start_date is not None:
            params["start_date"] = start_date
        if end_date is not None:
            params["end_date"] = end_date
        return self._http.get(f"/v1/carriers/{dot_number}/news", params=params)

    def news_iter(self, dot_number, start_date=None, end_date=None, limit=25):
        """Iterate all news articles, auto-paginating."""
        page = 1
        while True:
            resp = self.news(dot_number, start_date=start_date, end_date=end_date, page=page, limit=limit)
            articles = resp.get("articles", [])
            if not articles:
                return
            yield from articles
            total = resp.get("total_results", 0)
            if page * limit >= total:
                return
            page += 1
