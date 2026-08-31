from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "astro_portal",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.automation", "app.tasks.messaging"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "scan-due-follow-ups-every-15-minutes": {
            "task": "automation.scan_due_follow_ups",
            "schedule": 900.0,
        }
    },
)
