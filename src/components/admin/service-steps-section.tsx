"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceStep } from "@/data/types";

const emptyStep = (): ServiceStep => ({ title: { th: "", en: "" }, description: { th: "", en: "" } });

export function ServiceStepsSection({
  steps,
  onStepsChange,
}: {
  steps: ServiceStep[];
  onStepsChange: (steps: ServiceStep[]) => void;
}) {
  function update(i: number, part: keyof ServiceStep, lang: "th" | "en", text: string) {
    const next = [...steps];
    next[i] = { ...next[i], [part]: { ...next[i][part], [lang]: text } };
    onStepsChange(next);
  }

  function move(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onStepsChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Process steps</Label>
          <p className="text-xs text-muted-foreground">Numbered steps in “Our Process” on the service page.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onStepsChange([...steps, emptyStep()])}>
          Add Step
        </Button>
      </div>

      {steps.map((step, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Step {i + 1}</span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label="Move down">
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => onStepsChange(steps.filter((_, j) => j !== i))}
                aria-label="Remove step"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Title (TH)" value={step.title.th} onChange={(e) => update(i, "title", "th", e.target.value)} />
            <Input placeholder="Title (EN)" value={step.title.en} onChange={(e) => update(i, "title", "en", e.target.value)} />
            <Textarea rows={2} placeholder="Description (TH)" value={step.description.th} onChange={(e) => update(i, "description", "th", e.target.value)} />
            <Textarea rows={2} placeholder="Description (EN)" value={step.description.en} onChange={(e) => update(i, "description", "en", e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
