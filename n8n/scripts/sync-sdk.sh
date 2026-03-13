#!/usr/bin/env bash
#
# Vendors the TypeScript SDK source into the n8n node package.
# Run from repo root: bash n8n/scripts/sync-sdk.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SDK_SRC="$REPO_ROOT/typescript/src"
VENDOR_DST="$REPO_ROOT/n8n/nodes/AlphaLoops/sdk"

# ── Clean previous vendored code ──
rm -rf "$VENDOR_DST"
mkdir -p "$VENDOR_DST/resources"

# ── Helper: copy a file, strip .js from import paths ──
copy_and_fix() {
    local src="$1"
    local dst="$2"
    # Remove .js extensions from import paths (CJS doesn't need them)
    # Matches: from "./foo.js"  from "../foo.js"  from './foo.js'
    sed -E 's/from "([^"]+)\.js"/from "\1"/g; s/from '\''([^'\'']+)\.js'\''/from '\''\1'\''/g' "$src" > "$dst"
}

# ── Core files ──
copy_and_fix "$SDK_SRC/errors.ts"      "$VENDOR_DST/errors.ts"
copy_and_fix "$SDK_SRC/api-object.ts"  "$VENDOR_DST/api-object.ts"
copy_and_fix "$SDK_SRC/http-client.ts" "$VENDOR_DST/http-client.ts"

# ── Resource files (drop *Iter generators — n8n doesn't use them) ──
for resource in carriers fleet inspections crashes contacts; do
    src="$SDK_SRC/resources/$resource.ts"
    dst="$VENDOR_DST/resources/$resource.ts"

    # Copy, fix imports, then strip async generator methods (*Iter)
    copy_and_fix "$src" "$dst.tmp"

    # Remove async generator blocks: "async *methodIter(" through next "}" at indent level 1
    python3 -c "
import re, sys

with open('$dst.tmp') as f:
    text = f.read()

# Remove async *...Iter methods (2-space indented, method block ends with '  }')
text = re.sub(
    r'\n  async \*\w+Iter\([\s\S]*?\n  \}\n',
    '\n',
    text,
)

with open('$dst', 'w') as f:
    f.write(text)
" || {
        # Fallback: if python3 isn't available, just copy as-is (iter methods won't hurt)
        cp "$dst.tmp" "$dst"
    }
    rm -f "$dst.tmp"
done

# ── Client: custom slim version (no config/env resolution) ──
cat > "$VENDOR_DST/client.ts" << 'CLIENTEOF'
import { HTTPClient } from './http-client';
import { CarriersResource } from './resources/carriers';
import { ContactsResource } from './resources/contacts';
import { CrashesResource } from './resources/crashes';
import { FleetResource } from './resources/fleet';
import { InspectionsResource } from './resources/inspections';

const VERSION = '0.1.0';
const BASE_URL = 'https://api.runalphaloops.com';

export class AlphaLoops {
	private _http: HTTPClient;
	private _carriers?: CarriersResource;
	private _fleet?: FleetResource;
	private _inspections?: InspectionsResource;
	private _crashes?: CrashesResource;
	private _contacts?: ContactsResource;

	constructor(options: { apiKey: string; baseUrl?: string }) {
		this._http = new HTTPClient({
			baseUrl: options.baseUrl ?? BASE_URL,
			apiKey: options.apiKey,
			timeout: 30,
			maxRetries: 3,
			retryBaseDelay: 1.0,
			version: VERSION,
		});
	}

	get carriers(): CarriersResource {
		if (!this._carriers) this._carriers = new CarriersResource(this._http);
		return this._carriers;
	}

	get fleet(): FleetResource {
		if (!this._fleet) this._fleet = new FleetResource(this._http);
		return this._fleet;
	}

	get inspections(): InspectionsResource {
		if (!this._inspections) this._inspections = new InspectionsResource(this._http);
		return this._inspections;
	}

	get crashes(): CrashesResource {
		if (!this._crashes) this._crashes = new CrashesResource(this._http);
		return this._crashes;
	}

	get contacts(): ContactsResource {
		if (!this._contacts) this._contacts = new ContactsResource(this._http);
		return this._contacts;
	}
}
CLIENTEOF

echo "✓ Vendored SDK synced to $VENDOR_DST"
