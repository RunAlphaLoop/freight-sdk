"""Truck and trailer fleet data."""


class FleetResource:
    def __init__(self, http):
        self._http = http

    def trucks(self, dot_number, limit=50, offset=0):
        """Registered truck (power unit) fleet.

        Args:
            dot_number: The carrier's USDOT number.
            limit: Results per page (default 50, max 200).
            offset: Number of results to skip (default 0).
        """
        params = {"limit": limit, "offset": offset}
        return self._http.get(f"/v1/carriers/{dot_number}/trucks", params=params)

    def trucks_iter(self, dot_number, limit=200):
        """Iterate all trucks, auto-paginating."""
        offset = 0
        while True:
            resp = self.trucks(dot_number, limit=limit, offset=offset)
            trucks = resp.get("trucks", [])
            if not trucks:
                return
            yield from trucks
            offset += len(trucks)
            if offset >= resp.get("total_results", resp.get("total_trucks", 0)):
                return

    def trailers(self, dot_number, limit=50, offset=0):
        """Registered trailer fleet.

        Args:
            dot_number: The carrier's USDOT number.
            limit: Results per page (default 50, max 200).
            offset: Number of results to skip (default 0).
        """
        params = {"limit": limit, "offset": offset}
        return self._http.get(f"/v1/carriers/{dot_number}/trailers", params=params)

    def trailers_iter(self, dot_number, limit=200):
        """Iterate all trailers, auto-paginating."""
        offset = 0
        while True:
            resp = self.trailers(dot_number, limit=limit, offset=offset)
            trailers = resp.get("trailers", [])
            if not trailers:
                return
            yield from trailers
            offset += len(trailers)
            if offset >= resp.get("total_results", resp.get("total_trailers", 0)):
                return
