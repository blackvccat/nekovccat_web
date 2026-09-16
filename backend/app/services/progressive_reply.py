"""Public progress and provisional text; canonical final text always replaces it."""
import hashlib

from app.services.ai_errors import AIServiceError


def opaque_id(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()[:24]


class SecretRedactor:
    """Hold a possible secret prefix so no secret can leak across delta boundaries."""
    def __init__(self, secrets):
        self.secrets = sorted({value for value in secrets if value}, key=len, reverse=True)
        self.pending = ''

    def redact(self, text: str) -> str:
        for secret in self.secrets:
            text = text.replace(secret, '[已隐藏]')
        return text

    def feed(self, text: str) -> str:
        safe = self.redact(self.pending + text)
        held = 0
        for secret in self.secrets:
            for length in range(min(len(secret) - 1, len(safe)), held, -1):
                if safe.endswith(secret[:length]):
                    held = length
                    break
        self.pending = safe[-held:] if held else ''
        return safe[:-held] if held else safe

    def reset(self):
        self.pending = ''


class ProgressiveReply:
    def __init__(self, session_id: str, secrets, max_reply_bytes: int):
        self.session_id = session_id
        self.redactor = SecretRedactor(secrets)
        self.max_reply_bytes = max_reply_bytes
        self.attempt_id = ''
        self.message_id = 'reply-' + opaque_id(session_id + ':final')
        self.index = -1
        self.ended = False
        self.reply_bytes = 0
        self.last_progress = None
        self.legacy_generation = 0
        self.live_seen = False

    def progress(self, stage: str, message: str):
        key = stage, message
        if key == self.last_progress:
            return []
        self.last_progress = key
        return [{'event': 'progress', 'stage': stage, 'message': message}]

    def _start(self, attempt: str):
        if self.attempt_id == attempt:
            return []
        self.attempt_id = attempt
        self.message_id = 'reply-' + opaque_id(self.session_id + ':' + attempt)
        self.redactor.reset()
        self.reply_bytes = 0
        self.index = -1
        self.ended = False
        return self.progress('analyzing', '正在处理你的问题…')

    def _text(self, text: str):
        self.reply_bytes += len(text.encode('utf-8'))
        if self.reply_bytes > self.max_reply_bytes:
            raise AIServiceError('站内 Agent 的回复较长，请缩短问题后重试。', 502, 'response_limit')
        safe = self.redactor.feed(text)
        events = self.progress('answering', '正在生成回复…')
        if safe:
            events.append({'event': 'reply', 'phase': 'delta', 'message_id': self.message_id, 'content': safe})
        return events

    def feed(self, notification):
        if notification.payload.get('sessionId') != self.session_id:
            return []
        if notification.method == 'site.assistant':
            frame = notification.payload.get('frame') or {}
            if not isinstance(frame, dict):
                return []
            attempt = frame.get('attemptId')
            if not isinstance(attempt, str) or not attempt or len(attempt) > 256:
                return []
            kind = frame.get('type')
            if kind == 'start':
                self.live_seen = True
                return self._start(attempt)
            if attempt != self.attempt_id or self.ended:
                return []
            if kind == 'end':
                self.ended = True
                return []
            index = frame.get('index')
            if isinstance(index, bool) or not isinstance(index, int) or index <= self.index:
                return []
            self.index = index
            if kind == 'analyzing':
                return self.progress('analyzing', '正在分析问题…')
            if kind == 'text' and isinstance(frame.get('text'), str) and frame['text']:
                return self._text(frame['text'])
            return []
        if notification.method != 'session.event':
            return []
        event = notification.payload.get('event') or {}
        data = event.get('data') or {}
        # Older SDKs used durable chunk events. Never replay these when the
        # actual transient bridge is active, or text would be emitted twice.
        if not self.live_seen and event.get('type') in {'step/start', 'llm/retry-started', 'tool/call'}:
            self.legacy_generation += 1
        if event.get('type') != 'assistant/chunk' or self.live_seen:
            return []
        chunk = data.get('chunk') or {}
        if chunk.get('type') == 'reasoning-delta':
            return self.progress('analyzing', '正在分析问题…')
        if chunk.get('type') == 'text-delta' and isinstance(chunk.get('text'), str) and chunk['text']:
            coordinates = (data.get('turn'), data.get('step'), self.legacy_generation)
            events = self._start('legacy:' + str(coordinates))
            return [*events, *self._text(chunk['text'])]
        return []

    def final(self, canonical: str):
        self.redactor.reset()  # Never flush an abandoned draft's withheld tail.
        return {'event': 'reply', 'phase': 'final', 'message_id': self.message_id,
                'content': self.redactor.redact(canonical)}
