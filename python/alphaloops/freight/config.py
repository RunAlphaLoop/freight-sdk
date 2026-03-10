"""Configuration resolution: explicit arg → env var → config file."""

import json
import os


def resolve_config(api_key=None, base_url=None):
    """Return (api_key, base_url) using layered resolution.

    Priority:
        1. Explicit arguments
        2. Environment variables (ALPHALOOPS_API_KEY, ALPHALOOPS_BASE_URL)
        3. Config file (~/.alphaloops) — JSON or key=value format
    """
    default_base_url = "https://api.runalphaloops.com"

    # Layer 1: explicit args
    resolved_key = api_key
    resolved_url = base_url

    # Layer 2: env vars
    if not resolved_key:
        resolved_key = os.environ.get("ALPHALOOPS_API_KEY")
    if not resolved_url:
        resolved_url = os.environ.get("ALPHALOOPS_BASE_URL")

    # Layer 3: config file
    if not resolved_key or not resolved_url:
        file_config = _read_config_file()
        if not resolved_key:
            resolved_key = file_config.get("api_key")
        if not resolved_url:
            resolved_url = file_config.get("base_url")

    return resolved_key, resolved_url or default_base_url


def _read_config_file():
    """Read ~/.alphaloops config file. Supports JSON and key=value formats."""
    path = os.path.expanduser("~/.alphaloops")
    if not os.path.isfile(path):
        return {}

    try:
        with open(path) as f:
            text = f.read().strip()
    except OSError:
        return {}

    if not text:
        return {}

    # Try JSON first
    if text.startswith("{"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    # Fall back to key=value
    config = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip().lower()
        value = value.strip().strip("'\"")
        # Normalize key names
        if key in ("api_key", "alphaloops_api_key"):
            config["api_key"] = value
        elif key in ("base_url", "alphaloops_base_url"):
            config["base_url"] = value
    return config
