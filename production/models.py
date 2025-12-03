from django.db import models

from inventory.models import Gemstone


class ProcessStage(models.Model):
    class StageName(models.TextChoices):
        HEAT = "heat", "Heat Treatment"
        ROUGH = "rough", "Rough"
        PREFORM = "preform", "Preform"
        CUTTING = "cutting", "Cutting"
        CALIBRATE = "calibrate", "Calibrate"

    gemstone = models.ForeignKey(Gemstone, on_delete=models.CASCADE, related_name="stages")
    stage = models.CharField(max_length=20, choices=StageName.choices)
    started_at = models.DateField(null=True, blank=True)
    completed_at = models.DateField(null=True, blank=True)
    artisan = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at", "gemstone__sku"]
        unique_together = ("gemstone", "stage", "started_at")

    def __str__(self) -> str:
        return f"{self.get_stage_display()} for {self.gemstone.sku}"
