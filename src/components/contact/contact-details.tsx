import type { ComponentType, ReactNode } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toTelHref } from "@/lib/db/company";

type Labels = { phone: string; email: string; address: string; hours: string };

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-4 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm leading-relaxed text-foreground">{children}</div>
      </div>
    </li>
  );
}

/** Contact details list for the Contact page — values come from Admin → Company Info. */
export function ContactDetails({
  phone,
  email,
  lineId,
  address,
  hours,
  labels,
}: {
  phone: string;
  email: string;
  lineId?: string;
  address: string;
  hours: string;
  labels: Labels;
}) {
  const link = "font-semibold transition-colors hover:text-primary";
  return (
    <ul className="divide-y">
      <Row icon={Phone} label={labels.phone}>
        <a href={toTelHref(phone)} className={link}>
          {phone}
        </a>
      </Row>
      <Row icon={Mail} label={labels.email}>
        <a href={`mailto:${email}`} className={`${link} break-all`}>
          {email}
        </a>
      </Row>
      {lineId && (
        <Row icon={MessageCircle} label="LINE">
          <span className="font-semibold">{lineId}</span>
        </Row>
      )}
      <Row icon={MapPin} label={labels.address}>
        {address}
      </Row>
      <Row icon={Clock} label={labels.hours}>
        {hours}
      </Row>
    </ul>
  );
}
