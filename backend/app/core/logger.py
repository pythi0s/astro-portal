"""Structured logging setup for Astro Portal.

Outputs JSON lines to stdout so any log aggregator (CloudWatch, Datadog,
Loki, ELK) can ingest without configuration.

Usage:
    from app.core.logger import get_logger
    logger = get_logger(__name__)
    logger.info("customer created", extra={"customer_id": 42})

The request-correlation middleware in app/main.py injects a per-request UUID
into the logging context automatically, so every log line emitted within a
request handler carries `request_id` without any extra code.
"""

from __future__ import annotations

import json
import logging
import sys
import time
from typing import Any


class _JsonFormatter(logging.Formatter):
    """Emit one JSON object per log record."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Include any extra= fields the caller attached
        for key, val in record.__dict__.items():
            if key not in (
                "args", "created", "exc_info", "exc_text", "filename",
                "funcName", "levelname", "levelno", "lineno", "message",
                "module", "msecs", "msg", "name", "pathname", "process",
                "processName", "relativeCreated", "stack_info", "taskName",
                "thread", "threadName",
            ):
                payload[key] = val
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(level: str = "INFO") -> None:
    """Call once at application startup (done in main.py lifespan)."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
