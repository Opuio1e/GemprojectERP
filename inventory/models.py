from django.db import models


class Gemstone(models.Model):
    class Availability(models.TextChoices):
        AVAILABLE = "available", "Available"
        RESERVED = "reserved", "Reserved"
        IN_PRODUCTION = "production", "In Production"
        ON_MEMO = "memo", "On Memo"
        SOLD = "sold", "Sold"

    sku = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)
    stone_type = models.CharField(max_length=100)
    weight_carat = models.DecimalField(max_digits=10, decimal_places=3)
    color = models.CharField(max_length=50, blank=True)
    clarity = models.CharField(max_length=50, blank=True)
    shape = models.CharField(max_length=50, blank=True)
    origin = models.CharField(max_length=100, blank=True)
    availability = models.CharField(
        max_length=20, choices=Availability.choices, default=Availability.AVAILABLE
    )
    current_stage = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sku"]

    def __str__(self) -> str:
        return f"{self.sku} ({self.stone_type})"
