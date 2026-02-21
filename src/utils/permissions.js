/**
 * User permissions and roles
 */

export const ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  ACCOUNTANT: 'accountant',
  DOCTOR: 'doctor',
};

export const PERMISSIONS = {
  // Patient management
  VIEW_PATIENTS: 'view_patients',
  CREATE_PATIENT: 'create_patient',
  EDIT_PATIENT: 'edit_patient',
  DELETE_PATIENT: 'delete_patient',

  // Test management
  VIEW_TESTS: 'view_tests',
  CREATE_TEST: 'create_test',
  EDIT_TEST: 'edit_test',
  DELETE_TEST: 'delete_test',

  // Invoice management
  VIEW_INVOICES: 'view_invoices',
  CREATE_INVOICE: 'create_invoice',
  EDIT_INVOICE: 'edit_invoice',
  DELETE_INVOICE: 'delete_invoice',

  // User management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
};

/**
 * Role-based permissions mapping
 */
export const rolePermissions = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.CREATE_PATIENT,
    PERMISSIONS.EDIT_PATIENT,
    PERMISSIONS.DELETE_PATIENT,
    PERMISSIONS.VIEW_TESTS,
    PERMISSIONS.CREATE_TEST,
    PERMISSIONS.EDIT_TEST,
    PERMISSIONS.DELETE_TEST,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.EDIT_INVOICE,
    PERMISSIONS.DELETE_INVOICE,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
  ],
  
  [ROLES.TECHNICIAN]: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.CREATE_PATIENT,
    PERMISSIONS.VIEW_TESTS,
    PERMISSIONS.CREATE_TEST,
    PERMISSIONS.EDIT_TEST,
    PERMISSIONS.VIEW_INVOICES,
  ],
  
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.EDIT_INVOICE,
    PERMISSIONS.VIEW_PATIENTS,
  ],
  
  [ROLES.DOCTOR]: [
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.EDIT_PATIENT,
    PERMISSIONS.VIEW_TESTS,
  ],
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole, permission) => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the permissions
 */
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some((permission) => hasPermission(userRole, permission));
};

/**
 * Check if user has all permissions
 */
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every((permission) => hasPermission(userRole, permission));
};
