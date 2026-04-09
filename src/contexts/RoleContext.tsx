import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';

interface RoleContextType {
  userRole: UserRole;
  rolePermissions: RolePermissions;
  setUserRole: (role: UserRole) => void;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole('user');
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch role from profiles table
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (data?.role) {
          setUserRole(data.role as UserRole);
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const rolePermissions = ROLE_PERMISSIONS[userRole];
  const isDeveloper = user?.email?.includes('@shopnewle.com') || user?.email === 'shopnewle@gmail.com';
  const isAdmin = userRole === 'super_admin' || isDeveloper;

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return (rolePermissions[permission] as boolean) || false;
  };

  return (
    <RoleContext.Provider
      value={{
        userRole,
        rolePermissions,
        setUserRole,
        hasPermission,
        isAdmin,
        isDeveloper,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
};
