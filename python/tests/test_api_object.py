"""Tests for APIObject dict wrapper with dot-access."""

import json

import pytest

from alphaloops.freight.api_object import APIObject


class TestDotAccess:
    def test_get_attribute(self):
        obj = APIObject({"name": "Acme", "dot_number": "123"})
        assert obj.name == "Acme"
        assert obj.dot_number == "123"

    def test_missing_attribute_raises(self):
        obj = APIObject({"name": "Acme"})
        with pytest.raises(AttributeError, match="No field 'missing'"):
            _ = obj.missing

    def test_set_attribute(self):
        obj = APIObject()
        obj.foo = "bar"
        assert obj["foo"] == "bar"
        assert obj.foo == "bar"

    def test_del_attribute(self):
        obj = APIObject({"x": 1})
        del obj.x
        assert "x" not in obj

    def test_del_missing_raises(self):
        obj = APIObject()
        with pytest.raises(AttributeError, match="No field 'y'"):
            del obj.y


class TestNestedWrapping:
    def test_from_response_wraps_nested_dict(self):
        data = {"carrier": {"address": {"city": "Dallas", "state": "TX"}}}
        obj = APIObject.from_response(data)
        assert isinstance(obj, APIObject)
        assert isinstance(obj.carrier, APIObject)
        assert isinstance(obj.carrier.address, APIObject)
        assert obj.carrier.address.city == "Dallas"

    def test_from_response_wraps_list_of_dicts(self):
        data = [{"id": 1}, {"id": 2}]
        result = APIObject.from_response(data)
        assert isinstance(result, list)
        assert len(result) == 2
        assert all(isinstance(item, APIObject) for item in result)
        assert result[0].id == 1

    def test_from_response_preserves_scalars(self):
        assert APIObject.from_response(42) == 42
        assert APIObject.from_response("hello") == "hello"
        assert APIObject.from_response(None) is None

    def test_from_response_mixed_list(self):
        data = {"records": [{"a": 1}, "plain", 3]}
        obj = APIObject.from_response(data)
        assert isinstance(obj.records[0], APIObject)
        assert obj.records[1] == "plain"
        assert obj.records[2] == 3


class TestDictBehavior:
    def test_keys_values_items(self):
        obj = APIObject({"a": 1, "b": 2})
        assert set(obj.keys()) == {"a", "b"}
        assert set(obj.values()) == {1, 2}

    def test_in_operator(self):
        obj = APIObject({"name": "Acme"})
        assert "name" in obj
        assert "missing" not in obj

    def test_get_with_default(self):
        obj = APIObject({"a": 1})
        assert obj.get("a") == 1
        assert obj.get("b", "default") == "default"

    def test_json_serializable(self):
        obj = APIObject({"name": "Acme", "count": 5})
        dumped = json.dumps(obj)
        assert '"name": "Acme"' in dumped

    def test_len(self):
        obj = APIObject({"a": 1, "b": 2, "c": 3})
        assert len(obj) == 3


class TestRepr:
    def test_small_object_repr(self):
        obj = APIObject({"a": 1, "b": 2})
        r = repr(obj)
        assert r.startswith("APIObject(")
        assert "a=1" in r
        assert "b=2" in r

    def test_large_object_repr_truncated(self):
        obj = APIObject({f"k{i}": i for i in range(10)})
        r = repr(obj)
        assert "... +6 more" in r
