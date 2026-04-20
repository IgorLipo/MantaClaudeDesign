import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Sparkles, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mantaLogo from "@/assets/manta-logo.png";

export default function InviteRedeem() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [invite, setInvite] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!token) return;
      const { data: inv } = await (supabase as any)
        .from("job_invites")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (!inv) { setError("This invite link is invalid."); setChecking(false); return; }
      if (new Date(inv.expires_at) < new Date()) { setError("This invite link has expired."); setChecking(false); return; }
      setInvite(inv);
      const { data: j } = await supabase.from("jobs").select("case_no, title, address").eq("id", inv.job_id).maybeSingle();
      setJob(j);
      setChecking(false);
    };
    fetch();
  }, [token]);

  useEffect(() => {
    if (!user || !invite || redeeming) return;
    const redeem = async () => {
      setRedeeming(true);
      const { data, error: rpcErr } = await (supabase as any).rpc("redeem_job_invite", { _token: token });
      if (rpcErr) {
        toast({ title: "Could not accept invite", description: rpcErr.message, variant: "destructive" });
        setError(rpcErr.message);
        setRedeeming(false);
        return;
      }
      navigate(`/onboarding/${data}`, { replace: true });
    };
    redeem();
  }, [user, invite, token, navigate, toast, redeeming]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error: e1 } = await signIn(email, password);
        if (e1) throw e1;
      } else {
        const { error: e2 } = await signUp(email, password, firstName, lastName, "owner");
        if (e2) throw e2;
      }
    } catch (err: any) {
      toast({ title: "Authentication failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-mono text-[11px] uppercase tracking-wider">Validating invite</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card rounded-xl ring-1 ring-border shadow-lg p-8 text-center space-y-4 animate-em-enter">
          <div className="mx-auto h-12 w-12 rounded-full bg-status-cancelled-soft text-status-cancelled flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground">Invite unavailable</h1>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/login")}>Go to sign in</Button>
        </div>
      </div>
    );
  }

  if (user && redeeming) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-mono text-[11px] uppercase tracking-wider">Linking you to this job</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px] space-y-8 animate-em-enter">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <img src={mantaLogo} alt="" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Manta Ray Energy</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Owner onboarding</div>
          </div>
        </div>

        {/* Invite card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-soft via-card to-card ring-1 ring-primary/15 p-6 shadow-sm">
          <div
            aria-hidden
            className="absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl opacity-60"
            style={{ background: "radial-gradient(closest-side, hsl(22 96% 46% / 0.35), transparent)" }}
          />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 ring-1 ring-primary/25 px-2.5 py-0.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">You're invited</span>
            </div>
            <h1 className="font-display text-[32px] leading-[1.05] tracking-tight text-foreground">
              Set up your <span className="font-display-italic">solar</span> site.
            </h1>
            {job?.case_no && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground">
                  {job.case_no}
                </span>
                {job.address && (
                  <>
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{job.address}</span>
                  </>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Create your account and we'll walk you through the property details in under three minutes.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">First name</Label>
                <Input className="h-11" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Last name</Label>
                <Input className="h-11" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input
              type="email"
              placeholder="you@home.com"
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Password <span className="text-muted-foreground/60 normal-case">· min 6 characters</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-quick"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 group shadow-sm hover:shadow-glow" disabled={submitting}>
            <span>
              {submitting
                ? "Just a moment…"
                : mode === "signup"
                ? "Create account & continue"
                : "Sign in & continue"}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-quick group-hover:translate-x-0.5" />
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-quick"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? (
              <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
            ) : (
              <>Don't have an account yet? <span className="text-primary font-medium">Sign up</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
