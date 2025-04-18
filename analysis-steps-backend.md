## 🧠 Project Analysis / تحليل المشروع

### 📌 General Overview / نظرة عامة عامة:
- **Project Goal / هدف المشروع:**
  - إنشاء نظام إدارة متكامل للاشتراكات، الحجوزات، الحسابات، الإيرادات، وتذاكر الدخول لنادي رياضي.

- **Main User Roles / الأدوار الأساسية للمستخدمين:**
  - الموظف الإداري (موظف الاشتراكات / الاستقبال)
  - مدير النظام
  - المستخدم الخارجي (اختياري لاحقًا)

- **Main Features / الخصائص الأساسية:**
  - إدارة الاشتراكات حسب النوع
  - إدارة الحضور والانصراف
  - إدارة التذاكر اليومية والموسمية
  - حساب الإيرادات والمدفوعات
  - تتبع الحجوزات

---

### 📦 Application Structure / هيكل التطبيقات:

#### ✅ 1. Members App / تطبيق الأعضاء:
- **models.py:**
  - Member (الاسم، الرقم القومي، رقم الهاتف، النوع، الصورة، النوع الرياضي، ...)
- **views.py:**
  - MemberCreateView
  - MemberListView
  - MemberUpdateView
- **forms.py:**
  - MemberForm (with widgets)

#### ✅ 2. Subscriptions App / تطبيق الاشتراكات:
- **models.py:**
  - SubscriptionType (شهري - نصف شهري - سنوي...)
  - Subscription (العضو، النوع، القيمة، المدفوع، المتبقي، تاريخ البداية، تاريخ النهاية، عدد أيام الحضور)
- **views.py:**
  - Create, List, Update subscriptions
- **forms.py:**
  - SubscriptionForm (يحسب المتبقي تلقائيًا)

#### ✅ 3. Attendance App / تطبيق الحضور:
- **models.py:**
  - Attendance (العضو، التاريخ، الوقت)
- **views.py:**
  - DailyAttendanceView, FilteredAttendance

#### ✅ 4. Tickets App / تطبيق التذاكر:
- **models.py:**
  - Ticket (العضو، التاريخ، نوع التذكرة، السعر، هل تم الاستخدام؟)
- **views.py:**
  - TicketIssueView, TicketListView

#### ✅ 5. Revenues App / تطبيق الإيرادات:
- **models.py:**
  - Receipt (العضو، القيمة، التاريخ، نوع الإيراد)
  - Revenue (مرتبط بالإيصال تلقائيًا)
- **views.py:**
  - ReceiptCreateView (يولد Revenue تلقائيًا)
  - RevenueReportView

---

### 🧮 Additional Files / ملفات إضافية:
- **admin.py:** لتخصيص العرض وإضافة فلترة على البيانات
- **urls.py:** تحديد جميع المسارات لكل تطبيق
- **permissions.py:** الصلاحيات حسب المستخدم (لاحقًا)
- **tests.py:** اختبارات لكل وظيفة رئيسية

---

### ✅ Development Workflow / سير العمل:
1. تحليل وإنشاء `models.py` لكل تطبيق
2. تصميم `forms.py` لكل نموذج
3. إعداد `views.py` لتوفير CRUD operations
4. ربط المسارات في `urls.py`
5. تخصيص `admin.py`
6. إعداد `templates` لاحقًا بعد تنسيق الواجهة

