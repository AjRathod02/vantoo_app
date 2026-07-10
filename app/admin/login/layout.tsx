import { Suspense } from "react";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      {children}
    </Suspense>
  );
}
