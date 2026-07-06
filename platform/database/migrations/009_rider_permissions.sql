-- Rider permissions + notification templates
-- Migration: 009_rider_permissions.sql

INSERT INTO auth.permissions (name, resource, action, description) VALUES
  ('deliveries:read', 'deliveries', 'read', 'View delivery tasks'),
  ('deliveries:accept', 'deliveries', 'accept', 'Accept delivery assignments'),
  ('deliveries:update', 'deliveries', 'update', 'Update delivery status'),
  ('location:update', 'location', 'update', 'Update GPS location'),
  ('earnings:read', 'earnings', 'read', 'View rider earnings')
ON CONFLICT (name) DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r
JOIN auth.permissions p ON p.name IN (
  'orders:read', 'orders:update', 'wallet:read',
  'deliveries:read', 'deliveries:accept', 'deliveries:update',
  'location:update', 'earnings:read', 'documents:read', 'documents:upload'
)
WHERE r.name = 'delivery_rider'
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r
JOIN auth.permissions p ON p.name IN ('riders:read', 'riders:manage', 'documents:verify')
WHERE r.name IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;

INSERT INTO notifications.notification_templates (name, channel, subject, body, variables) VALUES
  ('rider_application_submitted', 'email', 'Application Received', 'Your rider application has been submitted and is under review.', ARRAY[]::TEXT[]),
  ('rider_application_approved', 'email', 'Application Approved', 'Congratulations! Your rider account has been approved. You can now go online and accept deliveries.', ARRAY[]::TEXT[]),
  ('rider_application_rejected', 'email', 'Application Update', 'Your rider application was not approved. Reason: {{reason}}', ARRAY['reason']),
  ('rider_order_assigned', 'push', 'New Delivery', 'Order {{orderNumber}} is ready for pickup', ARRAY['orderNumber']),
  ('order_rider_assigned', 'push', 'Rider Assigned', 'Your order {{orderNumber}} has been assigned to {{riderName}}', ARRAY['orderNumber', 'riderName']),
  ('order_out_for_delivery', 'push', 'Out for Delivery', 'Your order {{orderNumber}} is on the way', ARRAY['orderNumber'])
ON CONFLICT (name) DO NOTHING;
