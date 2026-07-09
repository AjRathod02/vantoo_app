-- Vendor permissions for Supabase (platform_auth schema)

INSERT INTO platform_auth.permissions (name, resource, action, description) VALUES
  ('stores:read', 'stores', 'read', 'View stores'),
  ('stores:create', 'stores', 'create', 'Create stores'),
  ('stores:update', 'stores', 'update', 'Update stores'),
  ('documents:read', 'documents', 'read', 'View KYC documents'),
  ('documents:upload', 'documents', 'upload', 'Upload KYC documents')
ON CONFLICT (name) DO NOTHING;

INSERT INTO platform_auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM platform_auth.roles r
CROSS JOIN platform_auth.permissions p
WHERE r.name IN ('restaurant_owner', 'grocery_store', 'ecommerce_seller', 'vendor')
  AND p.name IN (
    'products:read', 'products:create', 'products:update',
    'orders:read', 'orders:update', 'wallet:read',
    'stores:read', 'stores:create', 'stores:update',
    'documents:read', 'documents:upload'
  )
ON CONFLICT DO NOTHING;
