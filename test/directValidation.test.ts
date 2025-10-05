import NextStepRequestSchema from "./schemas/NextStepRequest.schema.json"
import {KitValidator, makeAjv, ValidatorRegistry} from "../src";

const validator = new KitValidator(new ValidatorRegistry(makeAjv({removeAdditional: false})));
validator.addSchema(NextStepRequestSchema);

// Add direct validation test
describe("direct validation", () => {
    it("should validate the object directly", () => {
        const testData = {
            mediaOutput: {
                type: "makeCall",
                result: "LA"
            },
            seq: 0
        };

        // Access the registry's AJV instance directly for testing
        const ajv = (validator as any).registry.ajv;
        const validate = ajv.getSchema("https://memomemo.megafarad.com/schemas/NextStepRequest.json");

        const isValid = validate(testData);

        if (!isValid) {
            console.log("Direct validation errors:");
            console.log(JSON.stringify(validate.errors, null, 2));
        }

        expect(isValid).toBe(true);
    });
});
