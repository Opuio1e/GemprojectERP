from django_filters import rest_framework as filters
from rest_framework import viewsets

from .models import ProcessStage
from .serializers import ProcessStageSerializer


class ProcessStageFilter(filters.FilterSet):
    stage = filters.CharFilter(field_name="stage")
    gemstone_sku = filters.CharFilter(field_name="gemstone__sku", lookup_expr="icontains")
    started_at = filters.DateFromToRangeFilter()
    completed_at = filters.DateFromToRangeFilter()

    class Meta:
        model = ProcessStage
        fields = ["stage", "gemstone_sku", "started_at", "completed_at"]


class ProcessStageViewSet(viewsets.ModelViewSet):
    """Expose production stages for pipeline visibility."""

    queryset = ProcessStage.objects.select_related("gemstone").all()
    serializer_class = ProcessStageSerializer
    filterset_class = ProcessStageFilter
    search_fields = ("gemstone__sku", "artisan", "notes")
    ordering_fields = ("started_at", "completed_at")
