from datetime import date

from django.core.exceptions import ValidationError
from django.test import TestCase

from inventory.models import Gemstone
from production.models import ProcessStage

from .models import Memo, MemoLine


class MemoSignalTests(TestCase):
    def setUp(self) -> None:
        self.gemstone = Gemstone.objects.create(
            sku="MEMO-001",
            description="Memo stone",
            stone_type="Emerald",
            weight_carat=2.5,
            color="Green",
            clarity="VS2",
            shape="Round",
            origin="Memo",
        )
        self.memo = Memo.objects.create(
            reference="M-001",
            counterparty="Client",
            issued_at=date(2024, 2, 1),
        )

    def test_memo_conflicts_with_production(self):
        ProcessStage.objects.create(
            gemstone=self.gemstone,
            stage=ProcessStage.StageName.HEAT,
            started_at=date(2024, 2, 2),
        )

        with self.assertRaises(ValidationError):
            MemoLine.objects.create(
                memo=self.memo,
                gemstone=self.gemstone,
                quantity=1,
            )

    def test_memo_availability_updates_and_return(self):
        memo_line = MemoLine.objects.create(
            memo=self.memo,
            gemstone=self.gemstone,
            quantity=1,
        )
        self.gemstone.refresh_from_db()
        self.assertEqual(self.gemstone.availability, Gemstone.Availability.ON_MEMO)

        with self.assertRaises(ValidationError):
            MemoLine.objects.create(
                memo=self.memo,
                gemstone=self.gemstone,
                quantity=1,
            )

        memo_line.returned_at = date(2024, 2, 5)
        memo_line.save()
        self.gemstone.refresh_from_db()
        self.assertEqual(self.gemstone.availability, Gemstone.Availability.AVAILABLE)

        heat = ProcessStage.objects.create(
            gemstone=self.gemstone,
            stage=ProcessStage.StageName.HEAT,
            started_at=date(2024, 2, 6),
        )
        self.gemstone.refresh_from_db()
        self.assertEqual(
            self.gemstone.availability, Gemstone.Availability.IN_PRODUCTION
        )
        self.assertEqual(self.gemstone.current_stage, heat.stage)
