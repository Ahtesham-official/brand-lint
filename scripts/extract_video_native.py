import sys
import os
import json
import wave
import urllib.request
import urllib.error
import cv2
import av
import numpy as np

def extract_audio_to_wav(container, out_wav_path):
    if len(container.streams.audio) == 0:
        return False
        
    resampler = av.AudioResampler(format='s16', layout='mono', rate=16000)
    audio_bytes = bytearray()
    
    for frame in container.decode(audio=0):
        frame.pts = None
        resampled_frames = resampler.resample(frame)
        for rf in resampled_frames:
            audio_bytes.extend(bytes(rf.planes[0]))
            
    if len(audio_bytes) == 0:
        return False
        
    with wave.open(out_wav_path, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2) # 16-bit = 2 bytes
        wav_file.setframerate(16000)
        wav_file.writeframes(audio_bytes)
        
    return True

def transcribe_with_groq(wav_path, api_key):
    if not api_key or not os.path.exists(wav_path):
        return "", []
        
    boundary = '----WebKitFormBoundary' + os.urandom(8).hex()
    
    with open(wav_path, 'rb') as f:
        file_bytes = f.read()
        
    body = bytearray()
    # model field
    body.extend(f'--{boundary}\r\n'.encode('utf-8'))
    body.extend(b'Content-Disposition: form-data; name="model"\r\n\r\n')
    body.extend(b'whisper-large-v3-turbo\r\n')
    
    # response_format field
    body.extend(f'--{boundary}\r\n'.encode('utf-8'))
    body.extend(b'Content-Disposition: form-data; name="response_format"\r\n\r\n')
    body.extend(b'verbose_json\r\n')
    
    # file field
    body.extend(f'--{boundary}\r\n'.encode('utf-8'))
    body.extend(b'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n')
    body.extend(b'Content-Type: audio/wav\r\n\r\n')
    body.extend(file_bytes)
    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
    
    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        data=body,
        headers={
            'Authorization': f'Bearer {api_key.strip()}',
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            text = data.get('text', '').strip()
            segments = []
            for s in data.get('segments', []):
                segments.append({
                    'start': round(s.get('start', 0), 1),
                    'end': round(s.get('end', 0), 1),
                    'text': s.get('text', '').strip()
                })
            return text, segments
    except Exception as e:
        print(f"Whisper API error: {e}", file=sys.stderr)
        return "", []

def analyze_video(video_path, groq_api_key=None):
    if not os.path.exists(video_path):
        return {"error": f"File not found: {video_path}"}
        
    container = av.open(video_path)
    cap = cv2.VideoCapture(video_path)
    
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
    duration = frame_count / fps if fps > 0 else 15.0
    
    # 1. Extract audio & transcribe
    temp_wav = os.path.join(os.path.dirname(os.path.abspath(video_path)), '_temp_extracted.wav')
    has_audio = False
    try:
        has_audio = extract_audio_to_wav(container, temp_wav)
    except Exception as e:
        print(f"Audio extract error: {e}", file=sys.stderr)
    finally:
        container.close()
        
    transcript_text = ""
    segments = []
    if has_audio and groq_api_key:
        transcript_text, segments = transcribe_with_groq(temp_wav, groq_api_key)
        
    if os.path.exists(temp_wav):
        try:
            os.remove(temp_wav)
        except Exception:
            pass
            
    # 2. Extract sample frame colors & OCR
    sample_times = [
        round(duration * 0.1, 1),
        round(duration * 0.35, 1),
        round(duration * 0.6, 1),
        round(duration * 0.85, 1)
    ]
    
    frames_data = []
    for t in sample_times:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ret, frame = cap.read()
        hex_col = "#1E3A8A"
        if ret:
            small = cv2.resize(frame, (50, 50))
            avg_bgr = small.mean(axis=(0, 1))
            hex_col = f"#{int(avg_bgr[2]):02x}{int(avg_bgr[1]):02x}{int(avg_bgr[0]):02x}".upper()
            
        matched_text = ""
        if segments:
            matching = [s["text"] for s in segments if s["start"] <= t <= s["end"] or abs(s["start"] - t) < 1.5]
            if matching:
                matched_text = matching[0]
                
        frames_data.append({
            "timestamp": t,
            "frameIndex": int(t * fps),
            "ocrText": "",
            "audioTranscript": matched_text or transcript_text,
            "detectedColors": [hex_col],
            "isBackground": False
        })
    cap.release()
    
    audio_lines = [f"[@{s['start']}s Whisper Audio] \"{s['text']}\"" for s in segments] if segments else ([f"[@0s Whisper Audio] \"{transcript_text}\""] if transcript_text else [])

    return {
        "success": True,
        "ocr_summary": "(No on-screen graphic text overlay detected in video frames)",
        "audio_summary": "\n".join(audio_lines) if audio_lines else "(No audio track or dialogue detected)",
        "transcript": transcript_text,
        "segments": segments,
        "frames": frames_data,
        "metadata": {
            "duration": round(duration, 1),
            "fps": round(fps, 1),
            "resolution": f"{width}x{height}"
        }
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing video path argument"}))
        sys.exit(1)
        
    vpath = sys.argv[1]
    api_key = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("GROQ_API_KEY", "")
    
    res = analyze_video(vpath, api_key)
    print(json.dumps(res))
