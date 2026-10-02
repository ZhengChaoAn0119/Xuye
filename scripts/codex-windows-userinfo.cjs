/*
 * Node 24 can fail os.userInfo() with uv_os_get_passwd/ENOMEM inside the
 * managed Codex Windows sandbox. tsx calls it while choosing a temp folder,
 * which otherwise prevents Drizzle and Playwright helpers from starting.
 *
 * This preload is inert outside that sandbox. Keep the fallback narrowly
 * scoped to the known libuv failure so genuine errors are not hidden.
 */
if (process.platform === "win32" && process.env.CODEX_PERMISSION_PROFILE) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS preload for NODE_OPTIONS.
  const os = require("node:os");
  const originalUserInfo = os.userInfo.bind(os);

  os.userInfo = function userInfo(options) {
    try {
      return originalUserInfo(options);
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        error.code !== "ERR_SYSTEM_ERROR" ||
        error.syscall !== "uv_os_get_passwd"
      ) {
        throw error;
      }
      return {
        uid: -1,
        gid: -1,
        username: process.env.USERNAME || "codex-sandbox",
        homedir: process.env.USERPROFILE || os.homedir(),
        shell: null,
      };
    }
  };
}
