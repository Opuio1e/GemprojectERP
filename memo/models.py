from django.db import models

from inventory.models import Gemstone


class Memo(models.Model):
    class MemoStatus(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"
        OVERDUE = "overdue", "Overdue"

    reference = models.CharField(max_length=50, unique=True)
    counterparty = models.CharField(max_length=100)
    issued_at = models.DateField()
    due_at = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=MemoStatus.choices, default=MemoStatus.OPEN)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-issued_at", "reference"]

    def __str__(self) -> str:
        return f"Memo {self.reference} ({self.counterparty})"


class MemoLine(models.Model):
    memo = models.ForeignKey(Memo, on_delete=models.CASCADE, related_name="lines")
    gemstone = models.ForeignKey(Gemstone, on_delete=models.PROTECT, related_name="memo_lines")
    quantity = models.PositiveIntegerField(default=1)
    memoed_weight = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    returned_at = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ("memo", "gemstone")

    def __str__(self) -> str:
        return f"{self.gemstone.sku} on {self.memo.reference}"
