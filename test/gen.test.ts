import {generateSchemas} from "../src/cli/gen";
import {ValidatorRegistry, makeAjv} from "../src";
import TestTypeSchema from "./schemas/TestType.schema.json" with { type: 'json' };
import {TestType} from "./types/test";
import {expect} from "vitest";

describe('generateSchemas', () => {
    it('should generate schemas that validate correctly', async () => {
        await generateSchemas({
            types: ['TestType'],
            include: ['test/types/test.ts'],
            outDir: 'test/schemas'
        });

        const registry = new ValidatorRegistry(makeAjv({removeAdditional: false}));
        registry.addSchema(TestTypeSchema);

        const validatorFunction = registry.getById('#/schemas/TestType.json');

        const validObject: TestType = {
            boolean: false,
            nested: {
                string: "",
                number: 0,
                boolean: false,
                record: {
                    a: "a",
                    b: "b"
                }
            },
            nestedArray: [{
                string: "",
                number: 0,
                boolean: false,
                record: {
                    a: "a",
                    b: "b"
                }
            }],
            number: 0,
            record: {
                a: "a",
                b: "b"
            },
            string: "",
            union: 1
        }

        expect(validatorFunction(validObject)).toBe(true);

        const invalidObject = {
            test: "test"
        }

        expect(validatorFunction(invalidObject)).toBe(false);

    });
});