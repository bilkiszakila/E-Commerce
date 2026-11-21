"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { getIsAdmin } from "../../lib/supabase/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/admin");
        return;
      }

      if (!(await getIsAdmin(data.session.user.id))) {
        router.replace("/");
        return;
      }

      setAllowed(true);
    });
  }, [router]);

  if (!allowed) {
    return <main className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Memverifikasi akses admin...</main>;
  }

  return <>{children}</>;
}
