"""Small compatibility boundary around the pinned official synchronous SDK."""
from contextlib import suppress
from deepseek_harness import DeepSeekHarness


class SiteHarness(DeepSeekHarness):
    def close(self):
        # SDK 0.1.5rc1 reaps its child and joins readers, but leaves stdout/stderr
        # file objects open. Keep this workaround here, covered by the real SDK
        # initialization test, until the upstream close implementation fixes it.
        process = getattr(self.client, "_proc", None)
        try:
            super().close()
        finally:
            if process is not None and process.poll() is not None:
                for pipe in (process.stdin, process.stdout, process.stderr):
                    if pipe is not None:
                        with suppress(OSError):
                            pipe.close()
