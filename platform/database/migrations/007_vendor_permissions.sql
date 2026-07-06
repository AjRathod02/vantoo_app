-- Vendor role permissions + notification templates
-- Migration: 007_vendor_permissions.sql

INSERT INTO auth.permissions (name, resource, action, description) VALUES
  ('stores:read', 'stores', 'read', 'View stores'),
  ('stores:create', 'stores', 'create', 'Create stores'),
  ('stores:update', 'stores', 'update', 'Update stores'),
  ('stores:delete', 'stores', 'delete', 'Delete stores'),
  ('documents:read', 'documents', 'read', 'View KYC documents'),
  ('documents:upload', 'documents', 'upload', 'Upload KYC documents'),
  ('documents:verify', 'documents', 'verify', 'Verify KYC documents')
ON CONFLICT (name) DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r
CROSS JOIN auth.permissions p
WHERE r.name IN ('restaurant_owner', 'grocery_store', 'ecommerce_seller', 'vendor')
  AND p.name IN (
    'products:read', 'products:create', 'products:update',
    'orders:read', 'orders:update', 'wallet:read',
    'stores:read', 'stores:create', 'stores:update',
    'documents:read', 'documents:upload'
  )
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r
JOIN auth.permissions p ON p.name IN ('vendors:read', 'vendors:approve', 'vendors:manage', 'documents:verify')
WHERE r.name IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;

INSERT INTO notifications.notification_templates (name, channel, subject, body, variables) VALUES
  ('vendor_application_submitted', 'email', 'Application Received', 'Your vendor application for {{businessName}} has been submitted and is under review.', ARRAY['businessName']),
  ('vendor_application_approved', 'email', 'Application Approved', 'Congratulations! Your vendor account {{businessName}} has been approved. You can now start selling on Vantoo.', ARRAY['businessName']),
  ('vendor_application_rejected', 'email', 'Application Update', 'Your vendor application for {{businessName}} was not approved. Reason: {{reason}}', ARRAY['businessName', 'reason']),
  ('vendor_new_order', 'push', 'New Order', 'You have a new order {{orderNumber}} worth ₹{{amount}}', ARRAY['orderNumber', 'amount'])
ON CONFLICT (name) DO NOTHING;
