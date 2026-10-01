import type { Metadata, Viewport } from "next";
import { defaultLocale, t } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: t("site.name"), template: `%s｜${t("site.name")}` },
  description: t("site.description"),
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale}>
      <body>
        <a className="skip-link" href="#main">
          {t("a11y.skipToContent")}
        </a>
        {children}
      </body>
    </html>
  );
}
