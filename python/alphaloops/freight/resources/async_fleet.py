"""Async truck and trailer fleet data."""


class AsyncFleetResource:
    def __init__(self, http):
        self._http = http

    async def trucks(self, dot_number, limit=50, offset=0):
        params = {"limit": limit, "offset": offset}
        return await self._http.get(f"/v1/carriers/{dot_number}/trucks", params=params)

    async def trucks_iter(self, dot_number, limit=200):
        offset = 0
        while True:
            resp = await self.trucks(dot_number, limit=limit, offset=offset)
            trucks = resp.get("trucks", [])
            if not trucks:
                return
            for item in trucks:
                yield item
            offset += len(trucks)
            if offset >= resp.get("total_results", resp.get("total_trucks", 0)):
                return

    async def trailers(self, dot_number, limit=50, offset=0):
        params = {"limit": limit, "offset": offset}
        return await self._http.get(f"/v1/carriers/{dot_number}/trailers", params=params)

    async def trailers_iter(self, dot_number, limit=200):
        offset = 0
        while True:
            resp = await self.trailers(dot_number, limit=limit, offset=offset)
            trailers = resp.get("trailers", [])
            if not trailers:
                return
            for item in trailers:
                yield item
            offset += len(trailers)
            if offset >= resp.get("total_results", resp.get("total_trailers", 0)):
                return
