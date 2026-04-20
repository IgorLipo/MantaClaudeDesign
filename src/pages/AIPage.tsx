import { useState } from "react";
import { Brain, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToneSelector } from "@/components/ai/ToneSelector";
import { SummaryOutput } from "@/components/ai/SummaryOutput";
import { useSummarizer } from "@/hooks/useSummarizer";
import { sampleReportData } from "@/data/mockAI";

export default function AIPage() {
  const [inputData, setInputData] = useState("");
  const {
    summary,
    tone,
    isGenerating,
    hasGenerated,
    setTone,
    generateSummary,
    regenerate,
    cancel,
  } = useSummarizer();

  const handleGenerate = () => {
    generateSummary(inputData || sampleReportData);
  };

  const handleUseSampleData = () => {
    setInputData(sampleReportData.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-2 animate-em-enter">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <Brain className="h-3 w-3" /> Signal
          </span>
          <h1 className="font-display text-4xl lg:text-5xl leading-[1.02] tracking-tight text-foreground">
            AI report <span className="font-display-italic text-primary">summarizer.</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Turn raw job data into executive summaries.
          </p>
        </div>

        {/* AI Powered Notice */}
        <div className="mb-6 p-4 rounded-xl bg-accent/5 border border-accent/20">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Powered by Lovable AI
              </p>
              <p className="text-sm text-muted-foreground">
                Real-time AI analysis generates executive summaries tailored to your chosen tone.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Report Data</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseSampleData}
              >
                Use Sample Data
              </Button>
            </div>
            
            <Textarea
              placeholder="Paste your financial data here, or click 'Use Sample Data' to try a demo..."
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={6}
              className="resize-none mb-4"
            />

            {/* Tone Selector */}
            <div className="mb-6">
              <ToneSelector
                value={tone}
                onChange={setTone}
                disabled={isGenerating}
              />
            </div>

            {/* Generate Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
              {isGenerating && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={cancel}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Output Section */}
          {(hasGenerated || isGenerating) && (
            <SummaryOutput
              summary={summary}
              isGenerating={isGenerating}
              onRegenerate={regenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
