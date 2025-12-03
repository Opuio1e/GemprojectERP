from rest_framework import viewsets

from .models import Memo, MemoLine
from .serializers import MemoLineSerializer, MemoSerializer


class MemoViewSet(viewsets.ModelViewSet):
    queryset = Memo.objects.prefetch_related("lines__gemstone").all()
    serializer_class = MemoSerializer
    filterset_fields = ("status", "issued_at", "due_at")
    search_fields = ("reference", "counterparty")
    ordering_fields = ("issued_at", "due_at")


class MemoLineViewSet(viewsets.ModelViewSet):
    queryset = MemoLine.objects.select_related("memo", "gemstone").all()
    serializer_class = MemoLineSerializer
    filterset_fields = ("returned_at", "memo", "gemstone")
    search_fields = ("memo__reference", "gemstone__sku")
    ordering_fields = ("returned_at",)
