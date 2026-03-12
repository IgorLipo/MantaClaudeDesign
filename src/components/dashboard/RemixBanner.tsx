import { Brain, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const DSV_URL = "https://dsv.com";

export function RemixBanner() {
  return (
    <div className="mb-6 rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-4 sm:p-5 shadow-lg shadow-primary/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur-sm">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-primary-foreground">
              AI Spending Intelligence for DSV
            </h2>
            <p className="text-xs sm:text-sm text-primary-foreground/70 mt-0.5">
              Track, optimize, and forecast your AI infrastructure costs across all departments
            </p>
          </div>
        </div>
        
        <Button
          asChild
          size="sm"
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md gap-2 w-full sm:w-auto justify-center"
        >
          <a href={DSV_URL} target="_blank" rel="noopener noreferrer">
            Visit DSV
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
