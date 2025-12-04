from django.apps import AppConfig


class ProductionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "production"

    def ready(self) -> None:  # pragma: no cover - called by Django
        from . import signals  # noqa: F401
