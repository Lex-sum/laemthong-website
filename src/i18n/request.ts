import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { applyContentOverrides, getContentOverrides } from "@/lib/site-content";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [messages, overrides] = await Promise.all([
    import(`../../messages/${locale}.json`).then((m) => m.default),
    getContentOverrides(),
  ]);

  // Text edited in Admin → Page Content replaces the matching messages
  return {
    locale,
    messages: applyContentOverrides(messages, overrides, locale),
  };
});
