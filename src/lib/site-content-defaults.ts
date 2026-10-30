import th from "../../messages/th.json";
import en from "../../messages/en.json";
import { getMessage } from "@/lib/site-content";

/** Default (file) text for a message key in both languages. Server-only use. */
export function getDefaultContent(key: string): { th: string; en: string } {
  return { th: getMessage(th, key), en: getMessage(en, key) };
}
