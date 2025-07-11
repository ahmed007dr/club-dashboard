import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FaUser } from "react-icons/fa";

const MemberBio = ({ selectedMember, subscriptionCount }) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <FaUser className="text-blue-600" />
          السيرة الذاتية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          <img
            src={selectedMember.photo || "https://via.placeholder.com/150"}
            alt="member"
            className="w-32 h-32 rounded-full object-cover shadow-md"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            {[
              { label: "الاسم", value: selectedMember.name },
              { label: "رقم العضوية", value: selectedMember.membership_number },
              { label: "كود RFID", value: selectedMember.rfid_code || "غير متوفر" },
              { label: "الرقم القومي", value: selectedMember.national_id },
              { label: "رقم الهاتف", value: selectedMember.phone },
              { label: "رقم الهاتف الثانوي", value: selectedMember.phone2 || "غير متوفر" },
              { label: "الجنس", value: selectedMember.gender === "M" ? "ذكر" : selectedMember.gender === "F" ? "أنثى" : "غير محدد" },
              { label: "الوظيفة", value: selectedMember.job || "غير متوفر" },
              { label: "العنوان", value: selectedMember.address || "غير متوفر" },
              { label: "اسم النادي", value: selectedMember.club_name },
              { label: "ملاحظات", value: selectedMember.note || "لا توجد ملاحظات" },
              { label: "عدد الاشتراكات", value: subscriptionCount },
            ].map((field, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-sm text-gray-500">{field.label}</span>
                <span className="font-medium">{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberBio;
