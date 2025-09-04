#!/usr/bin/env node
import { generateSchemas } from "./gen.js";

// super tiny arg parser (keep deps minimal)
const args = process.argv.slice(2);
const flags = new Map<string, string | true>();
for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
        const key = a.slice(2);
        const nxt = args[i + 1];
        if (!nxt || nxt.startsWith("--")) flags.set(key, true);
        else { flags.set(key, nxt); i++; }
    }
}

const cmd = args[0]?.startsWith("--") ? "gen" : (args[0] ?? "gen");

async function main() {
    if (cmd !== "gen") {
        console.error(`Unknown command: ${cmd}`);
        process.exit(1);
    }

    const tsconfig = (flags.get("tsconfig") as string) || undefined;
    const include = (flags.get("include") as string)?.split(",").filter(Boolean) || [];
    const types = ((flags.get("types") as string) || "").split(",").filter(Boolean);
    const outDir = (flags.get("out") as string) || "src/schemas";
    const idPrefix = (flags.get("id-prefix") as string) || "#/schemas/";
    const topRef = flags.has("topRef") ? true : true;
    const noExtraProps = flags.has("noExtraProps") ? true : true;
    const strictNullChecks = flags.has("strictNullChecks") ? true : true;

    await generateSchemas({
        tsconfig,
        include,
        types,
        outDir,
        idPrefix,
        topRef,
        noExtraProps,
        strictNullChecks
    });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
