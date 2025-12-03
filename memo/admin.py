from django.contrib import admin

from .models import Memo, MemoLine


class MemoLineInline(admin.TabularInline):
    model = MemoLine
    extra = 0
    autocomplete_fields = ("gemstone",)


@admin.register(Memo)
class MemoAdmin(admin.ModelAdmin):
    list_display = ("reference", "counterparty", "issued_at", "due_at", "status")
    list_filter = ("status", "issued_at", "due_at")
    search_fields = ("reference", "counterparty", "notes")
    inlines = [MemoLineInline]
    ordering = ("-issued_at",)


@admin.register(MemoLine)
class MemoLineAdmin(admin.ModelAdmin):
    list_display = ("memo", "gemstone", "quantity", "memoed_weight", "returned_at")
    list_filter = ("returned_at",)
    search_fields = ("memo__reference", "gemstone__sku")
