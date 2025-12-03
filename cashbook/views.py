from django_filters import rest_framework as filters
from rest_framework import viewsets

from .models import FinancialEntry
from .serializers import FinancialEntrySerializer


class FinancialEntryFilter(filters.FilterSet):
    entry_type = filters.CharFilter(field_name="entry_type")
    entry_date = filters.DateFromToRangeFilter()
    memo_reference = filters.CharFilter(field_name="memo__reference", lookup_expr="icontains")

    class Meta:
        model = FinancialEntry
        fields = ["entry_type", "entry_date", "memo_reference", "memo"]


class FinancialEntryViewSet(viewsets.ModelViewSet):
    queryset = FinancialEntry.objects.select_related("memo").all()
    serializer_class = FinancialEntrySerializer
    filterset_class = FinancialEntryFilter
    search_fields = ("description", "reference", "counterparty")
    ordering_fields = ("entry_date", "amount", "created_at")
