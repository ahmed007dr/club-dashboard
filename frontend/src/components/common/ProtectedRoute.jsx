// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { hasPermission, isInGroup } from '../../redux/slices/authSlice';

const ProtectedRoute = ({ children, requiredPermissions = [], requiredGroups = [] }) => {
  const token = useSelector((state) => state.auth.token);
  const userHasPermission = useSelector((state) =>
    requiredPermissions.every((perm) => hasPermission(state, perm))
  );
  const userInGroup = useSelector((state) =>
    requiredGroups.every((group) => isInGroup(state, group))
  );

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions.length && !userHasPermission) {
    return <h2>⛔ لا تملك الصلاحية للدخول لهذه الصفحة.</h2>;
  }

  if (requiredGroups.length && !userInGroup) {
    return <h2>⛔ هذه الصفحة مخصصة لمجموعة معينة فقط.</h2>;
  }

  return children;
};

export default ProtectedRoute;
