import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export const NotificationBanner = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const load = async () => {
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, title, body, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      const { data: reads } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);
      const readIds = new Set((reads ?? []).map((r) => r.notification_id));
      const unread = (notifs ?? []).filter((n) => !readIds.has(n.id));
      if (mounted) setItems(unread);
    };

    load();
    const channel = supabase
      .channel("notif-banner")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const dismiss = async (id: string) => {
    if (!user) return;
    setItems((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notification_reads").insert({ notification_id: id, user_id: user.id });
  };

  if (!user || items.length === 0) return null;

  return (
    <div className="container pt-3 space-y-2">
      <AnimatePresence>
        {items.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="neon-card rounded-xl p-3 flex items-start gap-3 border border-primary/30 bg-primary/5"
          >
            <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm font-bold text-primary">{n.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 break-words">{n.body}</div>
            </div>
            <button onClick={() => dismiss(n.id)} className="p-1 rounded hover:bg-secondary shrink-0" aria-label="Dismiss">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
