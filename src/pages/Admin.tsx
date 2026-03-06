import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, Trash2, Edit3, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

interface UserProfile {
  user_id: string;
  display_name: string;
  green_points: number;
  total_scans: number;
  co2_saved: number;
  email: string;
}

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);

  if (loading) return <div className="container py-10 text-center text-muted-foreground">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin", {
        body: null,
        headers: {},
      });
      // Use GET with query params
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin?action=users`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch users");
      const result = await response.json();
      setUsers(result);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updatePoints = async (targetUserId: string, points: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin?action=update-points`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId: targetUserId, points }),
        }
      );
      if (!response.ok) throw new Error("Failed to update points");
      toast.success("Points updated!");
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteUser = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin?action=delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId: targetUserId }),
        }
      );
      if (!response.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="font-display text-2xl font-bold gradient-text">Admin Portal</h1>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loadingUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="neon-card rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="font-display text-xl font-bold">{users.length}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </div>
          <div className="neon-card rounded-xl p-4 text-center">
            <div className="font-display text-xl font-bold text-primary">
              {users.reduce((sum, u) => sum + u.green_points, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
          <div className="neon-card rounded-xl p-4 text-center">
            <div className="font-display text-xl font-bold text-primary">
              {users.reduce((sum, u) => sum + u.total_scans, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Scans</div>
          </div>
        </div>

        {/* Users table */}
        <div className="neon-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display text-xs uppercase text-muted-foreground">User</th>
                  <th className="text-left p-4 font-display text-xs uppercase text-muted-foreground">Email</th>
                  <th className="text-right p-4 font-display text-xs uppercase text-muted-foreground">Points</th>
                  <th className="text-right p-4 font-display text-xs uppercase text-muted-foreground">Scans</th>
                  <th className="text-right p-4 font-display text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-4 font-medium">{u.display_name || "—"}</td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4 text-right">
                      {editingUser === u.user_id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded bg-secondary border border-border text-foreground text-sm"
                          />
                          <button
                            onClick={() => updatePoints(u.user_id, editPoints)}
                            className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-primary font-bold">{u.green_points}</span>
                      )}
                    </td>
                    <td className="p-4 text-right text-muted-foreground">{u.total_scans}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => {
                            setEditingUser(u.user_id);
                            setEditPoints(u.green_points);
                          }}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          title="Edit points"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteUser(u.user_id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {loadingUsers ? "Loading..." : "No users found"}
                    </td>
                  </tr>
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
