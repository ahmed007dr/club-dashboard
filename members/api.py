from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from utils.permissions import IsOwnerOrRelatedToClub  
from .serializers import MemberSerializer
from .models import Member
from utils.generate_membership_number import generate_membership_number
from django.db import IntegrityError

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_list_api(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب member_list_api")
    
    search_term = request.GET.get('q', '')
    print(f"تم تنفيذ خطوة: جلب search_term = {search_term}")

    if request.user.role == 'owner':
        members = Member.objects.all().order_by('-id')
        print("تم تنفيذ خطوة: جلب كل الأعضاء لصاحب النظام")
    else:
        members = Member.objects.filter(club=request.user.club).order_by('-id')
        print(f"تم تنفيذ خطوة: جلب الأعضاء لنادي المستخدم {request.user.club}")
    
    if search_term:
        members = members.filter(
            Q(name__icontains=search_term) |
            Q(phone__icontains=search_term) |
            Q(rfid_code__icontains=search_term)
        )
        print("تم تنفيذ خطوة: تطبيق فلتر البحث")
    
    members = members.order_by('-id')
    print("تم تنفيذ خطوة: ترتيب الأعضاء حسب id تنازلي")

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    print("تم تنفيذ خطوة: تطبيق الـ pagination")
    
    serializer = MemberSerializer(result_page, many=True)
    print("تم تنفيذ خطوة: تحويل بيانات الأعضاء إلى JSON باستخدام serializer")
    
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_search_api(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب member_search_api")
    
    search_term = request.GET.get('q', '')
    print(f"تم تنفيذ خطوة: جلب search_term = {search_term}")

    search_filter = (
        Q(name__icontains=search_term) |
        Q(membership_number__icontains=search_term) |
        Q(national_id__icontains=search_term) |
        Q(rfid_code__icontains=search_term) |
        Q(phone__icontains=search_term)
    )
    print("تم تنفيذ خطوة: إنشاء فلتر البحث")

    if request.user.role == 'owner':
        members = Member.objects.filter(search_filter).order_by('-id')
        print("تم تنفيذ خطوة: جلب الأعضاء بناءً على فلتر البحث لصاحب النظام")
    else:
        members = Member.objects.filter(Q(club=request.user.club) & search_filter).order_by('-id')
        print(f"تم تنفيذ خطوة: جلب الأعضاء بناءً على فلتر البحث لنادي المستخدم {request.user.club}")

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    print("تم تنفيذ خطوة: تطبيق الـ pagination")
    
    serializer = MemberSerializer(result_page, many=True)
    print("تم تنفيذ خطوة: تحويل بيانات الأعضاء إلى JSON باستخدام serializer")
    
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب api_user_profile")
    
    user = request.user
    print(f"تم تنفيذ خطوة: جلب بيانات المستخدم {user.username}")
    
    profile_data = {
        'username': user.username,
        'email': user.email,
    }
    print("تم تنفيذ خطوة: إنشاء بيانات الملف الشخصي")
    
    return Response(profile_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_member_api(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب create_member_api")
    
    membership_number = generate_membership_number()
    print(f"تم تنفيذ خطوة: إنشاء رقم عضوية جديد = {membership_number}")

    data = request.data.copy()
    data['membership_number'] = membership_number  
    print(f"تم تنفيذ خطوة: إضافة رقم العضوية إلى البيانات = {data}")

    serializer = MemberSerializer(data=data)
    print("تم تنفيذ خطوة: إنشاء serializer لبيانات العضو")

    if serializer.is_valid():
        print("تم تنفيذ خطوة: التحقق من صحة بيانات الـ serializer")
        try:
            member = serializer.save()
            print("تم تنفيذ خطوة: حفظ العضو في قاعدة البيانات")
            
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, member):
                member.delete()
                print("تم تنفيذ خطوة: حذف العضو بسبب عدم وجود صلاحية")
                return Response({'error': 'You do not have permission to create a member for this club'}, status=status.HTTP_403_FORBIDDEN)
            print("تم تنفيذ خطوة: التحقق من الصلاحيات بنجاح")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            print("تم تنفيذ خطوة: فشل الحفظ - رقم العضوية موجود بالفعل")
            return Response({'error': 'Membership number already exists'}, status=status.HTTP_400_BAD_REQUEST)
    print("تم تنفيذ خطوة: فشل التحقق من صحة الـ serializer")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_detail_api(request, member_id):
    print("تم تنفيذ خطوة: بدء معالجة طلب member_detail_api")
    
    member = get_object_or_404(Member, id=member_id)
    print(f"تم تنفيذ خطوة: جلب العضو بـ ID = {member_id}")
    
    serializer = MemberSerializer(member)
    print("تم تنفيذ خطوة: تحويل بيانات العضو إلى JSON باستخدام serializer")
    
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def update_member_api(request, member_id):
    print("تم تنفيذ خطوة: بدء معالجة طلب update_member_api")
    
    member = get_object_or_404(Member, id=member_id)
    print(f"تم تنفيذ خطوة: جلب العضو بـ ID = {member_id}")
    
    serializer = MemberSerializer(member, data=request.data)
    print(f"تم تنفيذ خطوة: إنشاء serializer لتحديث بيانات العضو، البيانات المرسلة = {request.data}")
    
    if serializer.is_valid():
        print("تم تنفيذ خطوة: التحقق من صحة بيانات الـ serializer")
        updated_member = serializer.save()
        print("تم تنفيذ خطوة: حفظ التغييرات على العضو")
        
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_member):
            print("تم تنفيذ خطوة: فشل التحقق من الصلاحيات لتحديث العضو")
            return Response({'error': 'You do not have permission to update this member to this club'}, status=status.HTTP_403_FORBIDDEN)
        print("تم تنفيذ خطوة: التحقق من الصلاحيات بنجاح")
        
        return Response(serializer.data)
    print("تم تنفيذ خطوة: فشل التحقق من صحة الـ serializer")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_member_api(request, member_id):
    print("تم تنفيذ خطوة: بدء معالجة طلب delete_member_api")
    
    member = get_object_or_404(Member, id=member_id)
    print(f"تم تنفيذ خطوة: جلب العضو بـ ID = {member_id}")
    
    member.delete()
    print("تم تنفيذ خطوة: حذف العضو من قاعدة البيانات")
    
    return Response(status=status.HTTP_204_NO_CONTENT)