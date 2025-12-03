from django_filters import rest_framework as filters
from rest_framework import viewsets

from .models import Gemstone
from .serializers import GemstoneSerializer


class GemstoneFilter(filters.FilterSet):
    sku = filters.CharFilter(field_name="sku", lookup_expr="icontains")
    availability = filters.CharFilter(field_name="availability")
    created_at = filters.DateFromToRangeFilter()

    class Meta:
        model = Gemstone
        fields = ["sku", "availability", "created_at"]


class GemstoneViewSet(viewsets.ModelViewSet):
    """Basic CRUD viewset for gemstones to be wired into future routers."""

    queryset = Gemstone.objects.all()
    serializer_class = GemstoneSerializer
    filterset_class = GemstoneFilter
    search_fields = ["sku", "stone_type", "description"]
    ordering_fields = ["sku", "weight_carat", "created_at"]
