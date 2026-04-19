import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, ArrowLeft, MapPin, CheckCircle2,
  Upload, Home, Ruler, Eye, Sun,
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
  { id: "front", title: "Front of Building", instruction: "Take a clear photo of the front of the house, showing the full building from the street.", icon: Home, required: true },
  { id: "access", title: "Access Area", instruction: "Show how workers will access the property — side gate, alley, or main entrance.", icon: Ruler, required: true },
  { id: "side", title: "Side Angle", instruction: "If relevant, capture a side view showing the roof slope and any obstacles.", icon: Eye, required: false },
];

export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const params = useParams();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";

  // jobId may come from URL (Admin-created invite flow) — otherwise we generate one
  const [jobId, setJobId] = useState<string>(() => params.jobId || crypto.randomUUID());
  const [existingJob, setExistingJob] = useState<any>(null);
  const [loadingJob, setLoadingJob] = useState(!!params.jobId);

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(51.5074);
  const [lng, setLng] = useState(-0.1278);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [serviceType, setServiceType] = useState("new_job");
  const [caseNo, setCaseNo] = useState("");
  const [panelCount, setPanelCount] = useState<string>("");

  const [photos, setPhotos] = useState<Record<string, { url: string; storageUrl: string }>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsKey, setMapsKey] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initDone = useRef(false);

  // If we have a jobId param (Admin-created), load it and prefill
  useEffect(() => {
    if (!params.jobId) return;
    (async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", params.jobId).maybeSingle();
      if (data) {
        setExistingJob(data);
        setJobId(data.id);
        if (data.case_no) setCaseNo(data.case_no);
        if (data.address) { setAddress(data.address); setAddressConfirmed(true); }
        if (data.lat) setLat(Number(data.lat));
        if (data.lng) setLng(Number(data.lng));
        if (data.service_type) setServiceType(data.service_type);
        if (data.panel_count != null) setPanelCount(String(data.panel_count));
      }
      setLoadingJob(false);
    })();
  }, [params.jobId]);

  // Fetch Google Maps key
  useEffect(() => {
    supabase.functions.invoke("get-maps-key").then(({ data }) => {
      if (data?.key) setMapsKey(data.key);
    }).catch(console.error);
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!mapsKey || mapsLoaded) return;
    if (window.google?.maps) { setMapsLoaded(true); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
    script.async = true;
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);
  }, [mapsKey, mapsLoaded]);

  // Init map
  useEffect(() => {
    if (step !== 0 || !mapsLoaded || !mapRef.current || !inputRef.current) return;
    if (initDone.current) return;
    initDone.current = true;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng }, zoom: addressConfirmed ? 19 : 5,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      map, position: { lat, lng }, draggable: true, visible: addressConfirmed,
    });
    markerRef.current = marker;

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      setLat(pos.lat()); setLng(pos.lng());
    });

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"], componentRestrictions: { country: "gb" },
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const loc = place.geometry.location;
        map.setCenter(loc); map.setZoom(19);
        marker.setPosition(loc); marker.setVisible(true);
        setLat(loc.lat()); setLng(loc.lng());
        setAddress(place.formatted_address || "");
        setAddressConfirmed(true);
      }
    });
  }, [step, mapsLoaded, addressConfirmed]);

  const handlePhotoUpload = async (stepId: string, file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${jobId}/${stepId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("job-photos").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
    const objectUrl = URL.createObjectURL(file);
    setPhotos((prev) => ({ ...prev, [stepId]: { url: objectUrl, storageUrl: urlData.publicUrl } }));
    setUploading(false);

    const idx = PHOTO_STEPS.findIndex((s) => s.id === stepId);
    if (idx >= 0 && idx < PHOTO_STEPS.length - 1) {
      setTimeout(() => setStep(idx + 4), 400);
    } else if (idx === PHOTO_STEPS.length - 1) {
      setTimeout(() => setStep(PHOTO_STEPS.length + 3), 400);
    }
  };

  const serviceTypeLabels: Record<string, string> = {
    new_job: "New Job", service: "Service", full_site_replacement: "Full Site Replacement",
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const title = existingJob?.title || address.split(",")[0] || "New Job";

    const updates: any = {
      title,
      address,
      lat,
      lng,
      service_type: serviceType,
      panel_count: panelCount ? parseInt(panelCount, 10) : null,
      updated_at: new Date().toISOString(),
    };

    let writeError: any = null;
    if (existingJob) {
      // UPDATE the pre-created job; status moves to submitted
      updates.status = "submitted";
      const { error } = await supabase.from("jobs").update(updates).eq("id", jobId);
      writeError = error;
    } else {
      // INSERT a fresh job (legacy direct-onboarding flow, e.g. Admin starting in person)
      const { error } = await supabase.from("jobs").insert({
        id: jobId, title, address, owner_id: isAdmin ? null : user.id,
        lat, lng, status: (isAdmin ? "draft" : "submitted") as any,
        service_type: serviceType,
        case_no: caseNo.trim() || null,
        panel_count: panelCount ? parseInt(panelCount, 10) : null,
      } as any);
      writeError = error;
    }

    if (writeError) {
      toast({ title: "Error saving job", description: writeError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    for (const photo of Object.values(photos)) {
      await supabase.from("photos").insert({
        job_id: jobId, uploader_id: user.id,
        url: photo.storageUrl, review_status: "pending",
      });
    }

    logAudit(user.id, existingJob ? "owner_onboarding_completed" : "job_created", "job", jobId, { address, service_type: serviceType, panel_count: panelCount });
    notifyOwnerPhotoSubmitted(user.id, title, jobId);

    const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (adminRoles) notifyPhotoUploaded(jobId, title, adminRoles.map((r) => r.user_id));

    toast({ title: "Application submitted!" });
    setSubmitting(false);
    navigate(`/jobs/${jobId}`);
  };

  // Steps: 0=address, 1=job type, 2=panel count, 3..N+2=photos, N+3=review
  const totalSteps = PHOTO_STEPS.length + 4;
  const progress = ((step + 1) / totalSteps) * 100;
  const requiredPhotosDone = PHOTO_STEPS.filter((s) => s.required).every((s) => photos[s.id]);

  const canProceed = () => {
    if (step === 0) return addressConfirmed;
    if (step === 1) return !!serviceType;
    if (step === 2) return !!panelCount && parseInt(panelCount, 10) > 0;
    if (step > 2 && step <= PHOTO_STEPS.length + 2) {
      const ps = PHOTO_STEPS[step - 3];
      return !ps.required || !!photos[ps.id];
    }
    return requiredPhotosDone;
  };

  if (loadingJob) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading your job...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-foreground">
            {existingJob && caseNo ? `Case No. ${caseNo}` : "New Application"}
          </p>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {totalSteps}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 0: Address */}
      {step === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Where is your property?</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your full address below</p>
          </div>
          <Input ref={inputRef} placeholder="Start typing your address..." className="text-base" defaultValue={address} />
          <div ref={mapRef} className="w-full h-64 rounded-xl border border-border overflow-hidden bg-muted" />
          {addressConfirmed && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{address}</p>
                  <p className="text-xs text-muted-foreground mt-1">Confirm the exact roof / property location by adjusting the pin if needed.</p>
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
                  serviceType === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Panel Count */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Number of panels on the roof</h2>
              <p className="text-xs text-muted-foreground mt-0.5">How many solar panels are or will be installed?</p>
            </div>
          </div>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="e.g. 12"
            value={panelCount}
            onChange={(e) => setPanelCount(e.target.value)}
            className="text-base"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">If you're not sure, give your best estimate — this can be adjusted later.</p>
        </div>
      )}

      {/* Photo Steps */}
      {step > 2 && step <= PHOTO_STEPS.length + 2 && (() => {
        const ps = PHOTO_STEPS[step - 3];
        const Icon = ps.icon;
        const uploaded = photos[ps.id];

        return (
          <div className="space-y-4 animate-fade-in" key={ps.id}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{ps.title}</h2>
                {ps.required ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Required</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Optional</span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{ps.instruction}</p>

            {uploaded ? (
              <div className="relative rounded-xl overflow-hidden border border-success/30">
                <img src={uploaded.url} alt={ps.title} className="w-full h-56 object-cover" />
                <div className="absolute top-2 right-2 bg-success text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Uploaded
                </div>
                <label className="absolute bottom-2 right-2 cursor-pointer">
                  <input type="file" accept="image/*,application/pdf,.pdf" capture={undefined} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(ps.id, f); }} />
                  <Button size="sm" variant="secondary" className="text-xs" asChild><span>Replace</span></Button>
                </label>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input type="file" accept="image/*,application/pdf,.pdf" capture={undefined} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(ps.id, f); }} disabled={uploading} />
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  {uploading ? (
                    <div className="animate-pulse">
                      <Upload className="h-10 w-10 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">Upload photo or file</p>
                      <p className="text-xs text-muted-foreground mt-1">Camera, gallery, or PDF</p>
                    </>
                  )}
                </div>
              </label>
            )}
          </div>
        );
      })()}

      {/* Review */}
      {step === PHOTO_STEPS.length + 3 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Review Your Submission</h2>
            <p className="text-sm text-muted-foreground mt-1">Check everything looks good before submitting</p>
          </div>

          <Card className="card-elevated">
            <CardContent className="p-4 space-y-3">
              {caseNo && <p className="text-xs"><span className="text-muted-foreground">Case No.:</span> <span className="font-medium text-foreground">{caseNo}</span></p>}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{address}</p>
              </div>
              <p className="text-xs text-muted-foreground">Job Type: {serviceTypeLabels[serviceType] || serviceType}</p>
              <p className="text-xs text-muted-foreground">Number of panels: <span className="font-medium text-foreground">{panelCount}</span></p>
              {mapsKey && (
                <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=600x200&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${mapsKey}`} alt="Property location" className="w-full h-32 object-cover rounded-lg" />
              )}
            </CardContent>
          </Card>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Photos ({Object.keys(photos).length})</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(photos).map(([key, photo]) => (
                <div key={key} className="relative rounded-lg overflow-hidden border border-border">
                  <img src={photo.url} alt={key} className="w-full h-24 object-cover" />
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
          <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : <div />}

        {step < PHOTO_STEPS.length + 3 ? (
          <div className="flex gap-2">
            {step > 2 && step <= PHOTO_STEPS.length + 2 && !PHOTO_STEPS[step - 3].required && !photos[PHOTO_STEPS[step - 3].id] && (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s + 1)}>Skip</Button>
            )}
            <Button size="sm" disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          <Button size="sm" disabled={!requiredPhotosDone || submitting} onClick={handleSubmit} className="bg-success hover:bg-success/90">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </div>
    </div>
  );
}
