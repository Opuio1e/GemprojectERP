from rest_framework import viewsets

from .models import ProcessStage
from .serializers import ProcessStageSerializer


class ProcessStageViewSet(viewsets.ModelViewSet):
    """Expose production stages for pipeline visibility."""

    queryset = ProcessStage.objects.select_related("gemstone").all()
    serializer_class = ProcessStageSerializer
    filterset_fields = ("stage", "started_at", "completed_at")
    search_fields = ("gemstone__sku", "artisan", "notes")
    ordering_fields = ("started_at", "completed_at")
