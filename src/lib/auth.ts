/** Only same-origin relative paths may be used as post-auth redirects. */
export function safeCallbackUrl(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
