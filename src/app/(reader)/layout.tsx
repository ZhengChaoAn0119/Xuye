import { PREFS_BOOT_SCRIPT } from "@/components/reader-prefs";

export default function ReaderLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Applies saved font size and theme before first paint (static script, no user input). */}
      <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
      {children}
    </>
  );
}
