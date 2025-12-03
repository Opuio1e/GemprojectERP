from rest_framework import serializers

from .models import Gemstone


class GemstoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gemstone
        fields = [
            "id",
            "sku",
            "description",
            "stone_type",
            "weight_carat",
            "color",
            "clarity",
            "shape",
            "origin",
            "availability",
            "current_stage",
            "created_at",
            "updated_at",
        ]
