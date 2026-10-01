const dateTime = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Platform-wide display time zone is Asia/Taipei. */
export const formatDateTime = (date: Date | null | undefined) =>
  date ? dateTime.format(date) : "—";

export const formatNumber = (n: number) => n.toLocaleString("zh-TW");
