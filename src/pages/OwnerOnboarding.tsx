import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Camera, ArrowRight, ArrowLeft, MapPin, CheckCircle2,
  Upload, Home, Ruler, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import {
  notifyOwnerPhotoSubmitted,
  notifyPhotoUploaded,
} from "@/hooks/useNotificationTriggers";

declare global {
  interface Window {
    google: any;
  }
}

const PHOTO_STEPS = [
  {
    id: "front",
    title: "Front of Building",
    instruction:
      "Take a clear photo of the front of the house, showing the full building from the street.",
    icon: Home,
    required: true,
  },
  {
    id: "access",
    title: "Access Area",
    instruction:
      "Show how workers will access the property — side gate, alley, or main entrance.",
    icon: Ruler,
    required: true,
  },
  {
    id: "side",
    title: "Side Angle",
    instruction:
      "If relevant, capture a side view showing the roof slope and any obstacles.",
    icon: Eye,
    required: false,
  },
];

export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const jobId = useRef(crypto.randomUUID()).current;

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(51.5074);
  const [lng, setLng] = useState(-0.1278);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [serviceType, setServiceType] = useState("new_job");

  const [photos, setPhotos] = useState<
    Record<string, { url: string; storageUrl: string }>
  >({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsKey, setMapsKey] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initDone = useRef(false);

  // Fetch Google Maps key
  useEffect(() => {
    supabase.functions
      .invoke("get-maps-key")
      .then(({ data }) => {
        if (data?.key) setMapsKey(data.key);
      })
      .catch(console.error);
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!mapsKey || mapsLoaded) return;
    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
    script.async = true;
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);
  }, [mapsKey, mapsLoaded]);

  // Init map + autocomplete
  useEffect(() => {
    if (step !== 0 || !mapsLoaded || !mapRef.current || !inputRef.current)
      return;
    if (initDone.current) return;
    initDone.current = true;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      map,
      position: { lat, lng },
      draggable: true,
      visible: false,
    });
    markerRef.current = marker;

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      setLat(pos.lat());
      setLng(pos.lng());
    });

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ["address"], componentRestrictions: { country: "gb" } }
    );
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const loc = place.geometry.location;
        map.setCenter(loc);
        map.setZoom(19);
        marker.setPosition(loc);
        marker.setVisible(true);
        setLat(loc.lat());
        setLng(loc.lng());
        setAddress(place.formatted_address || "");
        setAddressConfirmed(true);
      }
    });
  }, [step, mapsLoaded]);

  const handlePhotoUpload = async (stepId: string, file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${jobId}/${stepId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("job-photos")
      .upload(path, file);
    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("job-photos")
      .getPublicUrl(path);
    const objectUrl = URL.createObjectURL(file);
    setPhotos((prev) => ({
      ...prev,
      [stepId]: { url: objectUrl, storageUrl: urlData.publicUrl },
    }));
    setUploading(false);

    // Auto-advance
    const idx = PHOTO_STEPS.findIndex((s) => s.id === stepId);
    if (idx >= 0 && idx < PHOTO_STEPS.length - 1) {
      setTimeout(() => setStep(idx + 3), 400);
    } else if (idx === PHOTO_STEPS.length - 1) {
      setTimeout(() => setStep(PHOTO_STEPS.length + 2), 400);
    }
  };

  const serviceTypeLabels: Record<string, string> = {
    new_job: "New Job",
    service: "Service",
    full_site_replacement: "Full Site Replacement",
  };

  const generateOnboardingPdf = async () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;
    
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pw, 35, "F");
    doc.setTextColor(255);
    doc.setFontSize(18);
    doc.text("Manta Ray Energy", 15, 15);
    doc.setFontSize(12);
    doc.text("Onboarding Application", 15, 25);
    
    y = 45;
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("Job Details", 15, y); y += 10;
    
    doc.setFontSize(10);
    doc.text(`Job Type: ${serviceTypeLabels[serviceType] || serviceType}`, 15, y); y += 7;
    doc.text(`Address: ${address}`, 15, y); y += 7;
    doc.text(`Latitude: ${lat.toFixed(6)}`, 15, y); y += 7;
    doc.text(`Longitude: ${lng.toFixed(6)}`, 15, y); y += 7;
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 15, y); y += 12;
    
    // Add map image if available
    if (mapsKey) {
      try {
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=560x200&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${mapsKey}`;
        const img = await loadImage(mapUrl);
        doc.addImage(img, "JPEG", 15, y, pw - 30, 50);
        y += 55;
      } catch { /* skip map if fails */ }
    }
    
    // Photos
    if (Object.keys(photos).length > 0) {
      doc.setFontSize(14);
      doc.text("Uploaded Photos", 15, y); y += 8;
      
      for (const [key, photo] of Object.entries(photos)) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), 15, y); y += 3;
        try {
          const img = await loadImage(photo.storageUrl || photo.url);
          doc.addImage(img, "JPEG", 15, y, 80, 50);
          y += 55;
        } catch { y += 5; }
      }
    }
    
    return doc.output("blob");
  };

  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        c.getContext("2d")!.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/jpeg"));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const title = address.split(",")[0] || "New Job";

    const { error: jobError } = await supabase.from("jobs").insert({
      id: jobId,
      title,
      address,
      owner_id: user.id,
      lat,
      lng,
      status: "submitted" as any,
      service_type: serviceType,
    } as any);
    if (jobError) {
      toast({
        title: "Error creating job",
        description: jobError.message,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    for (const photo of Object.values(photos)) {
      await supabase.from("photos").insert({
        job_id: jobId,
        uploader_id: user.id,
        url: photo.storageUrl,
        review_status: "pending",
      });
    }

    logAudit(user.id, "job_created", "job", jobId, { address, service_type: serviceType });
    notifyOwnerPhotoSubmitted(user.id, title, jobId);

    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (adminRoles) {
      notifyPhotoUploaded(jobId, title, adminRoles.map((r) => r.user_id));
    }

    // PDF is no longer auto-downloaded; Admin can download it from the job view

    toast({ title: "Application submitted!" });
    setSubmitting(false);
    navigate(`/jobs/${jobId}`);
  };

  // Steps: 0=address, 1=job type, 2..N+1=photos, N+2=review
  const totalSteps = PHOTO_STEPS.length + 3;
  const progress = ((step + 1) / totalSteps) * 100;
  const requiredPhotosDone = PHOTO_STEPS.filter((s) => s.required).every(
    (s) => photos[s.id]
  );

  const canProceed = () => {
    if (step === 0) return addressConfirmed;
    if (step === 1) return !!serviceType;
    if (step > 1 && step <= PHOTO_STEPS.length + 1) {
      const ps = PHOTO_STEPS[step - 2];
      return !ps.required || !!photos[ps.id];
    }
    return requiredPhotosDone;
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-foreground">New Application</p>
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {totalSteps}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 0: Address + Pin */}
      {step === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Where is your property?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your full address below
            </p>
          </div>

          <Input
            ref={inputRef}
            placeholder="Start typing your address..."
            className="text-base"
            defaultValue={address}
          />

          <div
            ref={mapRef}
            className="w-full h-64 rounded-xl border border-border overflow-hidden bg-muted"
          />

          {addressConfirmed && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {address}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirm the exact roof / property location by adjusting the
                    pin if needed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Job Type */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">What type of job?</h2>
            <p className="text-sm text-muted-foreground mt-1">Select the service you need</p>
          </div>
          <div className="space-y-2">
            {[
              { value: "new_job", label: "New Job", desc: "New solar panel installation" },
              { value: "service", label: "Service", desc: "Maintenance or repair of existing installation" },
              { value: "full_site_replacement", label: "Full Site Replacement", desc: "Complete replacement of existing system" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setServiceType(opt.value)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-colors",
                  serviceType === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo Steps */}
      {step > 1 &&
        step <= PHOTO_STEPS.length + 1 &&
        (() => {
          const ps = PHOTO_STEPS[step - 2];
          const Icon = ps.icon;
          const uploaded = photos[ps.id];

          return (
            <div className="space-y-4 animate-fade-in" key={ps.id}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {ps.title}
                  </h2>
                  {ps.required ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      Optional
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{ps.instruction}</p>

              {uploaded ? (
                <div className="relative rounded-xl overflow-hidden border border-success/30">
                  <img
                    src={uploaded.url}
                    alt={ps.title}
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-success text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </div>
                  <label className="absolute bottom-2 right-2 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload(ps.id, f);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      asChild
                    >
                      <span>Replace</span>
                    </Button>
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(ps.id, f);
                    }}
                    disabled={uploading}
                  />
                  <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    {uploading ? (
                      <div className="animate-pulse">
                        <Upload className="h-10 w-10 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Uploading...
                        </p>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">
                          Take or select photo
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tap to open camera or gallery
                        </p>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          );
        })()}

      {/* Review Step */}
      {step === PHOTO_STEPS.length + 2 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Review Your Submission
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Check everything looks good before submitting
            </p>
          </div>

          <Card className="card-elevated">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{address}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Job Type: {serviceTypeLabels[serviceType] || serviceType}
              </p>
              {mapsKey && (
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=600x200&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${mapsKey}`}
                  alt="Property location"
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
            </CardContent>
          </Card>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Photos ({Object.keys(photos).length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(photos).map(([key, photo]) => (
                <div
                  key={key}
                  className="relative rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={photo.url}
                    alt={key}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1.5 py-0.5">
                    <p className="text-[9px] text-white capitalize">{key}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        {step > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}

        {step < PHOTO_STEPS.length + 2 ? (
          <div className="flex gap-2">
            {step > 1 &&
              step <= PHOTO_STEPS.length + 1 &&
              !PHOTO_STEPS[step - 2].required &&
              !photos[PHOTO_STEPS[step - 2].id] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Skip
                </Button>
              )}
            <Button
              size="sm"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            disabled={!requiredPhotosDone || submitting}
            onClick={handleSubmit}
            className="bg-success hover:bg-success/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </div>
    </div>
  );
}
