import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  review_status: string;
  created_at: string;
}

const REVIEW_ACTIONS = [
  { id: "approved", label: "Approved", color: "bg-success hover:bg-success/90 text-white" },
  { id: "reshoot_another", label: "Please upload another photo", color: "bg-warning hover:bg-warning/90 text-white" },
  { id: "reshoot_clearer", label: "Please upload a clearer photo", color: "bg-warning hover:bg-warning/90 text-white" },
  { id: "reshoot_wider", label: "Please upload a wider angle", color: "bg-warning hover:bg-warning/90 text-white" },
  { id: "reshoot_closer", label: "Please upload a closer photo", color: "bg-warning hover:bg-warning/90 text-white" },
];

interface AdminPhotoGalleryProps {
  photos: Photo[];
  onReview: (photoId: string, action: string, comment?: string) => void;
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function AdminPhotoGallery({
  photos,
  onReview,
  open,
  onClose,
  initialIndex = 0,
}: AdminPhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [comment, setComment] = useState("");
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setShowActions(false);
    setComment("");
  }, [initialIndex, open]);

  if (!open || photos.length === 0) return null;

  const photo = photos[currentIndex];
  const goNext = () =>
    setCurrentIndex((i) => Math.min(i + 1, photos.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  const handleAction = (action: string) => {
    onReview(photo.id, action, comment || undefined);
    setComment("");
    setShowActions(false);
    if (currentIndex < photos.length - 1) {
      goNext();
    } else {
      onClose();
    }
  };

  // Swipe support
  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < photos.length - 1) goNext();
      if (diff < 0 && currentIndex > 0) goPrev();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="text-white text-sm">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              photo.review_status === "approved" &&
                "bg-success/20 text-success",
              photo.review_status === "rejected" &&
                "bg-destructive/20 text-destructive",
              photo.review_status === "pending" && "bg-warning/20 text-warning"
            )}
          >
            {photo.review_status}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image with swipe */}
      <div
        className="flex-1 flex items-center justify-center relative px-12"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 text-white hover:bg-white/20 h-12 w-12"
            onClick={goPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        <img
          src={photo.url}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-[55vh] object-contain rounded-lg"
        />
        {currentIndex < photos.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 text-white hover:bg-white/20 h-12 w-12"
            onClick={goNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Actions */}
      {photo.review_status === "pending" && (
        <div className="p-4 space-y-3">
          {showActions ? (
            <div className="space-y-2 animate-fade-in">
              <Textarea
                placeholder="Optional comment to owner..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <div className="flex flex-wrap gap-2">
                {REVIEW_ACTIONS.map((a) => (
                  <Button
                    key={a.id}
                    size="sm"
                    className={cn("text-xs", a.color)}
                    onClick={() => handleAction(a.id)}
                  >
                    {a.id === "approved" && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {a.label}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60"
                onClick={() => setShowActions(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={() => setShowActions(true)}
            >
              Review This Photo
            </Button>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 p-3 overflow-x-auto justify-center">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setCurrentIndex(i);
              setShowActions(false);
              setComment("");
            }}
            className={cn(
              "h-12 w-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
              i === currentIndex
                ? "border-white scale-110"
                : "border-transparent opacity-60"
            )}
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
