"""Async roadside inspections and violation details."""


class AsyncInspectionsResource:
    def __init__(self, http):
        self._http = http

    async def list(self, dot_number, limit=50, offset=0):
        params = {"limit": limit, "offset": offset}
        return await self._http.get(f"/v1/carriers/{dot_number}/inspections", params=params)

    async def list_iter(self, dot_number, limit=200):
        offset = 0
        while True:
            resp = await self.list(dot_number, limit=limit, offset=offset)
            inspections = resp.get("inspections", [])
            if not inspections:
                return
            for item in inspections:
                yield item
            offset += len(inspections)
            if offset >= resp.get("total_results", resp.get("total_inspections", 0)):
                return

    async def violations(self, inspection_id, page=1, limit=25):
        params = {"page": page, "limit": limit}
        return await self._http.get(f"/v1/inspections/{inspection_id}/violations", params=params)

    async def violations_iter(self, inspection_id, limit=25):
        page = 1
        while True:
            resp = await self.violations(inspection_id, page=page, limit=limit)
            violations = resp.get("violations", [])
            if not violations:
                return
            for item in violations:
                yield item
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1
