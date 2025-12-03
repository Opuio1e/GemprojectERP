from django_filters import rest_framework as filters
from rest_framework import viewsets

from .models import Memo, MemoLine
from .serializers import MemoLineSerializer, MemoSerializer


class MemoFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status")
    issued_at = filters.DateFromToRangeFilter()
    due_at = filters.DateFromToRangeFilter()

    class Meta:
        model = Memo
        fields = ["status", "issued_at", "due_at"]


class MemoLineFilter(filters.FilterSet):
    memo = filters.NumberFilter(field_name="memo")
    gemstone = filters.NumberFilter(field_name="gemstone")
    memo_reference = filters.CharFilter(field_name="memo__reference", lookup_expr="icontains")
    gemstone_sku = filters.CharFilter(field_name="gemstone__sku", lookup_expr="icontains")
    returned_at = filters.DateFromToRangeFilter()

    class Meta:
        model = MemoLine
        fields = ["memo", "gemstone", "memo_reference", "gemstone_sku", "returned_at"]


class MemoViewSet(viewsets.ModelViewSet):
    queryset = Memo.objects.prefetch_related("lines__gemstone").all()
    serializer_class = MemoSerializer
    filterset_class = MemoFilter
    search_fields = ("reference", "counterparty")
    ordering_fields = ("issued_at", "due_at")


class MemoLineViewSet(viewsets.ModelViewSet):
    queryset = MemoLine.objects.select_related("memo", "gemstone").all()
    serializer_class = MemoLineSerializer
    filterset_class = MemoLineFilter
    search_fields = ("memo__reference", "gemstone__sku")
    ordering_fields = ("returned_at",)
