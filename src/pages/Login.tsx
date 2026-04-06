import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HardHat, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        const { error } = await signUp(email, password, firstName, lastName);
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

  const [creatingDemo, setCreatingDemo] = useState(false);

  const fillDemo = (role: string) => {
    const demos: Record<string, { email: string; password: string }> = {
      admin: { email: "admin@solarops.co.uk", password: "admin123" },
      owner: { email: "john.smith@email.co.uk", password: "owner123" },
      scaffolder: { email: "apex@scaffolding.co.uk", password: "scaffold123" },
      engineer: { email: "joe@solarops.co.uk", password: "engineer123" },
    };
    const d = demos[role];
    if (d) { setEmail(d.email); setPassword(d.password); }
  };

  const handleNewOwnerDemo = async () => {
    setCreatingDemo(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-demo-owner");
      if (error || !data?.email) throw new Error(error?.message || "Failed to create demo account");
      const { error: signInErr } = await signIn(data.email, data.password);
      if (signInErr) throw signInErr;
      navigate("/new-job");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <HardHat className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Manta Ray Energy</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            )}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {isLogin && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">Demo access (review only)</p>
              <div className="grid grid-cols-2 gap-2">
                {["admin", "scaffolder", "engineer"].map((r) => (
                  <Button key={r} variant="outline" size="sm" className="text-xs capitalize" onClick={() => fillDemo(r)}>
                    {r}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="text-xs" onClick={() => fillDemo("owner")}>
                  Existing Owner
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs border-primary/30 text-primary"
                disabled={creatingDemo}
                onClick={handleNewOwnerDemo}
              >
                {creatingDemo ? "Creating demo..." : "New Owner Demo →"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
