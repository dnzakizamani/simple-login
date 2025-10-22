# TODO: Implement RBAC System with User, Permission, Menu, and Roles

## Steps to Complete

1. **Update seed.js**: Add tables for roles, permissions, menus, and relations (user_roles, role_permissions, menu_permissions). Insert sample data. ✅

2. **Update middleware/auth.js**: Modify to include user roles in JWT payload when verifying token. ✅

3. **Update routes/auth.js**: Update /me endpoint to return user data including roles. ✅

4. **Create middleware/requireRole.js**: New middleware to check if user has required role for access control. ✅

5. **Create routes/users.js**: Implement CRUD operations for users (GET, POST, PUT, DELETE) with role-based access (admin only). ✅

6. **Create routes/roles.js**: Implement CRUD operations for roles (GET, POST, PUT, DELETE) with admin access. ✅

7. **Create routes/permissions.js**: Implement CRUD operations for permissions (GET, POST, PUT, DELETE) with admin access. ✅

8. **Create routes/menus.js**: Implement CRUD operations for menus (GET, POST, PUT, DELETE) with admin access. ✅

9. **Update index.js**: Register new routes (/api/users, /api/roles, /api/permissions, /api/menus). ✅

10. **Add input validations**: Implement validations for email format, password strength, unique constraints, etc., in relevant routes. ✅ (Already implemented in routes)

11. **Test endpoints**: Run server and test CRUD operations using tools like Postman or curl. ✅

12. **Update client if needed**: Adjust client-side code to handle roles and permissions if necessary. ✅

## Client-Side Updates

13. **Create User Management Page**: Build React component for CRUD users with admin access. ✅

14. **Create Role Management Page**: Build React component for CRUD roles with admin access. ✅

15. **Create Permission Management Page**: Build React component for CRUD permissions with admin access. ✅

16. **Create Menu Management Page**: Build React component for CRUD menus with admin access. ✅

17. **Update Sidebar**: Make sidebar dynamic based on user permissions and menus from API. ✅

18. **Update Routing**: Add routes for new management pages in App.jsx. ✅

19. **Update Authentication Context**: Ensure user roles/permissions are stored and accessible in client. ✅

20. **Update Layout Component**: Wrap all pages with Layout component for consistent UI. ✅

## Additional Updates

21. **Enhance User CRUD**: Add gender and status fields to user management with improved modal layout (2-column grid). ✅
