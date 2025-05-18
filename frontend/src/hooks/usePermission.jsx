import { useState, useEffect, useCallback } from "react";

const usePermission = (permission) => {
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
    // Initial check
    checkPermission();

    // Listen for storage events (changes from other tabs)
    window.addEventListener("storage", checkPermission);

    // Cleanup
    return () => {
      window.removeEventListener("storage", checkPermission);
    };
  }, [checkPermission]);

  return hasPermission;
};

export default usePermission;
