#!/usr/bin/env bash
set -euo pipefail

CAM="${CAM:-/dev/video0}"
VIDEO_SIZE="${VIDEO_SIZE:-1280x720}"
FPS="${FPS:-30}"
OUTPUT_DIR="${OUTPUT_DIR:-./camera_recordings}"
DURATION="${1:-0}"
OUTPUT_FILE="${2:-}"

usage() {
    echo "Usage: $0 [durasi_detik] [file_output.mkv]"
    echo "       durasi 0 berarti rekam sampai Ctrl+C."
}

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "ffmpeg tidak ditemukan. Install ffmpeg terlebih dahulu." >&2
    exit 1
fi

if [[ ! -c "$CAM" ]]; then
    echo "Kamera tidak ditemukan: $CAM" >&2
    exit 1
fi

if ! [[ "$DURATION" =~ ^[0-9]+$ ]]; then
    usage >&2
    exit 1
fi

echo "Mengecek kamera: $CAM"
if command -v v4l2-ctl >/dev/null 2>&1; then
    v4l2-ctl --all --device="$CAM" | sed -n '1,16p'
else
    echo "Info kamera (v4l2-ctl tidak tersedia):"
    ffmpeg -hide_banner -f v4l2 -list_formats all -i "$CAM" 2>&1 || true
fi

mkdir -p "$OUTPUT_DIR"

if [[ -z "$OUTPUT_FILE" ]]; then
    OUTPUT_FILE="$OUTPUT_DIR/camera_$(date +%Y%m%d_%H%M%S).mkv"
fi

LOG_FILE="${OUTPUT_FILE%.*}.log"
mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "Mulai rekam: $CAM"
echo "Output: $OUTPUT_FILE"
echo "Log: $LOG_FILE"
echo "Tekan Ctrl+C untuk menghentikan rekaman."

FFMPEG_ARGS=(
    -hide_banner
    -f v4l2
    -framerate "$FPS"
    -video_size "$VIDEO_SIZE"
    -i "$CAM"
    -c:v libx264
    -preset veryfast
    -crf 23
    -pix_fmt yuv420p
)

if [[ "$DURATION" != "0" ]]; then
    FFMPEG_ARGS+=( -t "$DURATION" )
fi

FFMPEG_PID=""
finish_recording() {
    trap - INT TERM HUP EXIT
    if [[ -n "$FFMPEG_PID" ]] && kill -0 "$FFMPEG_PID" 2>/dev/null; then
        echo "Menghentikan rekaman dengan aman..."
        kill -INT "$FFMPEG_PID" 2>/dev/null || true
        wait "$FFMPEG_PID" || true
    fi
    if [[ -f "$OUTPUT_FILE" ]]; then
        echo "Video tersimpan: $OUTPUT_FILE"
    fi
}

trap finish_recording INT TERM HUP EXIT
ffmpeg "${FFMPEG_ARGS[@]}" "$OUTPUT_FILE" > "$LOG_FILE" 2>&1 &
FFMPEG_PID=$!
wait "$FFMPEG_PID"
FFMPEG_PID=""

echo "Rekaman selesai: $OUTPUT_FILE"