import { LucideIcon, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { KPIDetailModal } from "./modals/KPIDetailModal";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    direction: 'up' | 'stable' | 'down';
    value?: string;
    label?: string;
  };
  progress?: number;
}

export function KPICard({ title, value, icon: Icon, trend, progress }: KPICardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="card-elevated hover-lift rounded-3xl bg-card p-5 transition-all cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <p className="text-xs font-medium">{title}</p>
          <Icon className="h-[18px] w-[18px] text-accent" />
        </div>
        
        <div className="mt-4">
          <p className="text-2xl font-medium tracking-tight text-foreground">{value}</p>
          
          {trend && (
            <div className="mt-1 flex items-center gap-1">
              {trend.direction === 'up' ? (
                <>
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs font-medium text-success">{trend.value}</span>
                </>
              ) : (
                <>
                  <Minus className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{trend.value || 'Stable'}</span>
                </>
              )}
              {trend.label && (
                <span className="text-[10px] text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
          
          {progress !== undefined && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress >= 100 ? "bg-success" : "bg-accent"
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <KPIDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={title}
        value={value}
        trend={trend}
        progress={progress}
      />
    </>
  );
}
