import React from 'react';
import { useOutletContext } from 'react-router-dom';

/**
 * PermissionGate
 * Wraps children and only renders them if the user has the required permission
 * or is an organization owner/admin.
 */
export default function PermissionGate({ children, has, roleRequirement = ["owner", "admin"] }) {
    const { user } = useOutletContext();

    if (!user) return null;

    // Owners and Admins usually have full bypass
    const isSuperUser = roleRequirement.includes(user.role?.toLowerCase());
    
    // Check if user has the specific permission in their permissions array
    const hasPermission = (user.permissions || []).includes(has);

    if (isSuperUser || hasPermission) {
        return <>{children}</>;
    }

    return null;
}
