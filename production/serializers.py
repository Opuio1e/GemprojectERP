from rest_framework import serializers

from .models import ProcessStage


class ProcessStageSerializer(serializers.ModelSerializer):
    gemstone_sku = serializers.CharField(source="gemstone.sku", read_only=True)

    class Meta:
        model = ProcessStage
        fields = [
            "id",
            "gemstone",
            "gemstone_sku",
            "stage",
            "started_at",
            "completed_at",
            "artisan",
            "notes",
        ]
