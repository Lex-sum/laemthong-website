/** Contact inquiry workflow. Shared by server actions and client components. */
export type InquiryStatus = "new" | "in_progress" | "done";

export const INQUIRY_STATUSES: InquiryStatus[] = ["new", "in_progress", "done"];

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  done: "Done",
};

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && (INQUIRY_STATUSES as string[]).includes(value);
}
