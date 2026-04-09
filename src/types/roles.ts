/**
 * Role-Based Access Control Types
 * Defines all user roles and their permissions
 */

export type UserRole = 'user' | 'doctor' | 'hospital_admin' | 'pharmacy' | 'super_admin';

export interface RolePermissions {
  role: UserRole;
  canAccessDoctorDashboard: boolean;
  canAccessHospitalAdmin: boolean;
  canAccessPharmacy: boolean;
  canAccessAdminTools: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  user: {
    role: 'user',
    canAccessDoctorDashboard: false,
    canAccessHospitalAdmin: false,
    canAccessPharmacy: false,
    canAccessAdminTools: false,
    canViewAnalytics: false,
    canManageUsers: false,
  },
  doctor: {
    role: 'doctor',
    canAccessDoctorDashboard: true,
    canAccessHospitalAdmin: false,
    canAccessPharmacy: false,
    canAccessAdminTools: false,
    canViewAnalytics: true,
    canManageUsers: false,
  },
  hospital_admin: {
    role: 'hospital_admin',
    canAccessDoctorDashboard: false,
    canAccessHospitalAdmin: true,
    canAccessPharmacy: false,
    canAccessAdminTools: false,
    canViewAnalytics: true,
    canManageUsers: true,
  },
  pharmacy: {
    role: 'pharmacy',
    canAccessDoctorDashboard: false,
    canAccessHospitalAdmin: false,
    canAccessPharmacy: true,
    canAccessAdminTools: false,
    canViewAnalytics: false,
    canManageUsers: false,
  },
  super_admin: {
    role: 'super_admin',
    canAccessDoctorDashboard: true,
    canAccessHospitalAdmin: true,
    canAccessPharmacy: true,
    canAccessAdminTools: true,
    canViewAnalytics: true,
    canManageUsers: true,
  },
};

export const canAccessFeature = (role: UserRole, feature: keyof RolePermissions): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  return (permissions[feature] as boolean) || false;
};
