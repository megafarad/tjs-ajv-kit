import type {DefinedError} from "ajv";

export type ValidationProblem = {
    message: string;
    path: string;
    code?: string;
};

export function toProblems(errors: DefinedError[] = []): ValidationProblem[] {
    return errors.map((e) => {
        const path = e.instancePath || "/";
        let msg = e.message ?? "Invalid value";

        // Special-case a few common ones for clarity
        if (e.keyword === "required") {
            const missing = (e.params as any).missingProperty;
            msg = `Missing required property "${missing}"`;
        } else if (e.keyword === "type") {
            msg = `Invalid type, expected ${(e.params as any).type}`;
        } else if (e.keyword === "enum") {
            msg = `Invalid value, must be one of ${(e.params as any).allowedValues.join(", ")}`;
        }

        return { message: msg, path, code: e.keyword };
    });
}

export function badRequest(where: "body" | "query" | "params", errors: DefinedError[]) {
    return {
        error: `Invalid ${where}`,
        details: toProblems(errors)
    };
}
