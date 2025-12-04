from datetime import date

from django.core.exceptions import ValidationError
from django.test import TestCase

from inventory.models import Gemstone

from .models import ProcessStage


class ProcessStageSignalTests(TestCase):
    def setUp(self) -> None:
        self.gemstone = Gemstone.objects.create(
            sku="TEST-001",
            description="Test stone",
            stone_type="Ruby",
            weight_carat=1.25,
            color="Red",
            clarity="VS1",
            shape="Oval",
            origin="Test",
        )

    def test_stage_sequence_and_availability_updates(self):
        heat = ProcessStage.objects.create(
            gemstone=self.gemstone,
            stage=ProcessStage.StageName.HEAT,
            started_at=date(2024, 1, 1),
        )
        self.gemstone.refresh_from_db()
        self.assertEqual(
            self.gemstone.availability, Gemstone.Availability.IN_PRODUCTION
        )
        self.assertEqual(self.gemstone.current_stage, heat.stage)

        with self.assertRaises(ValidationError):
            ProcessStage.objects.create(
                gemstone=self.gemstone,
                stage=ProcessStage.StageName.ROUGH,
                started_at=date(2024, 1, 2),
            )

        heat.completed_at = date(2024, 1, 3)
        heat.save()
        self.gemstone.refresh_from_db()
        self.assertEqual(self.gemstone.availability, Gemstone.Availability.AVAILABLE)
        self.assertEqual(self.gemstone.current_stage, heat.stage)

        rough = ProcessStage.objects.create(
            gemstone=self.gemstone,
            stage=ProcessStage.StageName.ROUGH,
            started_at=date(2024, 1, 4),
        )
        self.gemstone.refresh_from_db()
        self.assertEqual(
            self.gemstone.availability, Gemstone.Availability.IN_PRODUCTION
        )
        self.assertEqual(self.gemstone.current_stage, rough.stage)

    def test_prevents_overlapping_active_stage_or_memo_status(self):
        ProcessStage.objects.create(
            gemstone=self.gemstone,
            stage=ProcessStage.StageName.HEAT,
            started_at=date(2024, 1, 1),
        )

        with self.assertRaises(ValidationError):
            ProcessStage.objects.create(
                gemstone=self.gemstone,
                stage=ProcessStage.StageName.PREFORM,
                started_at=date(2024, 1, 2),
            )

        self.gemstone.availability = Gemstone.Availability.ON_MEMO
        self.gemstone.save(update_fields=["availability", "updated_at"])

        with self.assertRaises(ValidationError):
            ProcessStage.objects.create(
                gemstone=self.gemstone,
                stage=ProcessStage.StageName.CUTTING,
                started_at=date(2024, 1, 3),
            )
