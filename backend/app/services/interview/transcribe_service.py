"""
Audio transcription via Gemini's documented audio-understanding capability:
send the audio inline (base64) to generateContent with a transcription
prompt. There is no separate "Gemini Transcribe API" - this is the real
mechanism Google's own docs describe for turning audio into text with Gemini.

duration_seconds is NOT computed here from the audio bytes (that would need
an audio-parsing dependency like ffmpeg/pydub, which this project doesn't
have). The frontend measures recording duration client-side via
MediaRecorder's own timer and passes it through; this service just echoes
it back.
"""
import base64

from app.services.interview.gemini_utils import call_gemini, extract_json, InterviewGeminiError

TRANSCRIBE_PROMPT = """Transcribe this audio recording of a spoken interview answer.

The speaker may use English, Hindi, or Hinglish (code-mixed Hindi-English). Transcribe in the language(s) actually spoken - do not translate to English if the speaker used Hindi or Hinglish.

Remove obvious filler words (um, uh, like, you know, matlab, basically used as a verbal tic) where you can clearly identify them, but preserve the candidate's actual meaning and any technical terms exactly as spoken.

If the audio contains no discernible speech (silence, noise only), return an empty transcript rather than guessing.

Return ONLY this JSON shape:
{"transcript": "...", "language": "en" or "hi" or "hinglish" or "other"}

No markdown, no commentary, no code fences.
"""

# Conservative cap to keep the inline base64 payload well under Gemini's
# request size limits - 90s of webm/opus audio is a few hundred KB, this
# leaves generous headroom without needing the separate Files API.
MAX_AUDIO_BYTES = 15 * 1024 * 1024  # 15 MB


def transcribe_audio(audio_bytes: bytes, mime_type: str, duration_seconds: int = None) -> dict:
    if not audio_bytes:
        raise InterviewGeminiError("No audio data received.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise InterviewGeminiError("Recording is too large to transcribe. Please keep answers under 90 seconds.")

    encoded = base64.b64encode(audio_bytes).decode("utf-8")
    parts = [
        {"text": TRANSCRIBE_PROMPT},
        {"inline_data": {"mime_type": mime_type, "data": encoded}},
    ]

    raw_response = call_gemini(parts, response_json=True, temperature=0.1, timeout=60)
    parsed = extract_json(raw_response)

    transcript = parsed.get("transcript", "")
    language = parsed.get("language")

    if not isinstance(transcript, str):
        raise InterviewGeminiError("Gemini returned an unexpected transcription format.")

    return {
        "transcript": transcript.strip(),
        "language": language,
        "duration_seconds": duration_seconds,
    }
