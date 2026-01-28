import { Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface LiquidityHeroCardProps {
  totalLiquidity: string;
  monthlyBurn: string;
  runwayMonths: number;
}

export function LiquidityHeroCard({ 
  totalLiquidity = "$4,285,102", 
  monthlyBurn = "$324,000",
  runwayMonths = 18 
}: LiquidityHeroCardProps) {
  const handleViewDetails = () => {
    toast.info("Liquidity Details", {
      description: "Full cash flow breakdown would open in a detailed view.",
    });
  };

  return (
    <article className="glass-dark glow-accent relative h-80 overflow-hidden rounded-3xl shadow-dark">
      {/* Decorative blur */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      
      <div className="relative flex h-full flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-primary-foreground/60">Total Liquidity</p>
            <h2 className="mt-1 text-3xl font-medium tracking-tight">{totalLiquidity}</h2>
          </div>
          <div className="rounded-full bg-primary/50 p-2 ring-1 ring-inset ring-primary-foreground/10">
            <Shield className="h-5 w-5 text-success" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-medium text-primary-foreground/90">Run it clean. Share with confidence.</p>
          <p className="text-xs text-primary-foreground/50 max-w-[240px] leading-relaxed">
            Cash runway is stable at {runwayMonths} months based on current burn rate.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-primary-foreground/10 pt-4">
          <div>
            <p className="text-xs text-primary-foreground/60">Monthly Burn</p>
            <p className="text-sm font-medium">{monthlyBurn}</p>
          </div>
          <button 
            onClick={handleViewDetails}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground text-primary transition-all hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
