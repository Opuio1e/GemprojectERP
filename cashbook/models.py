from django.db import models

from memo.models import Memo


class FinancialEntry(models.Model):
    class EntryType(models.TextChoices):
        DEBIT = "debit", "Debit"
        CREDIT = "credit", "Credit"

    entry_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    description = models.CharField(max_length=255)
    reference = models.CharField(max_length=50, blank=True)
    memo = models.ForeignKey(Memo, on_delete=models.SET_NULL, null=True, blank=True, related_name="financial_entries")
    counterparty = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-entry_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.get_entry_type_display()} {self.amount} on {self.entry_date}"
