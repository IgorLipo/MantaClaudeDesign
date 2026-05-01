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

const loginVideoUrl = "https://nmdbngcwmrgqtpzukwkf.supabase.co/storage/v1/object/public/assets/login-background.mp4";

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
    <div className="min-h-screen w-full relative bg-background overflow-hidden">
      {/* ── Full-page video background ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover brightness-[1.4]"
      >
        <source src={loginVideoUrl} type="video/mp4" />
      </video>

      {/* Dark vignette overlay for readability */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

      {/* Ember glow orbs */}
      <div
        aria-hidden
        className="fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(closest-side, hsl(22 96% 46% / 0.35), transparent)" }}
      />
      <div
        aria-hidden
        className="fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(closest-side, hsl(43 100% 51% / 0.2), transparent)" }}
      />

      {/* Grain overlay */}
      <div className="grain fixed inset-0" />

      {/* ── Content grid ── */}
      <div className="relative z-10 min-h-screen w-full grid lg:grid-cols-[1.05fr_1fr]">
        {/* Hero panel — content only, no video */}
        <aside className="hidden lg:flex flex-col justify-between p-12 text-sidebar-foreground">
          <div className="flex items-center gap-6 animate-em-enter">
            <img src={mantaLogo} alt="" className="h-36 w-auto object-contain drop-shadow-2xl" />
            <div>
              <div className="font-display text-[28px] leading-none drop-shadow-lg text-white">Manta Ray Energy</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50 mt-1.5">
                Scaffold · Solar · Operations
              </div>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/25 px-3 py-1 animate-em-enter backdrop-blur-sm" style={{ animationDelay: "60ms" }}>
              <Sun className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Operations console</span>
            </div>
            <h2 className="font-display text-[56px] leading-[0.95] tracking-tight animate-em-enter text-white" style={{ animationDelay: "120ms" }}>
              The sun doesn't pause.
              <br />
              <span className="font-display-italic text-primary">Neither should your ops.</span>
            </h2>
            <p className="text-white/65 text-[15px] leading-relaxed animate-em-enter" style={{ animationDelay: "180ms" }}>
              One property. One install. Zero chat clutter. Just the status, the schedule, and the
              scaffolding crew — organised.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/40 font-mono uppercase tracking-wider animate-em-enter" style={{ animationDelay: "240ms" }}>
            <span>© Manta Ray</span>
            <span>v2 · ember release</span>
          </div>
        </aside>

        {/* Form panel — glass card on top of video */}
        <section className="relative flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-[400px] space-y-8 bg-black/60 backdrop-blur-sm lg:bg-white/10 lg:backdrop-blur-2xl rounded-2xl p-6 sm:p-8 ring-1 ring-white/15 shadow-2xl">
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-3">
              <img src={mantaLogo} alt="" className="h-32 w-auto object-contain drop-shadow-2xl" />
              <div>
                <div className="font-display text-lg leading-none text-white drop-shadow-sm">Manta Ray Energy</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 mt-0.5">
                  Operations console
                </div>
              </div>
            </div>

            <div className="space-y-3 animate-em-enter">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-sm ring-1 ring-primary/30 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white font-medium">
                  {isLogin ? "Welcome back" : "Create account"}
                </span>
              </div>
              <h1 className="font-display text-[32px] sm:text-[36px] leading-[1.05] tracking-tight text-white drop-shadow-lg">
                {isLogin ? (
                  <>Sign in to your <span className="font-display-italic text-primary">site.</span></>
                ) : (
                  <>Join the <span className="font-display-italic text-primary">ember</span> crew.</>
                )}
              </h1>
              <p className="text-sm text-white/70 leading-relaxed">
                {isLogin
                  ? "Enter your credentials to continue."
                  : "Tell us who you are — we'll route you to the right dashboard."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 animate-em-enter" style={{ animationDelay: "80ms" }}>
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[10px] uppercase tracking-wider text-white/80">Role</Label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger className="h-11 bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">System Owner</SelectItem>
                        <SelectItem value="scaffolder">Scaffolder</SelectItem>
                        <SelectItem value="engineer">Engineer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-wider text-white/80">First name</Label>
                      <Input className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-wider text-white/80">Last name</Label>
                      <Input className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  {showBusinessAddress && (
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-wider text-white/80">Business address</Label>
                      <Input className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-white/80">Email</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-white/80">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-quick"
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
                className="text-sm text-white/70 hover:text-primary transition-colors duration-quick"
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
    </div>
  );
}
