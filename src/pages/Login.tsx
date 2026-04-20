import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sun, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mantaLogo from "@/assets/manta-logo.png";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupRole, setSignupRole] = useState("owner");
  const [businessAddress, setBusinessAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await signUp(email, password, firstName, lastName, signupRole, businessAddress);
        if (error) throw error;
        toast({ title: "Account created", description: "You're now signed in." });
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const showBusinessAddress = !isLogin && (signupRole === "scaffolder" || signupRole === "engineer");

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* Hero panel — desktop only */}
      <aside className="hidden lg:flex relative overflow-hidden bg-sidebar text-sidebar-foreground">
        <div className="grain absolute inset-0" />
        {/* gradient wash */}
        <div
          aria-hidden
          className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full blur-3xl opacity-70"
          style={{ background: "radial-gradient(closest-side, hsl(22 96% 46% / 0.35), transparent)" }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(closest-side, hsl(43 100% 51% / 0.25), transparent)" }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3 animate-em-enter">
            <div className="h-10 w-10 rounded-xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
              <img src={mantaLogo} alt="" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <div className="font-display text-xl leading-none">Manta Ray Energy</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45 mt-1">
                Scaffold · Solar · Operations
              </div>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/25 px-3 py-1 animate-em-enter" style={{ animationDelay: "60ms" }}>
              <Sun className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Operations console</span>
            </div>
            <h2 className="font-display text-[56px] leading-[0.95] tracking-tight animate-em-enter" style={{ animationDelay: "120ms" }}>
              The sun doesn't pause.
              <br />
              <span className="font-display-italic text-primary">Neither should your ops.</span>
            </h2>
            <p className="text-sidebar-foreground/65 text-[15px] leading-relaxed animate-em-enter" style={{ animationDelay: "180ms" }}>
              One property. One install. Zero chat clutter. Just the status, the schedule, and the
              scaffolding crew — organised.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-sidebar-foreground/40 font-mono uppercase tracking-wider animate-em-enter" style={{ animationDelay: "240ms" }}>
            <span>© Manta Ray</span>
            <span>v2 · ember release</span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
              <img src={mantaLogo} alt="" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <div className="font-display text-lg leading-none">Manta Ray Energy</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Operations console
              </div>
            </div>
          </div>

          <div className="space-y-2 animate-em-enter">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              {isLogin ? "Welcome back" : "Create account"}
            </div>
            <h1 className="font-display text-[36px] leading-[1.05] tracking-tight text-foreground">
              {isLogin ? (
                <>Sign in to your <span className="font-display-italic">site.</span></>
              ) : (
                <>Join the <span className="font-display-italic">ember</span> crew.</>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Enter your credentials to continue."
                : "Tell us who you are — we'll route you to the right dashboard."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 animate-em-enter" style={{ animationDelay: "80ms" }}>
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Role</Label>
                  <Select value={signupRole} onValueChange={setSignupRole}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">System Owner</SelectItem>
                      <SelectItem value="scaffolder">Scaffolder</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                {showBusinessAddress && (
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Business address</Label>
                    <Input className="h-11" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="you@company.com"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
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
              <span>{submitting ? "Just a moment…" : isLogin ? "Sign in" : "Create account"}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-quick group-hover:translate-x-0.5" />
            </Button>
          </form>

          <div className="text-center animate-em-enter" style={{ animationDelay: "140ms" }}>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-quick"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? (
                <>No account yet? <span className="text-primary font-medium">Sign up</span></>
              ) : (
                <>Already registered? <span className="text-primary font-medium">Sign in</span></>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
