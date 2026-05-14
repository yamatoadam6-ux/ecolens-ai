import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, Trash2, Edit3, Users, RefreshCw, Send, Download, Bell, UserCog, Cloud, Recycle } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

interface UserProfile {
  user_id: string;
  display_name: string;
  green_points: number;
  total_scans: number;
  co2_saved: number;
  email: string;
  roles: string[];
}

interface Notification {
  id: string;
  title: string;
  body: string;
  active: boolean;
  created_at: string;
}

const apiCall = async (path: string, init?: RequestInit) => {
  const session = (await supabase.auth.getSession()).data.session;
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(init?.headers || {}),
    },
  });
};

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const r = await apiCall("?action=users");
      if (!r.ok) throw new Error("Failed to fetch users");
      setUsers(await r.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
      fetchNotifications();
    }
  }, [user, isAdmin]);

  if (loading) return <div className="container py-10 text-center text-muted-foreground">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const totals = useMemo(() => ({
    users: users.length,
    scans: users.reduce((s, u) => s + (u.total_scans || 0), 0),
    co2: users.reduce((s, u) => s + Number(u.co2_saved || 0), 0),
    points: users.reduce((s, u) => s + (u.green_points || 0), 0),
  }), [users]);

  const updatePoints = async (targetUserId: string, points: number) => {
    try {
      const r = await apiCall("?action=update-points", { method: "POST", body: JSON.stringify({ userId: targetUserId, points }) });
      if (!r.ok) throw new Error("Failed to update");
      toast.success("Points updated");
      setEditingUser(null);
      fetchUsers();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteUser = async (targetUserId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      const r = await apiCall("?action=delete-user", { method: "POST", body: JSON.stringify({ userId: targetUserId }) });
      if (!r.ok) throw new Error("Failed to delete");
      toast.success("User deleted");
      fetchUsers();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleRole = async (targetUserId: string, role: "admin" | "moderator", hasRole: boolean) => {
    try {
      const action = hasRole ? "revoke-role" : "grant-role";
      const r = await apiCall(`?action=${action}`, { method: "POST", body: JSON.stringify({ userId: targetUserId, role }) });
      if (!r.ok) throw new Error("Failed to update role");
      toast.success(hasRole ? `${role} revoked` : `${role} granted`);
      fetchUsers();
    } catch (e: any) { toast.error(e.message); }
  };

  const broadcast = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error("Title and message required");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        title: notifTitle.trim(),
        body: notifBody.trim(),
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Broadcast sent to all users");
      setNotifTitle("");
      setNotifBody("");
      fetchNotifications();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const toggleNotifActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("notifications").update({ active: !active }).eq("id", id);
    if (error) toast.error(error.message);
    else fetchNotifications();
  };

  const deleteNotif = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) toast.error(error.message);
    else fetchNotifications();
  };

  const exportCSV = () => {
    const rows = [
      ["Username", "Email", "Green Points", "Total Scans", "CO2 Saved (kg)"],
      ...users.map((u) => [
        u.display_name || "",
        u.email,
        String(u.green_points),
        String(u.total_scans),
        Number(u.co2_saved).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecolens-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const liveStats = [
    { label: "Total Users", value: totals.users.toLocaleString(), icon: Users },
    { label: "Items Recycled", value: totals.scans.toLocaleString(), icon: Recycle },
    { label: "CO₂ Saved (kg)", value: totals.co2.toFixed(1), icon: Cloud },
    { label: "Total Points", value: totals.points.toLocaleString(), icon: Shield },
  ];

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="font-display text-2xl font-bold gradient-text">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold neon-button">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={fetchUsers} disabled={loadingUsers} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Live Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {liveStats.map((s) => (
            <div key={s.label} className="neon-card rounded-xl p-4 text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="font-display text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Broadcast */}
        <div className="neon-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold">Global Notification Broadcast</h2>
          </div>
          <div className="space-y-3">
            <input
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Notification title (e.g. Recycle Reminder)"
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
            />
            <textarea
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              placeholder="Message to all users (e.g. Don't forget to recycle today!)"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm resize-none"
            />
            <button
              onClick={broadcast}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold neon-button disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Broadcast to All Users"}
            </button>
          </div>

          {notifications.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="text-xs font-display uppercase text-muted-foreground">Recent Broadcasts</div>
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm font-bold flex items-center gap-2">
                      {n.title}
                      {!n.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">inactive</span>}
                    </div>
                    <div className="text-xs text-muted-foreground break-words">{n.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => toggleNotifActive(n.id, n.active)} className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80">
                    {n.active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => deleteNotif(n.id)} className="p-1.5 rounded hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users + Role Management */}
        <div className="neon-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold">User & Role Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-display text-xs uppercase text-muted-foreground">User</th>
                  <th className="text-left p-3 font-display text-xs uppercase text-muted-foreground">Email</th>
                  <th className="text-right p-3 font-display text-xs uppercase text-muted-foreground">Points</th>
                  <th className="text-right p-3 font-display text-xs uppercase text-muted-foreground">Scans</th>
                  <th className="text-center p-3 font-display text-xs uppercase text-muted-foreground">Roles</th>
                  <th className="text-right p-3 font-display text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdminRow = u.roles?.includes("admin");
                  const isModRow = u.roles?.includes("moderator");
                  return (
                    <tr key={u.user_id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-3 font-medium">{u.display_name || "—"}</td>
                      <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="p-3 text-right">
                        {editingUser === u.user_id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              value={editPoints}
                              onChange={(e) => setEditPoints(Number(e.target.value))}
                              className="w-20 px-2 py-1 rounded bg-secondary border border-border text-sm"
                            />
                            <button onClick={() => updatePoints(u.user_id, editPoints)} className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-bold">Save</button>
                            <button onClick={() => setEditingUser(null)} className="px-2 py-1 rounded bg-secondary text-xs">×</button>
                          </div>
                        ) : (
                          <span className="text-primary font-bold">{u.green_points}</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{u.total_scans}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-center flex-wrap">
                          <button
                            onClick={() => toggleRole(u.user_id, "admin", isAdminRow)}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${isAdminRow ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                          >
                            ADMIN
                          </button>
                          <button
                            onClick={() => toggleRole(u.user_id, "moderator", isModRow)}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${isModRow ? "bg-primary/70 text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                          >
                            MOD
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => { setEditingUser(u.user_id); setEditPoints(u.green_points); }} className="p-2 rounded-lg hover:bg-secondary" title="Edit points">
                            <Edit3 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => deleteUser(u.user_id)} className="p-2 rounded-lg hover:bg-destructive/10" title="Delete user">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{loadingUsers ? "Loading..." : "No users found"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Admin;
