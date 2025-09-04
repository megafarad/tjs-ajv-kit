import Ajv, { type AnySchema, type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

export type AjvKitOptions = {
    allErrors?: boolean;
    coerceTypes?: boolean | "array";
    removeAdditional?: boolean | "all" | "failing";
    useDefaults?: boolean;
    strict?: boolean;
};

export function makeAjv(opts: AjvKitOptions = {}) {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: true,
        removeAdditional: "failing",
        useDefaults: true,
        strict: false,
        ...opts
    });
    addFormats(ajv);
    return ajv;
}

export class ValidatorRegistry {
    private ajv: Ajv;
    private cache = new Map<string, ValidateFunction>();

    constructor(ajv = makeAjv()) {
        this.ajv = ajv;
    }

    addSchema(schema: AnySchema) {
        this.ajv.addSchema(schema);
        const id = (schema as any).$id;
        if (id && this.cache.has(id)) this.cache.delete(id);
    }

    addSchemas(schemas: AnySchema[]) {
        for (const s of schemas) this.addSchema(s);
    }

    getById(id: string): ValidateFunction {
        const cached = this.cache.get(id);
        if (cached) return cached;
        const vf = this.ajv.getSchema(id) ?? this.ajv.compile({ $ref: id });
        if (!vf) throw new Error(`Schema not found or failed to compile: ${id}`);
        this.cache.set(id, vf);
        return vf;
    }

    compile(schema: AnySchema): ValidateFunction {
        const id = (schema as any).$id as string | undefined;
        if (id) return this.getById(id); // compiles & caches via getById
        return this.ajv.compile(schema);
    }
}
