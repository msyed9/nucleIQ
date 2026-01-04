/**
 * RoleGate Component
 * Conditionally renders children based on user roles
 */

import React from 'react';
import { useRole } from '../../hooks/usePermission';

interface RoleGateProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  roles,
  children,
  fallback = null,
  requireAll = false,
}) => {
  const { isRole } = useRole();

  const hasAccess = requireAll
    ? roles.every(role => isRole(role))
    : roles.some(role => isRole(role));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
