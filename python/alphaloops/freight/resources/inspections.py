"""Roadside inspections and violation details."""


class InspectionsResource:
    def __init__(self, http):
        self._http = http

    def list(self, dot_number, limit=50, offset=0):
        """Roadside inspection history.

        Args:
            dot_number: The carrier's USDOT number.
            limit: Results per page (default 50, max 200).
            offset: Number of results to skip (default 0).
        """
        params = {"limit": limit, "offset": offset}
        return self._http.get(f"/v1/carriers/{dot_number}/inspections", params=params)

    def list_iter(self, dot_number, limit=200):
        """Iterate all inspections, auto-paginating."""
        offset = 0
        while True:
            resp = self.list(dot_number, limit=limit, offset=offset)
            inspections = resp.get("inspections", [])
            if not inspections:
                return
            yield from inspections
            offset += len(inspections)
            if offset >= resp.get("total_results", resp.get("total_inspections", 0)):
                return

    def violations(self, inspection_id, page=1, limit=25):
        """Violations from a specific roadside inspection.

        Args:
            inspection_id: The inspection report number.
            page: Page number (default 1).
            limit: Results per page (default 25, max 100).
        """
        params = {"page": page, "limit": limit}
        return self._http.get(f"/v1/inspections/{inspection_id}/violations", params=params)

    def violations_iter(self, inspection_id, limit=25):
        """Iterate all violations for an inspection, auto-paginating."""
        page = 1
        while True:
            resp = self.violations(inspection_id, page=page, limit=limit)
            violations = resp.get("violations", [])
            if not violations:
                return
            yield from violations
            pagination = resp.get("pagination", {})
            if page >= pagination.get("total_pages", page):
                return
            page += 1
