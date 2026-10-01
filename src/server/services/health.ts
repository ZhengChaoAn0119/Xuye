export type HealthReport = {
  status: "ok" | "degraded";
  database: "ok" | "unreachable";
  checkedAt: string;
};

/**
 * Services hold business logic and receive their dependencies as arguments,
 * so route handlers, server components, and tests can all call them.
 */
export async function checkHealth(deps: {
  pingDatabase: () => Promise<void>;
  now?: () => Date;
}): Promise<HealthReport> {
  const now = deps.now ?? (() => new Date());
  let database: HealthReport["database"] = "ok";
  try {
    await deps.pingDatabase();
  } catch {
    database = "unreachable";
  }
  return {
    status: database === "ok" ? "ok" : "degraded",
    database,
    checkedAt: now().toISOString(),
  };
}
