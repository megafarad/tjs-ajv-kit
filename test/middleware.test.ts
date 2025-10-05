import express from "express";
import request from "supertest";
import NextStepRequestSchema from "./schemas/NextStepRequest.schema.json"
import {KitValidator, makeAjv, ValidatorRegistry} from "../src";
import {expect} from "vitest";

const validator = new KitValidator(new ValidatorRegistry(makeAjv({removeAdditional: false})));
validator.addSchema(NextStepRequestSchema);

function generateApp() {
    const app = express();

    app.use(express.json());

    app.post("/test", validator.validateBody<any>(
            "https://memomemo.megafarad.com/schemas/NextStepRequest.json"),
        (req, res) => {
            res.status(200).json({message: "ok"});
        });

    return app;
}

describe("middleware", () => {
    it("should validate body", async () => {
        const app = generateApp();
        const response = await request(app)
            .post("/test")
            .send({
                mediaOutput: {
                    type: "makeCall",
                    result: "LA"
                },
                seq: 0
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({message: "ok"});
    });
});