import { useState, useEffect, useCallback } from "react";

const usePermission = (permission) => {
  // تعطيل التحقق من الصلاحيات، إرجاع true دائمًا
  return true;

  // الكود الأصلي (معلق للرجوع إليه إذا لزم الأمر)
  /*
  const [hasPermission, setHasPermission] = useState(false);

  const checkPermission = useCallback(() => {
    try {
      const permissions = JSON.parse(
        localStorage.getItem("permissions") || "[]"
      );
      setHasPermission(permissions.includes(permission));
    } catch (error) {
      console.error("Error reading permissions from localStorage:", error);
      setHasPermission(false);
    }
  }, [permission]);

  useEffect(() => {
    checkPermission();
    window.addEventListener("storage", checkPermission);
    return () => {
      window.removeEventListener("storage", checkPermission);
    };
  }, [checkPermission]);

  return hasPermission;
  */
};

export default usePermission;