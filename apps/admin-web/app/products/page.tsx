export default function AdminProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Products</h1>
      <p className="mt-2 text-sm text-gray-500">
        Full product management is available at{" "}
        <a href="http://localhost:3000/admin/products" className="text-brand-primary underline">
          customer web admin
        </a>{" "}
        until auth cookies are unified across ports.
      </p>
    </div>
  );
}
