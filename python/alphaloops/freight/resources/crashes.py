"""Carrier crash history."""


class CrashesResource:
    def __init__(self, http):
        self._http = http

    def list(self, dot_number, start_date=None, end_date=None, severity=None, page=1, limit=25):
        """Reported crash history.

        Args:
            dot_number: The carrier's USDOT number.
            start_date: Filter from date (ISO 8601, e.g. "2024-01-01").
            end_date: Filter to date (ISO 8601).
            severity: Filter: "FATAL", "INJURY", "TOW", "PROPERTY_DAMAGE".
            page: Page number (default 1).
            limit: Results per page (default 25, max 100).
        """
        params = {"page": page, "limit": limit}
        if start_date is not None:
            params["start_date"] = start_date
        if end_date is not None:
            params["end_date"] = end_date
        if severity is not None:
            params["severity"] = severity
        return self._http.get(f"/v1/carriers/{dot_number}/crashes", params=params)

    def list_iter(self, dot_number, start_date=None, end_date=None, severity=None, limit=25):
        """Iterate all crashes, auto-paginating."""
        page = 1
        while True:
            resp = self.list(dot_number, start_date=start_date, end_date=end_date, severity=severity, page=page, limit=limit)
            crashes = resp.get("crashes", [])
            if not crashes:
                return
            yield from crashes
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1
