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
    allowRecordAdditionalProps? : boolean;
};

function isRecordLikeSchema(schema: TJS.DefinitionOrBoolean) {
    if (typeof schema === "boolean") return false;
    if (schema.type !== "object") return false;


    return !schema.properties || Object.keys(schema.properties).length === 0;

}

function processSchemaForRecords(schema: TJS.DefinitionOrBoolean) {
    if (typeof schema === "boolean") return;
    if (isRecordLikeSchema(schema)) {
        schema.additionalProperties = true;
        return;
    }

    if (schema.definitions) {
        for (const def of Object.values(schema.definitions)) {
            processSchemaForRecords(def);
        }
    }

    if (schema.properties) {
        for (const prop of Object.values(schema.properties)) {
            if (typeof prop === "boolean") {
                return;
            } else {
                processSchemaForRecords(prop);
            }
        }
    }

    if (schema.items) {
        if (Array.isArray(schema.items)) {
            schema.items.forEach(processSchemaForRecords);
        } else {
            processSchemaForRecords(schema.items);
        }
    }

    if (schema.anyOf) {
        schema.anyOf.forEach(processSchemaForRecords);
    }

    if (schema.allOf) {
        schema.allOf.forEach(processSchemaForRecords);
    }

    if (schema.oneOf) {
        schema.oneOf.forEach(processSchemaForRecords);
    }
}

export async function generateSchemas(opts: GenOptions) {
    const {
        tsconfig,
        include = [],
        types,
        outDir,
        idPrefix = "#/schemas/",
        topRef = true,
        noExtraProps = true,
        strictNullChecks = true,
        allowRecordAdditionalProps = true
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
        const schema: TJS.Definition = generator.getSchemaForSymbol(typeName);
        (schema as any).$id = `${idPrefix}${typeName}.json`;

        if (allowRecordAdditionalProps) {
            processSchemaForRecords(schema);
        }

        const outPath = path.join(outDir, `${typeName}.schema.json`);
        fs.writeFileSync(outPath, JSON.stringify(schema, null, 2));
        // eslint-disable-next-line no-console
        console.log("Wrote", outPath);
    }
}
