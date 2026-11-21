"""تفريغ تسجيل صوتي عربي إلى Markdown مع timestamps لكل مقطع (faster-whisper).

الاستخدام:
    python scripts/transcribe.py
    python scripts/transcribe.py --input docs/input/meeting.ogg --output docs/analysis/transcript_raw.md

اختيار الموديل:
    - GPU بـCUDA وذاكرة كافية (>= MIN_GPU_VRAM_MB) → large-v3 بـfloat16
    - غير ذلك → medium على CPU بـcompute_type="int8"
    إذا فشل التشغيل على الـGPU (مثلاً نقص مكتبات cuBLAS/cuDNN) يرجع تلقائياً إلى CPU.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# نقل xet (الافتراضي في huggingface_hub) يفشل على الاتصالات الضعيفة ولا يستأنف التنزيل.
# HTTP العادي يستأنف الملف الجزئي من حيث توقف. يجب ضبطه قبل استيراد huggingface_hub.
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

from faster_whisper import WhisperModel  # noqa: E402
from faster_whisper.utils import download_model  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "docs" / "input" / "meeting.ogg"
DEFAULT_OUTPUT = ROOT / "docs" / "analysis" / "transcript_raw.md"

# large-v3 بـfloat16 يحتاج قرابة 4.5 GB VRAM؛ نترك هامشاً.
MIN_GPU_VRAM_MB = 6000

GPU_CONFIG = ("large-v3", "cuda", "float16")
CPU_CONFIG = ("medium", "cpu", "int8")


def gpu_vram_mb() -> int:
    """أكبر ذاكرة GPU متاحة بالـMB حسب nvidia-smi، أو 0 إذا لا يوجد GPU."""
    if shutil.which("nvidia-smi") is None:
        return 0
    try:
        out = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, check=True, timeout=10,
        ).stdout
        values = [int(v) for v in out.split() if v.strip().isdigit()]
        return max(values, default=0)
    except (subprocess.SubprocessError, OSError, ValueError):
        return 0


def cuda_available() -> bool:
    try:
        import ctranslate2
        return ctranslate2.get_cuda_device_count() > 0
    except Exception:
        return False


def pick_config() -> tuple[str, str, str]:
    vram = gpu_vram_mb()
    if cuda_available() and vram >= MIN_GPU_VRAM_MB:
        print(f"GPU مع {vram} MB → large-v3", flush=True)
        return GPU_CONFIG
    if vram:
        print(f"GPU موجود لكن ذاكرته {vram} MB (< {MIN_GPU_VRAM_MB}) أو CUDA غير متاح → CPU", flush=True)
    else:
        print("لا يوجد GPU → CPU", flush=True)
    return CPU_CONFIG


def fmt_ts(seconds: float) -> str:
    total = int(seconds)
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def fetch_model(model_name: str, attempts: int = 20) -> str:
    """ينزّل الموديل مع إعادة المحاولة؛ كل محاولة تستأنف من حيث توقفت السابقة."""
    for attempt in range(1, attempts + 1):
        try:
            return download_model(model_name)
        except Exception as exc:
            if attempt == attempts:
                raise
            wait = min(60, 5 * attempt)
            print(f"فشل تنزيل الموديل (محاولة {attempt}/{attempts}): {exc}\nإعادة المحاولة بعد {wait} ثانية...", flush=True)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def transcribe(audio: Path, model_name: str, device: str, compute_type: str):
    print(f"تنزيل/تحميل الموديل {model_name} ({device}, {compute_type})...", flush=True)
    model_path = fetch_model(model_name)
    model = WhisperModel(model_path, device=device, compute_type=compute_type)
    started = time.time()  # وقت التفريغ فقط، بدون تنزيل الموديل
    segments_iter, info = model.transcribe(
        str(audio),
        language="ar",
        task="transcribe",
        beam_size=5,
        vad_filter=True,
        condition_on_previous_text=False,  # يقلل حلقات التكرار في الكلام العامي
    )
    segments = []
    for seg in segments_iter:
        text = seg.text.strip()
        segments.append((seg.start, seg.end, text))
        print(f"[{fmt_ts(seg.start)} → {fmt_ts(seg.end)}] {text}", flush=True)
    return segments, info, time.time() - started


def write_markdown(output: Path, audio: Path, segments, info, model_name, device, compute_type, elapsed):
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        audio_ref = audio.relative_to(ROOT).as_posix()
    except ValueError:
        audio_ref = str(audio)
    lines = [
        "# تفريغ خام — اجتماع المجلس",
        "",
        "> تفريغ آلي بدون أي تعديل يدوي. النسخة المصححة في `transcript_clean.md`.",
        "",
        f"- **الملف:** `{audio_ref}`",
        f"- **المدة:** {fmt_ts(info.duration)}",
        f"- **الموديل:** faster-whisper `{model_name}` — device=`{device}`, compute_type=`{compute_type}`",
        '- **الإعدادات:** language="ar", beam_size=5, vad_filter=True, condition_on_previous_text=False',
        f"- **عدد المقاطع:** {len(segments)}",
        f"- **وقت المعالجة:** {elapsed / 60:.1f} دقيقة",
        f"- **التاريخ:** {datetime.now():%Y-%m-%d %H:%M}",
        "",
        "## النص",
        "",
    ]
    for start, end, text in segments:
        lines.append(f"`[{fmt_ts(start)} → {fmt_ts(end)}]` {text}")
        lines.append("")
    output.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--model", help="تجاوز الاختيار التلقائي للموديل (مثلاً small)")
    parser.add_argument("--device", choices=["cpu", "cuda"], help="تجاوز الاختيار التلقائي للجهاز")
    parser.add_argument("--compute-type", help="تجاوز compute_type (مثلاً int8، float16)")
    args = parser.parse_args()

    audio = args.input.resolve()
    if not audio.is_file():
        print(f"الملف غير موجود: {audio}", file=sys.stderr)
        return 1

    if args.device:
        model_name, device, compute_type = GPU_CONFIG if args.device == "cuda" else CPU_CONFIG
    else:
        model_name, device, compute_type = pick_config()
    model_name = args.model or model_name
    compute_type = args.compute_type or compute_type

    try:
        segments, info, elapsed = transcribe(audio, model_name, device, compute_type)
    except Exception as exc:  # فشل الـGPU (مكتبات CUDA ناقصة، ذاكرة غير كافية...)
        if device != "cuda":
            raise
        print(f"فشل التشغيل على GPU: {exc}\nالرجوع إلى CPU...", flush=True)
        _, device, compute_type = CPU_CONFIG
        model_name = args.model or CPU_CONFIG[0]
        segments, info, elapsed = transcribe(audio, model_name, device, compute_type)

    write_markdown(args.output.resolve(), audio, segments, info, model_name, device, compute_type, elapsed)
    print(f"\nتم: {len(segments)} مقطع في {elapsed / 60:.1f} دقيقة → {args.output}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
