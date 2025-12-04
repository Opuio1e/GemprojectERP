from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from inventory.models import Gemstone
from production.models import ProcessStage

from .models import MemoLine


def _active_stage_for_gemstone(gemstone) -> bool:
    return ProcessStage.objects.filter(
        gemstone=gemstone, started_at__isnull=False, completed_at__isnull=True
    ).exists()


def _active_memo_for_gemstone(gemstone, exclude_pk=None) -> bool:
    qs = MemoLine.objects.filter(gemstone=gemstone, returned_at__isnull=True)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    return qs.exists()


@receiver(pre_save, sender=MemoLine)
def validate_memo_line(sender, instance: MemoLine, **kwargs) -> None:
    if instance.returned_at is None:
        if _active_memo_for_gemstone(instance.gemstone, exclude_pk=instance.pk):
            raise ValidationError("This gemstone is already on another memo.")
        if _active_stage_for_gemstone(instance.gemstone):
            raise ValidationError(
                "Gemstones in production cannot be placed on memo."
            )
    else:
        # Returning items from memo; nothing further to validate here.
        pass


@receiver(post_save, sender=MemoLine)
def update_gemstone_from_memo_line(sender, instance: MemoLine, **kwargs) -> None:
    gemstone = instance.gemstone
    active_memo_exists = _active_memo_for_gemstone(gemstone)
    active_stage_exists = _active_stage_for_gemstone(gemstone)

    if active_memo_exists:
        gemstone.availability = Gemstone.Availability.ON_MEMO
    elif active_stage_exists:
        gemstone.availability = Gemstone.Availability.IN_PRODUCTION
    elif gemstone.availability in [
        Gemstone.Availability.ON_MEMO,
        Gemstone.Availability.IN_PRODUCTION,
        Gemstone.Availability.RESERVED,
    ]:
        gemstone.availability = Gemstone.Availability.AVAILABLE

    gemstone.save(update_fields=["availability", "updated_at"])
