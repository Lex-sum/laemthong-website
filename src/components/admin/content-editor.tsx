"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { saveContentAction } from "@/app/admin/actions/content";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type Bilingual = { th: string; en: string };

export interface EditorField {
  key: string;
  label: string;
  multiline?: boolean;
  defaults: Bilingual;
  /** Saved value (override or default). */
  saved: Bilingual;
}

export interface EditorGroup {
  title: string;
  description?: string;
  fields: EditorField[];
}

const same = (a: Bilingual, b: Bilingual) => a.th === b.th && a.en === b.en;

function GroupEditor({ section, group }: { section: string; group: EditorGroup }) {
  const [saved, setSaved] = useState<Record<string, Bilingual>>(() =>
    Object.fromEntries(group.fields.map((f) => [f.key, f.saved]))
  );
  const [values, setValues] = useState<Record<string, Bilingual>>(saved);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = group.fields.some((f) => !same(values[f.key], saved[f.key]));
  useUnsavedChanges(isDirty);

  function update(key: string, lang: keyof Bilingual, text: string) {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [lang]: text } }));
  }

  async function save() {
    setIsSaving(true);
    const entries = group.fields.map((f) => ({ key: f.key, ...values[f.key] }));
    const result = await saveContentAction(section, entries);
    setIsSaving(false);
    if (result.success) {
      // Empty fields fall back to the default text
      const normalized = Object.fromEntries(
        group.fields.map((f) => [
          f.key,
          { th: values[f.key].th.trim() ? values[f.key].th : f.defaults.th, en: values[f.key].en.trim() ? values[f.key].en : f.defaults.en },
        ])
      );
      setSaved(normalized);
      setValues(normalized);
      toast.success(`${group.title} saved — live on the website`);
    } else {
      toast.error(result.message ?? "Failed to save");
    }
  }

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
        <div>
          <h3 className="font-semibold">{group.title}</h3>
          {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button variant="ghost" size="sm" onClick={() => setValues(saved)} disabled={isSaving}>
              Discard
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={!isDirty || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      <div className="divide-y">
        {group.fields.map((field) => {
          const value = values[field.key];
          const isCustom = !same(saved[field.key], field.defaults);
          const differsFromDefault = !same(value, field.defaults);
          const Control = field.multiline ? Textarea : Input;
          return (
            <div key={field.key} className="space-y-2 px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  {isCustom && <Badge variant="secondary">Edited</Badge>}
                </div>
                {differsFromDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setValues((prev) => ({ ...prev, [field.key]: field.defaults }))}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Reset to default
                  </Button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["th", "en"] as const).map((lang) => (
                  <div key={lang}>
                    <div className="mb-0.5 text-xs text-muted-foreground">{lang.toUpperCase()}</div>
                    <Control
                      value={value[lang]}
                      placeholder={field.defaults[lang]}
                      onChange={(e) => update(field.key, lang, e.target.value)}
                      {...(field.multiline ? { rows: 3 } : {})}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ContentEditor({ section, groups }: { section: string; groups: EditorGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <GroupEditor key={`${section}:${group.title}`} section={section} group={group} />
      ))}
    </div>
  );
}
