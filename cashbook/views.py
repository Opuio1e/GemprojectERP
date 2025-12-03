from rest_framework import viewsets

from .models import FinancialEntry
from .serializers import FinancialEntrySerializer


class FinancialEntryViewSet(viewsets.ModelViewSet):
    queryset = FinancialEntry.objects.select_related("memo").all()
    serializer_class = FinancialEntrySerializer
    filterset_fields = ("entry_type", "entry_date", "memo")
    search_fields = ("description", "reference", "counterparty")
    ordering_fields = ("entry_date", "amount", "created_at")
