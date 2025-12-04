from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from inventory.models import Gemstone

from .models import ProcessStage

STAGE_SEQUENCE = [
    ProcessStage.StageName.HEAT,
    ProcessStage.StageName.ROUGH,
    ProcessStage.StageName.PREFORM,
    ProcessStage.StageName.CUTTING,
    ProcessStage.StageName.CALIBRATE,
]
STAGE_INDEX = {stage: idx for idx, stage in enumerate(STAGE_SEQUENCE)}


def _active_stage_exists(instance: ProcessStage) -> bool:
    return (
        ProcessStage.objects.filter(
            gemstone=instance.gemstone,
            started_at__isnull=False,
            completed_at__isnull=True,
        )
        .exclude(pk=instance.pk)
        .exists()
    )


@receiver(pre_save, sender=ProcessStage)
def validate_process_stage(sender, instance: ProcessStage, **kwargs) -> None:
    if instance.completed_at and not instance.started_at:
        raise ValidationError("A stage cannot be completed before it starts.")

    if instance.started_at and not instance.completed_at:
        if _active_stage_exists(instance):
            raise ValidationError(
                "Another production stage is already active for this gemstone."
            )
        if instance.gemstone.availability == Gemstone.Availability.ON_MEMO:
            raise ValidationError(
                "Gemstones on memo cannot start a production stage."
            )

    other_stages = ProcessStage.objects.filter(gemstone=instance.gemstone).exclude(
        pk=instance.pk
    )
    completed_stages = other_stages.filter(completed_at__isnull=False)
    highest_completed_idx = -1
    if completed_stages.exists():
        highest_completed_idx = max(STAGE_INDEX[stage.stage] for stage in completed_stages)

    if instance.started_at:
        expected_next_idx = highest_completed_idx + 1
        stage_idx = STAGE_INDEX[instance.stage]
        if expected_next_idx >= len(STAGE_SEQUENCE):
            raise ValidationError("All production stages are already completed.")
        expected_stage = STAGE_SEQUENCE[expected_next_idx]
        if stage_idx != expected_next_idx:
            raise ValidationError(
                f"Invalid stage order. Next stage should be '{expected_stage}'."
            )


@receiver(post_save, sender=ProcessStage)
def update_gemstone_from_stage(sender, instance: ProcessStage, **kwargs) -> None:
    gemstone = instance.gemstone
    active_stage = gemstone.stages.filter(
        started_at__isnull=False, completed_at__isnull=True
    ).first()

    if active_stage:
        gemstone.availability = Gemstone.Availability.IN_PRODUCTION
        gemstone.current_stage = active_stage.stage
    else:
        gemstone.current_stage = instance.stage if instance.completed_at else gemstone.current_stage
        if gemstone.availability == Gemstone.Availability.IN_PRODUCTION:
            gemstone.availability = Gemstone.Availability.AVAILABLE

    gemstone.save(update_fields=["availability", "current_stage", "updated_at"])
