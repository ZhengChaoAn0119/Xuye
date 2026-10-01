/**
 * Import EPUB files into the database.
 *
 *   pnpm content:import <file-or-dir>... [--apply] [--records <dir>]
 *
 * Without --apply it only prints what would change (dry run). Re-running is safe:
 * unchanged chapters are skipped, new ones appended, changed text updated.
 * Publish time for new chapters: chapter-records `updatedAt` (matched by title),
 * else the EPUB's modified date, else now. Book content never enters git.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { openDb } from "./cli-env";
import { describePlan } from "@/server/content/import-plan";
import { sourceKeyFor } from "@/server/content/text";
import { applyImportPlan, previewEpubImport } from "@/server/services/content-import";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const recordsFlag = args.indexOf("--records");
const recordsDirArg = recordsFlag >= 0 ? args[recordsFlag + 1] : undefined;
const inputs = args.filter(
  (a, i) => !a.startsWith("--") && (recordsFlag < 0 || i !== recordsFlag + 1),
);

if (inputs.length === 0) {
  console.error("用法：pnpm content:import <檔案或資料夾>... [--apply] [--records <資料夾>]");
  process.exit(1);
}

const files = inputs.flatMap((input) =>
  statSync(input).isDirectory()
    ? readdirSync(input)
        .filter((f) => f.toLowerCase().endsWith(".epub"))
        .sort((a, b) => a.localeCompare(b, "zh-Hant"))
        .map((f) => join(input, f))
    : [input],
);

// chapter-records/*.json from the source app: { title, updatedAt? }
function loadRecordTimes(): Map<string, Date> {
  const dir =
    recordsDirArg ??
    [...new Set(files.map((f) => join(dirname(f), "chapter-records")))].find((d) => existsSync(d));
  const times = new Map<string, Date>();
  if (!dir || !existsSync(dir)) return times;
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    try {
      const record = JSON.parse(readFileSync(join(dir, name), "utf8")) as {
        title?: string;
        updatedAt?: string;
      };
      // Timestamps without an offset come from the source app in Taiwan time.
      const raw = record.updatedAt?.trim();
      const at = raw ? new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(raw) ? raw : `${raw}+08:00`) : null;
      if (record.title && at && !Number.isNaN(at.getTime())) {
        const key = sourceKeyFor(record.title);
        const known = times.get(key);
        if (!known || at > known) times.set(key, at);
      }
    } catch {
      console.warn(`略過無法讀取的紀錄檔：${name}`);
    }
  }
  console.log(`讀取更新時間紀錄：${dir}（${times.size} 筆）`);
  return times;
}

async function main() {
  const { db, close } = openDb();
  const recordTimes = loadRecordTimes();
  let failures = 0;
  const totals = { works: 0, inserted: 0, updated: 0, unchanged: 0 };

  try {
    for (const file of files) {
      try {
        const plan = await previewEpubImport(db, new Uint8Array(readFileSync(file)));
        console.log(`${apply ? "匯入" : "預覽"}｜${describePlan(plan)}`);
        totals.works++;
        totals.inserted += plan.inserts.length;
        totals.updated += plan.updates.length;
        totals.unchanged += plan.unchanged;
        if (apply && (plan.inserts.length > 0 || plan.updates.length > 0 || plan.workId === null)) {
          const publishAt = recordTimes.get(plan.sourceKey) ?? plan.sourceModifiedAt ?? new Date();
          await applyImportPlan(db, plan, {
            publishAt,
            actor: { id: null, label: "cli:content-import" },
          });
        }
      } catch (error) {
        failures++;
        console.error(
          `失敗｜${basename(file)}：${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  } finally {
    await close();
  }

  console.log(
    `\n${apply ? "已匯入" : "預覽完成（加上 --apply 才會寫入）"}：${totals.works} 部作品，新增 ${totals.inserted} 章，更新 ${totals.updated} 章，未變更 ${totals.unchanged} 章${failures ? `，失敗 ${failures} 個檔案` : ""}`,
  );
  process.exit(failures > 0 ? 1 : 0);
}

void main();
