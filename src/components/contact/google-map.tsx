import { cn } from "@/lib/utils";

type Props = {
  mapUrl?: string;
  coordinates?: { lat: number; lng: number };
  title?: string;
  className?: string;
};

export function GoogleMap({ mapUrl, coordinates, title, className }: Props) {
  const embedUrl =
    mapUrl ||
    (coordinates
      ? `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`
      : null);

  if (!embedUrl) return null;

  return (
    <div className={cn("h-64 overflow-hidden rounded-lg border bg-muted", className)}>
      <iframe
        src={embedUrl}
        title={title ?? "Location"}
        className="h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
