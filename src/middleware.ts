import type { RequestHandler } from "express";
import type { AnySchema, ValidateFunction } from "ajv";
import { ValidatorRegistry } from "./ajv";
import { badRequest } from "./errors";

export type Where = "body" | "query" | "params";

export class KitValidator {
    constructor(private registry = new ValidatorRegistry()) {}

    /**
     * Validate a part of the request using a schema $id or a schema object.
     * Stores the validated/coerced value on res.locals[where].
     */
    validate<T = unknown>(where: Where, schemaOrId: AnySchema | string): RequestHandler {
        const getVf = (): ValidateFunction => {
            if (typeof schemaOrId === "string") return this.registry.getById(schemaOrId);
            return this.registry.compile(schemaOrId);
        };

        const vf = getVf(); // compile once up-front (Ajv caches internally too)

        return (req, res, next) => {
            const value = (req as any)[where];
            const ok = vf(value);
            if (!ok) {
                // @ts-expect-error Ajv type
                return res.status(400).json(badRequest(where, vf.errors || []));
            }
            (res.locals as any)[where] = value as T;
            next();
        };
    }

    validateBody<T = unknown>(schemaOrId: AnySchema | string) { return this.validate<T>("body", schemaOrId); }
    validateQuery<T = unknown>(schemaOrId: AnySchema | string) { return this.validate<T>("query", schemaOrId); }
    validateParams<T = unknown>(schemaOrId: AnySchema | string) { return this.validate<T>("params", schemaOrId); }

    addSchema(schema: AnySchema) { this.registry.addSchema(schema); }
    addSchemas(schemas: AnySchema[]) { this.registry.addSchemas(schemas); }
}
