import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Camera, Upload, CheckCircle2, AlertCircle, ArrowRight, Home,
  Sun, Ruler, Mountain, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PhotoStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  example: string;
}

const PHOTO_STEPS: PhotoStep[] = [
  {
    id: "front_exterior",
    title: "Front of Property",
    description: "Take a clear photo of the front of the house, showing the full building from the street.",
    icon: Home,
    required: true,
    example: "Stand across the street. Include the full house, roof line, and any visible obstructions.",
  },
  {
    id: "roof_panel_side",
    title: "Roof — Panel Side",
    description: "Photograph the side of the roof where panels will be installed.",
    icon: Sun,
    required: true,
    example: "Capture the roof slope clearly. Show chimneys, vents, skylights, or aerials on this side.",
  },
  {
    id: "rear_exterior",
    title: "Rear of Property",
    description: "Take a photo from the back garden showing the rear of the house and roof.",
    icon: Home,
    required: true,
    example: "Show the rear roof, any extensions, conservatories, or outbuildings.",
  },
  {
    id: "access_path",
    title: "Access Path / Side Gate",
    description: "Show how scaffolders will access the property — side gate, alley, or passageway.",
    icon: Ruler,
    required: true,
    example: "Include the width of the access path. Note any obstacles like bins, hedges, or low walls.",
  },
  {
    id: "height_reference",
    title: "Height / Floors",
    description: "Take a photo showing the number of floors and building height.",
    icon: Mountain,
    required: true,
    example: "Stand back to show the full height. If possible, include a person or known object for scale.",
  },
  {
    id: "obstacles",
    title: "Obstacles / Close-ups",
    description: "Photograph any obstacles: satellite dishes, power lines, trees near roof, narrow access, etc.",
    icon: Eye,
    required: false,
    example: "Capture anything that might affect scaffold erection or panel installation.",
  },
];

interface GuidedPhotoUploadProps {
  jobId: string;
  onComplete: () => void;
}

export function GuidedPhotoUpload({ jobId, onComplete }: GuidedPhotoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const step = PHOTO_STEPS[currentStep];
  const requiredDone = PHOTO_STEPS.filter((s) => s.required).every((s) => uploadedPhotos[s.id]);
  const totalUploaded = Object.keys(uploadedPhotos).length;
  const progress = (totalUploaded / PHOTO_STEPS.length) * 100;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${jobId}/${step.id}_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
    await supabase.from("photos").insert({
      job_id: jobId,
      uploader_id: user.id,
      url: urlData.publicUrl,
      review_status: "pending",
    });
    setUploadedPhotos((prev) => ({ ...prev, [step.id]: urlData.publicUrl }));
    toast({ title: `${step.title} uploaded` });
    setUploading(false);

    // Auto-advance to next step
    if (currentStep < PHOTO_STEPS.length - 1) {
      setTimeout(() => setCurrentStep((p) => p + 1), 500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-foreground">Photo Upload Progress</p>
          <span className="text-xs text-muted-foreground">{totalUploaded}/{PHOTO_STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PHOTO_STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(i)}
            className={cn(
              "flex items-center gap-1 text-[10px] px-2 py-1 rounded-full whitespace-nowrap font-medium transition-colors",
              i === currentStep ? "bg-primary text-primary-foreground" :
              uploadedPhotos[s.id] ? "bg-success/10 text-success" :
              "bg-secondary text-muted-foreground"
            )}
          >
            {uploadedPhotos[s.id] ? <CheckCircle2 className="h-3 w-3" /> : null}
            {s.title.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Current step card */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{step.title}</CardTitle>
              <div className="flex items-center gap-1 mt-0.5">
                {step.required ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Required</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Optional</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground">{step.description}</p>

          {/* Example tip */}
          <div className="bg-info/5 border border-info/20 rounded-xl p-3">
            <p className="text-xs text-info font-medium flex items-center gap-1 mb-1">
              <AlertCircle className="h-3.5 w-3.5" /> Photo tip
            </p>
            <p className="text-xs text-muted-foreground">{step.example}</p>
          </div>

          {/* Upload area */}
          {uploadedPhotos[step.id] ? (
            <div className="relative rounded-xl overflow-hidden border border-success/30">
              <img src={uploadedPhotos[step.id]} alt={step.title} className="w-full h-48 object-cover" />
              <div className="absolute top-2 right-2 bg-success text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Uploaded
              </div>
              <label className="absolute bottom-2 right-2 cursor-pointer">
              <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={handleUpload} />
                <Button size="sm" variant="secondary" className="text-xs" asChild>
                  <span>Replace</span>
                </Button>
              </label>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                {uploading ? (
                  <div className="animate-pulse">
                    <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Take or select photo</p>
                    <p className="text-xs text-muted-foreground mt-1">Tap to open camera or gallery</p>
                  </>
                )}
              </div>
            </label>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((p) => p - 1)}
        >
          Previous
        </Button>

        {currentStep < PHOTO_STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setCurrentStep((p) => p + 1)}>
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={!requiredDone}
            onClick={onComplete}
            className="bg-success hover:bg-success/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> Complete Submission
          </Button>
        )}
      </div>
    </div>
  );
}
