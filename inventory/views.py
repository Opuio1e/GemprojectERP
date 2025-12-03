from rest_framework import viewsets

from .models import Gemstone
from .serializers import GemstoneSerializer


class GemstoneViewSet(viewsets.ModelViewSet):
    """Basic CRUD viewset for gemstones to be wired into future routers."""

    queryset = Gemstone.objects.all()
    serializer_class = GemstoneSerializer
    search_fields = ["sku", "stone_type", "description"]
    ordering_fields = ["sku", "weight_carat", "created_at"]
