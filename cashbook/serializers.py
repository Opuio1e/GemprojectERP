from rest_framework import serializers

from .models import FinancialEntry


class FinancialEntrySerializer(serializers.ModelSerializer):
    memo_reference = serializers.CharField(source="memo.reference", read_only=True)

    class Meta:
        model = FinancialEntry
        fields = [
            "id",
            "entry_date",
            "amount",
            "entry_type",
            "description",
            "reference",
            "counterparty",
            "memo",
            "memo_reference",
            "created_at",
        ]
