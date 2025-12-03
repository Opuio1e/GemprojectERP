from rest_framework import serializers

from .models import Memo, MemoLine


class MemoLineSerializer(serializers.ModelSerializer):
    gemstone_sku = serializers.CharField(source="gemstone.sku", read_only=True)

    class Meta:
        model = MemoLine
        fields = [
            "id",
            "gemstone",
            "gemstone_sku",
            "quantity",
            "memoed_weight",
            "returned_at",
        ]


class MemoSerializer(serializers.ModelSerializer):
    lines = MemoLineSerializer(many=True, read_only=True)

    class Meta:
        model = Memo
        fields = [
            "id",
            "reference",
            "counterparty",
            "issued_at",
            "due_at",
            "status",
            "notes",
            "lines",
        ]
