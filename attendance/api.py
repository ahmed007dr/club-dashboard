from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Attendance, EntryLog
from .serializers import AttendanceSerializer, EntryLogSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from django.db.models import Q
from django.utils import timezone
from members.models import Member
from rest_framework.pagination import PageNumberPagination


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_list_api(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب attendance_list_api")
    
    search_term = request.GET.get('q', '')
    print(f"تم تنفيذ خطوة: جلب search_term = {search_term}")

    if request.user.role == 'owner':
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').all()
        print("تم تنفيذ خطوة: جلب كل سجلات الحضور لصاحب النظام")
    else:
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(subscription__club=request.user.club)
        print(f"تم تنفيذ خطوة: جلب سجلات الحضور لنادي المستخدم {request.user.club}")

    if search_term:
        attendances = attendances.filter(
            Q(subscription__member__name__icontains=search_term) |
            Q(subscription__member__phone__icontains=search_term) |
            Q(subscription__member__rfid_code__icontains=search_term)
        )
        print("تم تنفيذ خطوة: تطبيق فلتر البحث")

    attendances = attendances.order_by('-attendance_date')
    print("تم تنفيذ خطوة: ترتيب سجلات الحضور حسب تاريخ الحضور تنازلي")

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(attendances, request)
    print("تم تنفيذ خطوة: تطبيق الـ pagination")

    serializer = AttendanceSerializer(result_page, many=True)
    print("تم تنفيذ خطوة: تحويل بيانات سجلات الحضور إلى JSON باستخدام serializer")

    return paginator.get_paginated_response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_attendance_api(request, attendance_id):
    print("تم تنفيذ خطوة: بدء معالجة طلب delete_attendance_api")
    
    attendance = get_object_or_404(Attendance, id=attendance_id)
    print(f"تم تنفيذ خطوة: جلب سجل الحضور بـ ID = {attendance_id}")

    subscription = attendance.subscription
    print(f"تم تنفيذ خطوة: جلب الاشتراك المرتبط = {subscription.id}")

    subscription.entry_count = max(0, subscription.entry_count - 1)  # Decrease entry count
    subscription.save()
    print(f"تم تنفيذ خطوة: تقليل عدد الدخول للاشتراك، entry_count = {subscription.entry_count}")

    attendance.delete()
    print("تم تنفيذ خطوة: حذف سجل الحضور من قاعدة البيانات")

    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def entry_log_list_api(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب entry_log_list_api")
    
    search_term = request.GET.get('q', '')
    print(f"تم تنفيذ خطوة: جلب search_term = {search_term}")

    if request.user.role == 'owner':
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').all()
        print("تم تنفيذ خطوة: جلب كل سجلات الدخول لصاحب النظام")
    else:
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(club=request.user.club)
        print(f"تم تنفيذ خطوة: جلب سجلات الدخول لنادي المستخدم {request.user.club}")

    if search_term:
        logs = logs.filter(
            Q(member__name__icontains=search_term) |
            Q(member__phone__icontains=search_term) |
            Q(member__rfid_code__icontains=search_term)
        )
        print("تم تنفيذ خطوة: تطبيق فلتر البحث")

    logs = logs.order_by('-timestamp')
    print("تم تنفيذ خطوة: ترتيب سجلات الدخول حسب الوقت تنازلي")

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(logs, request)
    print("تم تنفيذ خطوة: تطبيق الـ pagination")

    serializer = EntryLogSerializer(result_page, many=True)
    print("تم تنفيذ خطوة: تحويل بيانات سجلات الدخول إلى JSON باستخدام serializer")

    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_attendance_api(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب add_attendance_api")
    
    serializer = AttendanceSerializer(data=request.data)
    print(f"تم تنفيذ خطوة: إنشاء serializer لبيانات الحضور، البيانات المرسلة = {request.data}")

    if serializer.is_valid():
        print("تم تنفيذ خطوة: التحقق من صحة بيانات الـ serializer")
        attendance = serializer.save()
        print(f"تم تنفيذ خطوة: حفظ سجل الحضور في قاعدة البيانات، ID = {attendance.id}")

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, attendance):
            attendance.delete()
            print("تم تنفيذ خطوة: حذف سجل الحضور بسبب عدم وجود صلاحية")
            return Response(
                {'error': 'ليس لديك الصلاحية لتسجيل حضور لهذا النادي'},
                status=status.HTTP_403_FORBIDDEN
            )
        print("تم تنفيذ خطوة: التحقق من الصلاحيات بنجاح")

        subscription = attendance.subscription
        print(f"تم تنفيذ خطوة: جلب الاشتراك المرتبط = {subscription.id}")

        if not subscription.can_enter():
            attendance.delete()
            print("تم تنفيذ خطوة: حذف سجل الحضور بسبب الوصول للحد الأقصى لعدد الدخول")
            return Response(
                {'error': 'لا يمكن تسجيل الحضور: تم الوصول للحد الأقصى لعدد الدخول'},
                status=status.HTTP_400_BAD_REQUEST
            )
        print("تم تنفيذ خطوة: التحقق من إمكانية الدخول بنجاح")

        subscription.entry_count += 1
        subscription.save()
        print(f"تم تنفيذ خطوة: زيادة عدد الدخول للاشتراك، entry_count = {subscription.entry_count}")

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    print("تم تنفيذ خطوة: فشل التحقق من صحة الـ serializer")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_entry_log_api(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب create_entry_log_api")
    
    data = request.data.copy()
    data['approved_by'] = request.user.id
    print(f"تم تنفيذ خطوة: إضافة approved_by إلى البيانات، البيانات المرسلة = {data}")

    serializer = EntryLogSerializer(data=data)
    print("تم تنفيذ خطوة: إنشاء serializer لبيانات سجل الدخول")

    if serializer.is_valid():
        print("تم تنفيذ خطوة: التحقق من صحة بيانات الـ serializer")
        entry_log = serializer.save()
        print(f"تم تنفيذ خطوة: حفظ سجل الدخول في قاعدة البيانات، ID = {entry_log.id}")

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, entry_log):
            entry_log.delete()
            print("تم تنفيذ خطوة: حذف سجل الدخول بسبب عدم وجود صلاحية")
            return Response(
                {'error': 'ليس لديك الصلاحية لتسجيل دخول لهذا النادي'},
                status=status.HTTP_403_FORBIDDEN
            )
        print("تم تنفيذ خطوة: التحقق من الصلاحيات بنجاح")

        subscription = entry_log.related_subscription
        if subscription:
            print(f"تم تنفيذ خطوة: جلب الاشتراك المرتبط = {subscription.id}")
            if not subscription.can_enter():
                entry_log.delete()
                print("تم تنفيذ خطوة: حذف سجل الدخول بسبب الوصول للحد الأقصى لعدد الدخول")
                return Response(
                    {'error': 'لا يمكن تسجيل الدخول: تم الوصول للحد الأقصى لعدد الدخول'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            print("تم تنفيذ خطوة: التحقق من إمكانية الدخول بنجاح")
        else:
            print("تم تنفيذ خطوة: لا يوجد اشتراك مرتبط بسجل الدخول")

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    print("تم تنفيذ خطوة: فشل التحقق من صحة الـ serializer")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)