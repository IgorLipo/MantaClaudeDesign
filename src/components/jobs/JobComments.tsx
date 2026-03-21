import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notify } from "@/hooks/useNotificationTriggers";

interface Comment {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  channel: string;
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
}

const channelLabels: Record<string, string> = {
  admin_owner: "Owner",
  admin_scaffolder: "Scaffolder",
  admin_engineer: "Engineer",
};

interface JobCommentsProps {
  jobId: string;
  channel: string;
  jobTitle?: string;
  recipientIds?: string[];
}

export function JobComments({ jobId, channel, jobTitle, recipientIds }: JobCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("job_comments")
      .select("*")
      .eq("job_id", jobId)
      .eq("channel", channel)
      .order("created_at", { ascending: true });
    if (data) {
      setComments(data as Comment[]);
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        if (profs) {
          const map: Record<string, Profile> = {};
          profs.forEach((p: any) => { map[p.user_id] = p; });
          setProfiles(map);
        }
      }
    }
  };

  useEffect(() => {
    fetchComments();
    const ch = supabase
      .channel(`job-comments-${jobId}-${channel}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_comments", filter: `job_id=eq.${jobId}` }, () => {
        fetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [jobId, channel]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [comments]);

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("job_comments").insert({
      job_id: jobId, user_id: user.id, message: message.trim(), channel,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessage("");
      // Notify recipients
      if (recipientIds) {
        for (const rid of recipientIds) {
          if (rid !== user.id) {
            await notify({
              userId: rid, type: "message",
              title: "New Message",
              message: `New message on job "${jobTitle || ""}": "${message.trim().slice(0, 80)}"`,
              data: { job_id: jobId },
            });
          }
        }
      }
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getName = (userId: string) => {
    const p = profiles[userId];
    return p ? `${p.first_name} ${p.last_name}` : "Unknown";
  };

  const isOwn = (userId: string) => userId === user?.id;

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <MessageSquare className="h-4 w-4" />
          <span>Chat — {channelLabels[channel] || channel}</span>
          <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={scrollRef} className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No messages yet. Start the conversation.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className={`flex ${isOwn(c.user_id) ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isOwn(c.user_id) ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                  {!isOwn(c.user_id) && (
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">{getName(c.user_id)}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{c.message}</p>
                  <p className={`text-[9px] mt-1 ${isOwn(c.user_id) ? "opacity-60" : "text-muted-foreground"}`}>
                    {new Date(c.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 items-end pt-2 border-t border-border">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-[40px] max-h-24 resize-none text-sm"
          />
          <Button size="sm" disabled={sending || !message.trim()} onClick={handleSend} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
