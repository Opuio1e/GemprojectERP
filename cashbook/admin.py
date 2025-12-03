from django.contrib import admin

from .models import FinancialEntry


@admin.register(FinancialEntry)
class FinancialEntryAdmin(admin.ModelAdmin):
    list_display = (
        "entry_date",
        "entry_type",
        "amount",
        "description",
        "reference",
        "counterparty",
        "memo",
    )
    list_filter = ("entry_type", "entry_date")
    search_fields = ("description", "reference", "counterparty")
    date_hierarchy = "entry_date"
    ordering = ("-entry_date",)
