"""Schema-free dict wrapper with dot-access for API responses."""

import json


class APIObject(dict):
    """Dict subclass with attribute access. No schema to maintain.

    Nested dicts are recursively wrapped so dot-access works at any depth:
        carrier.physical_address.city

    Still a plain dict under the hood — json.dumps(), .keys(), 'in', etc. all work.
    """

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(f"No field '{key}'")

    def __setattr__(self, key, value):
        self[key] = value

    def __delattr__(self, key):
        try:
            del self[key]
        except KeyError:
            raise AttributeError(f"No field '{key}'")

    def __repr__(self):
        cls = type(self).__name__
        # Show a compact preview for large objects
        keys = list(self.keys())
        if len(keys) <= 6:
            inner = ", ".join(f"{k}={self[k]!r}" for k in keys)
        else:
            shown = ", ".join(f"{k}={self[k]!r}" for k in keys[:4])
            inner = f"{shown}, ... +{len(keys) - 4} more"
        return f"{cls}({inner})"

    def to_dict(self):
        """Convert to a plain dict (recursively unwraps nested APIObjects)."""
        def _unwrap(v):
            if isinstance(v, APIObject):
                return {k: _unwrap(val) for k, val in v.items()}
            if isinstance(v, list):
                return [_unwrap(item) for item in v]
            return v
        return {k: _unwrap(v) for k, v in self.items()}

    def to_json(self, **kwargs):
        """Serialize to a JSON string. Accepts all json.dumps kwargs."""
        return json.dumps(self.to_dict(), **kwargs)

    @classmethod
    def from_response(cls, data):
        """Recursively wrap dicts/lists from an API response."""
        if isinstance(data, list):
            return [cls.from_response(item) for item in data]
        if isinstance(data, dict):
            return cls({k: cls.from_response(v) for k, v in data.items()})
        return data
