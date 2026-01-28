import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { quickExportCSV } from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActivityDetailModal } from "./modals/ActivityDetailModal";
import { toast } from "sonner";

interface Activity {
  id: string;
  initials: string;
  name: string;
  action: string;
  timeAgo: string;
  highlight?: boolean;
}

const activities: Activity[] = [
  {
    id: '1',
    initials: 'SC',
    name: 'Sarah Chen',
    action: 'Approved budget increase',
    timeAgo: '2h'
  },
  {
    id: '2',
    initials: 'MJ',
    name: 'Mike Johnson',
    action: 'Exported Q3 P&L Report',
    timeAgo: '5h'
  },
  {
    id: '3',
    initials: 'ED',
    name: 'Emma Davis',
    action: 'Reconciled Stripe payouts',
    timeAgo: '1d',
    highlight: true
  }
];

export function TeamActivity() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  return (
    <>
      <article className="card-elevated rounded-3xl bg-card p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-foreground">Team Activity</h2>
            <p className="text-xs text-muted-foreground">Recent audits</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition">
                <History className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => toast.info("Activity Log", { description: "Full activity log would open here." })}>
                View All Activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Filter", { description: "Activity filters would display." })}>
                Filter by Team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => quickExportCSV(
                ['Name', 'Action', 'Time'],
                activities.map(a => [a.name, a.action, `${a.timeAgo} ago`]),
                `team-activity-${new Date().toISOString().split('T')[0]}`
              )}>
                Export Log (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded-lg transition-colors"
              onClick={() => handleActivityClick(activity)}
            >
              <div className={cn(
                "h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center font-medium text-xs",
                activity.highlight 
                  ? "bg-accent/10 text-accent" 
                  : "bg-muted text-muted-foreground"
              )}>
                {activity.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{activity.name}</p>
                <p className="truncate text-xs text-muted-foreground">{activity.action}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{activity.timeAgo}</span>
            </div>
          ))}
        </div>
      </article>

      <ActivityDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        activity={selectedActivity}
      />
    </>
  );
}
