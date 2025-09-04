import path from "node:path";
import fs from "node:fs";
import fg from "fast-glob";
import * as TJS from "typescript-json-schema";

type GenOptions = {
    tsconfig?: string;
    include?: string[];
    types: string[];
    outDir: string;
    idPrefix?: string; // e.g. "#/schemas/"
    topRef?: boolean;
    noExtraProps?: boolean;
    strictNullChecks?: boolean;
};

export async function generateSchemas(opts: GenOptions) {
    const {
        tsconfig,
        include = [],
        types,
        outDir,
        idPrefix = "#/schemas/",
        topRef = true,
        noExtraProps = true,
        strictNullChecks = true
    } = opts;

    if (!types?.length) throw new Error("--types is required (comma-separated list)");

    // Resolve files from include globs (or tsconfig 'files' / 'include')
    let files: string[] = [];
    if (include.length) {
        files = await fg(include, { absolute: true });
    } else if (tsconfig) {
        // If a tsconfig is provided, we let TJS read it; pass no files
    } else {
        throw new Error("Provide either --include globs or --tsconfig");
    }

    const settings: TJS.PartialArgs = {
        required: true,
        topRef,
        noExtraProps
    };

    const compilerOptions: TJS.CompilerOptions = {
        strictNullChecks
    };

    const program = tsconfig
        ? TJS.programFromConfig(tsconfig)
        : TJS.getProgramFromFiles(files, compilerOptions);

    const generator = TJS.buildGenerator(program, settings);
    if (!generator) throw new Error("Failed to create schema generator");

    fs.mkdirSync(outDir, { recursive: true });

    for (const typeName of types) {
        const schema = generator.getSchemaForSymbol(typeName);
        (schema as any).$id = `${idPrefix}${typeName}.json`;
        const outPath = path.join(outDir, `${typeName}.schema.json`);
        fs.writeFileSync(outPath, JSON.stringify(schema, null, 2));
        // eslint-disable-next-line no-console
        console.log("Wrote", outPath);
    }
}
