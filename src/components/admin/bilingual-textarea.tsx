"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BilingualTextareaProps {
  label: string;
  nameTh: string;
  nameEn: string;
  defaultValueTh?: string;
  defaultValueEn?: string;
  required?: boolean;
  /** English may be left empty (only the Thai field is required). */
  optionalEn?: boolean;
  errorTh?: string;
  errorEn?: string;
  rows?: number;
  helperText?: string;
  onChangeTh?: (value: string) => void;
  onChangeEn?: (value: string) => void;
}

export function BilingualTextarea({
  label,
  nameTh,
  nameEn,
  defaultValueTh,
  defaultValueEn,
  required,
  optionalEn = false,
  errorTh,
  errorEn,
  rows = 4,
  helperText,
  onChangeTh,
  onChangeEn,
}: BilingualTextareaProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && "*"}
      </Label>
      {helperText && (
        <p className="text-xs text-muted-foreground -mt-1">{helperText}</p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <div className="mb-0.5 text-xs text-muted-foreground">TH</div>
          <Textarea
            name={nameTh}
            defaultValue={defaultValueTh}
            placeholder={`${label} (Thai)`}
            required={required}
            rows={rows}
            onChange={onChangeTh ? (e) => onChangeTh(e.target.value) : undefined}
          />
          {errorTh && (
            <p className="mt-1 text-xs text-destructive">{errorTh}</p>
          )}
        </div>
        <div>
          <div className="mb-0.5 text-xs text-muted-foreground">EN{optionalEn && " (optional)"}</div>
          <Textarea
            name={nameEn}
            defaultValue={defaultValueEn}
            placeholder={`${label} (English)${optionalEn ? " — optional" : ""}`}
            required={required && !optionalEn}
            rows={rows}
            onChange={onChangeEn ? (e) => onChangeEn(e.target.value) : undefined}
          />
          {errorEn && (
            <p className="mt-1 text-xs text-destructive">{errorEn}</p>
          )}
        </div>
      </div>
    </div>
  );
}
