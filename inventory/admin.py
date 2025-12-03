from django.contrib import admin

from .models import Gemstone


@admin.register(Gemstone)
class GemstoneAdmin(admin.ModelAdmin):
    list_display = ("sku", "stone_type", "weight_carat", "availability", "current_stage")
    list_filter = ("availability", "stone_type")
    search_fields = ("sku", "stone_type", "description")
    ordering = ("sku",)
