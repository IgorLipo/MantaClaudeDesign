import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;
const ENTITIES = ["all", "job", "quote", "photo", "region", "user", "assignment"];

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (entityFilter !== "all") query = query.eq("entity", entityFilter);
    if (search) query = query.or(`action.ilike.%${search}%,entity.ilike.%${search}%`);

    const { data, count } = await query;
    if (data) {
      setLogs(data);
      // Fetch profile names for user_ids
      const userIds = [...new Set(data.map((l) => l.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
        if (profs) {
          const map: Record<string, string> = {};
          profs.forEach((p) => { map[p.user_id] = `${p.first_name} ${p.last_name}`.trim(); });
          setProfiles(map);
        }
      }
    }
    if (count !== null) setTotal(count);
    setLoading(false);
  }, [page, entityFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return "text-success";
    if (action.includes("update") || action.includes("change")) return "text-warning";
    if (action.includes("delete") || action.includes("cancel")) return "text-destructive";
    return "text-info";
  };

  return (
    <div className="p-4 lg:p-10 space-y-5 max-w-5xl mx-auto animate-em-enter">
      <div className="space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Trail</span>
        <h1 className="font-display text-4xl lg:text-5xl leading-[1.02] tracking-tight text-foreground">
          Audit <span className="font-display-italic text-primary">log.</span>
        </h1>
        <p className="text-sm text-muted-foreground"><span className="tabular-nums font-medium text-foreground">{total}</span> entries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTITIES.map((e) => (
              <SelectItem key={e} value={e} className="capitalize">{e === "all" ? "All entities" : e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No audit logs found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm font-medium", actionColor(log.action))}>{log.action}</span>
                        <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground capitalize">{log.entity}</span>
                      </div>
                      {log.entity_id && (
                        <p className="text-xs text-muted-foreground mt-1 truncate font-mono">{log.entity_id}</p>
                      )}
                      {log.user_id && profiles[log.user_id] && (
                        <p className="text-xs text-muted-foreground mt-1">by {profiles[log.user_id]}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
