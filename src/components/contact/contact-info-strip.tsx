import { Phone, Mail, MapPin, Clock } from "lucide-react";

type Props = {
  phone: string;
  email: string;
  lineId?: string;
  address: string;
  hours: string;
  labels: {
    phone: string;
    email: string;
    address: string;
    hours: string;
  };
};

export function ContactInfoStrip({ phone, email, lineId, address, hours, labels }: Props) {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-background/50" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/50">
                {labels.phone}
              </p>
              <a
                href={`tel:${phone.replace(/-/g, "")}`}
                className="mt-1 block text-sm font-semibold text-background transition-colors hover:text-primary"
              >
                {phone}
              </a>
              {lineId && (
                <p className="mt-1 text-sm text-background/70">LINE: {lineId}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-background/50" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/50">
                {labels.email}
              </p>
              <a
                href={`mailto:${email}`}
                className="mt-1 block text-sm font-semibold text-background transition-colors hover:text-primary"
              >
                {email}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-background/50" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/50">
                {labels.address}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-background/70">
                {address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-background/50" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/50">
                {labels.hours}
              </p>
              <p className="mt-1 text-sm font-semibold text-background">
                {hours}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
