from django.contrib import admin

from .models import ProcessStage


@admin.register(ProcessStage)
class ProcessStageAdmin(admin.ModelAdmin):
    list_display = ("gemstone", "stage", "started_at", "completed_at", "artisan")
    list_filter = ("stage", "started_at", "completed_at")
    search_fields = ("gemstone__sku", "artisan", "notes")
    autocomplete_fields = ("gemstone",)
    ordering = ("-started_at",)
