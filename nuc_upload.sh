#!/usr/bin/env bash
# Send a camera frame from the NUC straight to Supabase -- no Next.js API in the path.
# camera-feeds-panel.tsx subscribes to INSERTs on image_mission and renders row.image_url
# directly, so a Storage public URL is all the dashboard needs.
#
# Usage:  ./nuc_upload.sh SL [photo.jpg]     # captures from $CAM if no file given
#         ./nuc_upload.sh --check           # verify credentials, table and bucket
set -euo pipefail

: "${SUPABASE_URL:?set SUPABASE_URL (https://<ref>.supabase.co)}"
: "${SUPABASE_KEY:?set SUPABASE_KEY}"
BUCKET="${BUCKET:-mission-images}"
CAM="${CAM:-/dev/video0}"

api() { curl -sS -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" "$@"; }

if [ "${1:-}" = "--check" ]; then
    code=$(api -o /dev/null -w '%{http_code}' \
        "$SUPABASE_URL/rest/v1/image_mission?select=image_slot_name&limit=1")
    [ "$code" = 200 ] && echo "table image_mission: OK" || { echo "table image_mission: HTTP $code" >&2; exit 1; }
    code=$(api -o /dev/null -w '%{http_code}' "$SUPABASE_URL/storage/v1/bucket/$BUCKET")
    [ "$code" = 200 ] && echo "bucket $BUCKET: OK" || { echo "bucket $BUCKET: HTTP $code" >&2; exit 1; }
    exit 0
fi

SLOT="${1:?usage: $0 <SL|UL|SR|UR> [photo.jpg]   ($0 --check to verify config)}"
case "$SLOT" in SL|UL|SR|UR) ;; *) echo "slot must be SL, UL, SR or UR" >&2; exit 1 ;; esac

FILE="${2:-}"
if [ -z "$FILE" ]; then
    FILE=$(mktemp /tmp/camera_XXXXXX.jpg)
    trap 'rm -f "$FILE"' EXIT
    ffmpeg -loglevel error -y -f v4l2 -i "$CAM" -frames:v 1 "$FILE"
fi

# Same {epoch_ms}-camera_{SLOT}.jpg convention the web upload route already writes.
NAME="$(date +%s%3N)-camera_${SLOT}.jpg"

api -X POST -H "Content-Type: image/jpeg" --data-binary "@$FILE" \
    "$SUPABASE_URL/storage/v1/object/$BUCKET/$NAME" > /dev/null

URL="$SUPABASE_URL/storage/v1/object/public/$BUCKET/$NAME"

api -X POST -H "Content-Type: application/json" -H "Prefer: return=minimal" \
    -d "{\"image_slot_name\":\"$SLOT\",\"image_url\":\"$URL\"}" \
    "$SUPABASE_URL/rest/v1/image_mission" > /dev/null

echo "$SLOT -> $URL"
