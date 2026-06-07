import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("role, is_active")
    .eq("id", session.user.id)
    .single();

  if (!adminProfile || !adminProfile.is_active) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <AdminSidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
