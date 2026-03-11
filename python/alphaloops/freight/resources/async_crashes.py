"""Async carrier crash history."""


class AsyncCrashesResource:
    def __init__(self, http):
        self._http = http

    async def list(self, dot_number, start_date=None, end_date=None, severity=None, page=1, limit=25):
        params = {"page": page, "limit": limit}
        if start_date is not None:
            params["start_date"] = start_date
        if end_date is not None:
            params["end_date"] = end_date
        if severity is not None:
            params["severity"] = severity
        return await self._http.get(f"/v1/carriers/{dot_number}/crashes", params=params)

    async def list_iter(self, dot_number, start_date=None, end_date=None, severity=None, limit=25):
        page = 1
        while True:
            resp = await self.list(dot_number, start_date=start_date, end_date=end_date, severity=severity, page=page, limit=limit)
            crashes = resp.get("crashes", [])
            if not crashes:
                return
            for item in crashes:
                yield item
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1
