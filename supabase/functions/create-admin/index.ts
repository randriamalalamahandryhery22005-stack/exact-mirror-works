import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const email = "randriamalalamahandryhery@gmail.com";
    const password = "rand2104";

    // Find user by paginating
    let existing: any = null;
    let page = 1;
    while (page < 20) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      existing = data.users.find((u) => u.email === email);
      if (existing || data.users.length < 200) break;
      page++;
    }

    let userId: string;
    let action: string;
    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
      if (error) throw error;
      userId = existing.id;
      action = "updated";
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Admin KLS" },
      });
      if (error) throw error;
      userId = data.user!.id;
      action = "created";
    }

    // Ensure admin role
    await admin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );
    // Ensure profile
    await admin.from("profiles").upsert(
      { user_id: userId, full_name: "Admin KLS" },
      { onConflict: "user_id" }
    );

    return new Response(JSON.stringify({ ok: true, action, id: userId, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
