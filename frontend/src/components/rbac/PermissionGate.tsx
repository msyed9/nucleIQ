/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 */

import React from 'react';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGateProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action,
  children,
  fallback = null,
  showMessage = false,
}) => {
  const hasPermission = usePermission(module, action);

  if (!hasPermission) {
    if (showMessage) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Access Denied: You don't have permission to access this feature.
          </p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
