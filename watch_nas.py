#!/usr/bin/env python3
"""
ForumAuto AI Platform - NAS監視スクリプト
watch_nas.py

役割: NASDXPの forumauto/03_YouTube/ を監視し、
      新しい動画ファイルを検出したら Supabase Edge Function に通知する。

実行環境:
  - UGREEN NASync DXP4800 Plus の Task Scheduler または
  - 常駐PCでの cronジョブ
  - Python 3.8+

必要ライブラリ:
  pip install requests watchdog ffmpeg-python

設定:
  watch_nas.py の CONFIG を編集してください。
"""

import os
import json
import time
import hashlib
import logging
import subprocess
from datetime import datetime
from pathlib import Path

# サードパーティ（pip install requests）
try:
    import requests
except ImportError:
    print("pip install requests が必要です")
    exit(1)

# ============================================================
# 設定（ここだけ変えればOK）
# ============================================================
CONFIG = {
    # NAS監視対象フォルダ（実際のNASパスに変更）
    "watch_dir":"/home/forumautojfs1/forumauto/03_YouTube",

    # 処理済みファイルの出力先
    "output_dir":"/home/forumautojfs1/forumauto/03_YouTube/_processed",

    # 処理済みリスト（重複処理防止）
    "processed_log":"/home/forumautojfs1/forumauto/.processed_videos.json"

    # Supabase Edge Function URL（APIキーはサーバー側で管理）
    "supabase_url": "https://uhppgdwbyrijnqpvusxw.supabase.co",
    "supabase_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHBnZHdieXJpam5xcHZ1c3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY0MDg5NzMsImV4cCI6MjAxMTk4NDk3M30.rEIEPBGMBTMwXQFCQJJ4wKPDC5oNmu_DK60",

    # 対象拡張子
    "extensions": [".mp4", ".mov", ".avi", ".MP4", ".MOV"],

    # 最小ファイルサイズ（バイト）= 10MB
    "min_size": 10 * 1024 * 1024,

    # 最長動画（秒）= 10分以上はスキップ
    "max_duration": 600,

    # スキャン間隔（秒）
    "scan_interval": 1800,  # 30分

    # ログファイル
    "log_file": "/home/forumautojfs1/forumauto/logs/watch_nas.log"
}

# ============================================================
# ログ設定
# ============================================================
os.makedirs(os.path.dirname(CONFIG["log_file"]), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(CONFIG["log_file"], encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ============================================================
# 処理済みリスト管理
# ============================================================
def load_processed() -> set:
    if not os.path.exists(CONFIG["processed_log"]):
        return set()
    try:
        with open(CONFIG["processed_log"], "r", encoding="utf-8") as f:
            return set(json.load(f))
    except Exception:
        return set()

def save_processed(processed: set):
    with open(CONFIG["processed_log"], "w", encoding="utf-8") as f:
        json.dump(list(processed), f, ensure_ascii=False, indent=2)

def file_hash(path: str) -> str:
    """ファイルの先頭1MBのハッシュ（高速一意識別）"""
    h = hashlib.md5()
    with open(path, "rb") as f:
        h.update(f.read(1024 * 1024))
    return h.hexdigest()

# ============================================================
# 動画情報取得（ffprobe）
# ============================================================
def get_video_info(path: str) -> dict:
    """FFprobeで動画メタデータを取得"""
    try:
        cmd = [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_format", "-show_streams",
            path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        info = json.loads(result.stdout)

        streams = info.get("streams", [])
        video_stream = next((s for s in streams if s.get("codec_type") == "video"), {})
        fmt = info.get("format", {})

        return {
            "duration": float(fmt.get("duration", 0)),
            "size": int(fmt.get("size", 0)),
            "width": int(video_stream.get("width", 0)),
            "height": int(video_stream.get("height", 0)),
            "codec": video_stream.get("codec_name", ""),
            "fps": eval(video_stream.get("r_frame_rate", "30/1")),
            "bitrate": int(fmt.get("bit_rate", 0)),
        }
    except Exception as e:
        log.warning(f"ffprobe失敗 ({path}): {e}")
        return {}

# ============================================================
# Supabase Edge Functionへの通知
# ============================================================
def notify_pipeline(action: str, payload: dict) -> dict:
    """Supabase Edge Functionにリクエスト送信"""
    url = f"{CONFIG['supabase_url']}/functions/v1/shorts-pipeline?action={action}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CONFIG['supabase_key']}",
    }
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=60)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        log.error(f"Edge Function呼び出し失敗 ({action}): {e}")
        return {"error": str(e)}

# ============================================================
# 個人情報保護処理（FFmpeg）
# ============================================================
def apply_privacy_protection(input_path: str, output_path: str, video_info: dict) -> bool:
    """
    音声クリーニング + 縦動画変換
    ナンバー・顔ぼかしはEdge FunctionのYOLO検出結果を使用（別ステップ）
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # ステップ1: 音声クリーニング（会話・雑音除去）
    audio_clean_path = output_path.replace(".mp4", "_audio.mp4")
    cmd_audio = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-af", "highpass=f=200,lowpass=f=8000,afftdn=nf=-25,agate=threshold=-30dB",
        "-c:v", "copy",
        audio_clean_path,
    ]

    log.info(f"音声クリーニング開始: {os.path.basename(input_path)}")
    result = subprocess.run(cmd_audio, capture_output=True, timeout=300)
    if result.returncode != 0:
        log.error(f"音声処理失敗: {result.stderr.decode()}")
        return False

    # ステップ2: 縦動画変換（9:16, 最大45秒）
    w, h = video_info.get("width", 1920), video_info.get("height", 1080)

    # 縦動画変換フィルター（元が横なら回転・クロップ）
    if w > h:
        # 横動画 → 縦クロップ（中央を使用）
        vf = f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    else:
        # 既に縦動画
        vf = "scale=1080:1920"

    cmd_shorts = [
        "ffmpeg", "-y",
        "-i", audio_clean_path,
        "-vf", vf,
        "-t", "45",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium",
        "-c:a", "aac", "-b:a", "128k",
        output_path,
    ]

    log.info("縦動画変換開始...")
    result = subprocess.run(cmd_shorts, capture_output=True, timeout=300)
    if result.returncode != 0:
        log.error(f"変換失敗: {result.stderr.decode()}")
        return False

    # 中間ファイルを削除
    if os.path.exists(audio_clean_path):
        os.remove(audio_clean_path)

    log.info(f"変換完了: {os.path.basename(output_path)}")
    return True

# ============================================================
# ブランドオーバーレイ追加（テロップ）
# ============================================================
def add_brand_overlay(input_path: str, output_path: str, title: str, duration: float) -> bool:
    """FFmpegでFORUM AUTOブランドテロップを追加"""

    # フォント設定（NASにfontがない場合はデフォルト使用）
    font_path = "/volume1/forumauto/assets/NotoSansJP-Bold.otf"
    font_opt = f"fontfile={font_path}:" if os.path.exists(font_path) else ""

    # オープニング（0〜3秒）
    opening = (
        f"drawtext={font_opt}text='FORUM AUTO':"
        f"fontcolor=0xb8960c:fontsize=52:"
        f"x=(w-text_w)/2:y=90:enable='between(t,0,3)'"
    )
    # サブタイトル
    subtitle = (
        f"drawtext={font_opt}text='外車・高級車の鈑金塗装専門':"
        f"fontcolor=white:fontsize=24:"
        f"x=(w-text_w)/2:y=158:enable='between(t,0,3)'"
    )
    # クロージング（最後5秒）
    t_start = max(0, duration - 5)
    closing = (
        f"drawtext={font_opt}text='☎ 0538-49-0632 / 袋井市下山梨545':"
        f"fontcolor=white:fontsize=22:"
        f"x=(w-text_w)/2:y=h-110:enable='between(t,{t_start},{duration})'"
    )
    # ボトムバー（常時）
    bottom_bar = (
        f"drawtext={font_opt}text='ForumAuto.jp':"
        f"fontcolor=0xb8960c:fontsize=18:"
        f"x=(w-text_w)/2:y=h-60"
    )

    vf = ",".join([opening, subtitle, closing, bottom_bar])

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", vf,
        "-c:a", "copy",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, timeout=300)
    return result.returncode == 0

# ============================================================
# メイン処理（1ファイル）
# ============================================================
def process_video(file_path: str) -> bool:
    """1本の動画を処理"""
    log.info(f"処理開始: {file_path}")

    # 動画情報取得
    info = get_video_info(file_path)
    if not info:
        log.warning(f"動画情報取得失敗: {file_path}")
        return False

    duration = info.get("duration", 0)
    if duration > CONFIG["max_duration"]:
        log.info(f"スキップ（長すぎる: {duration:.0f}秒）: {file_path}")
        return False

    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)

    # ① Edge Functionに登録
    log.info("① Supabaseに動画登録中...")
    reg_result = notify_pipeline("register", {
        "filePath": file_path,
        "fileName": file_name,
        "fileSize": file_size,
        "duration": duration,
        "resolution": f"{info.get('width')}x{info.get('height')}",
        "carInfo": {},  # 将来: AI車種認識
    })

    video_id = reg_result.get("id")
    if not video_id:
        log.error(f"登録失敗: {reg_result}")
        return False

    log.info(f"登録完了: ID={video_id}")

    # ② AI解析（ナレーション・タイトル生成）
    log.info("② AI解析中（Claude）...")
    analyze_result = notify_pipeline("analyze", {
        "videoId": video_id,
        "sceneDescription": f"修理工程動画（{duration:.0f}秒）",
        "carModel": "外車",
        "damageDescription": "鈑金塗装修理",
    })
    log.info(f"AI解析完了: {analyze_result.get('analysis', {}).get('title', '—')}")

    # ③ 個人情報保護処理（FFmpeg）
    log.info("③ 個人情報保護処理中...")
    out_dir = CONFIG["output_dir"]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(out_dir, f"short_{video_id}_{timestamp}.mp4")

    ok = apply_privacy_protection(file_path, output_path, info)
    if not ok:
        log.error("個人情報保護処理失敗")
        return False

    # ④ ブランドオーバーレイ
    log.info("④ ブランドテロップ追加中...")
    final_path = output_path.replace(".mp4", "_final.mp4")
    title = analyze_result.get("analysis", {}).get("title", "FORUM AUTO 修理動画")
    add_brand_overlay(output_path, final_path, title, min(duration, 45))

    # ⑤ ElevenLabsナレーション生成（Edge Function経由）
    narration = analyze_result.get("analysis", {}).get("narration", "")
    if narration:
        log.info("⑤ ナレーション音声生成中（ElevenLabs）...")
        voice_result = notify_pipeline("generate_voice", {
            "videoId": video_id,
            "narrationText": narration,
            "charKey": "aika",  # デフォルトは愛華
        })
        if voice_result.get("success"):
            log.info(f"ナレーション生成完了: {voice_result.get('audioPath')}")
        else:
            log.warning(f"ナレーション生成失敗: {voice_result.get('error')}")

    # ⑥ 承認キューへ
    log.info("⑥ 承認待ちキューに登録中...")
    compose_result = notify_pipeline("compose", {"videoId": video_id})
    log.info(f"承認キュー登録完了: {compose_result.get('message', '—')}")

    return True

# ============================================================
# フォルダスキャン
# ============================================================
def scan_folder():
    """監視フォルダをスキャンして新規動画を処理"""
    watch_dir = CONFIG["watch_dir"]
    if not os.path.exists(watch_dir):
        log.warning(f"監視フォルダが存在しません: {watch_dir}")
        return

    processed = load_processed()
    new_count = 0

    for ext in CONFIG["extensions"]:
        for path in Path(watch_dir).rglob(f"*{ext}"):
            path_str = str(path)

            # スキップ条件
            if "_processed" in path_str or path_str in processed:
                continue
            if path.stat().st_size < CONFIG["min_size"]:
                continue

            # ファイルハッシュで識別
            fh = file_hash(path_str)
            if fh in processed:
                continue

            log.info(f"新規動画検出: {path.name}")
            try:
                success = process_video(path_str)
                if success:
                    processed.add(fh)
                    processed.add(path_str)
                    save_processed(processed)
                    new_count += 1
            except Exception as e:
                log.error(f"処理エラー ({path.name}): {e}")

    log.info(f"スキャン完了: {new_count}件処理")

# ============================================================
# メインループ
# ============================================================
if __name__ == "__main__":
    log.info("ForumAuto NAS監視スクリプト 起動")
    log.info(f"監視フォルダ: {CONFIG['watch_dir']}")
    log.info(f"スキャン間隔: {CONFIG['scan_interval']}秒")

    while True:
        try:
            scan_folder()
        except Exception as e:
            log.error(f"スキャンエラー: {e}")

        log.info(f"次回スキャンまで {CONFIG['scan_interval']}秒待機...")
        time.sleep(CONFIG["scan_interval"])
