# tjs-ajv-kit

TS → JSON Schema (via **typescript-json-schema**) + **AJV** + **Express** middleware.

## Install

```bash
npm i @sirhc77/tjs-ajv-kit ajv ajv-formats
# peer deps: typescript, express
````

## Generate schemas

```bash
# Using tsconfig
tjs-ajv-kit --tsconfig tsconfig.json --types "CreateUser,ListUsersQuery" --out src/schemas

# Or with include globs
tjs-ajv-kit --include "src/**/*.ts" --types CreateUser --out src/schemas
```

Each schema gets `$id` like `#/schemas/CreateUser.json`.

## Use in Express

```ts
import express from "express";
import { KitValidator } from "@sirhc77/tjs-ajv-kit";
// Import generated JSON (let your bundler inline it) or read from disk
import CreateUserSchema from "./schemas/CreateUser.schema.json" with { type: "json" };

const v = new KitValidator();
v.addSchema(CreateUserSchema);

const app = express();
app.use(express.json());

app.post(
  "/users",
  v.validateBody("#/schemas/CreateUser.json"), // or pass the schema object
  (req, res) => {
    const body = res.locals.body as unknown; // already coerced/validated
    res.status(201).json({ ok: true, body });
  }
);
```

### Options

* **AJV defaults**: `allErrors:true`, `coerceTypes:true`, `removeAdditional:'failing'`, `useDefaults:true`, `strict:false` (override via `makeAjv` or provide your own `ValidatorRegistry`).
* **Error shape**: `{ error: "Invalid body|query|params", details: [{ message, path, code }] }`.

## Patterns

* Generate to `src/schemas` ⇒ bundlers (tsup/esbuild) inline JSON.
* Or generate to `schemas/` and copy to `dist/` postbuild.
* Keep schemas uncommitted if they’re internal-only; commit if they’re shared contracts.

```
# .gitignore

dist/
node\_modules/
\*.log
\*.tsbuildinfo

````

---

## Example usage in your app

**Generate schemas:**

```bash
# inside your app repo (not the kit)
npx tjs-ajv-kit --tsconfig tsconfig.json --types CreateUser --out src/schemas
```

**Wire middleware:**

```ts
// app/src/routes.ts
import { KitValidator } from "@sirhc77/tjs-ajv-kit";
import CreateUserSchema from "./schemas/CreateUser.schema.json" with { type: "json" };

const v = new KitValidator();
v.addSchema(CreateUserSchema);

router.post("/users", v.validateBody("#/schemas/CreateUser.json"), handler);
```

# 🧱 Build step recipes (add to your app’s `package.json`)

Generate schemas **before** you build, so your validator always matches your TS types.

## Default (tsup / esbuild bundlers) — generate into `src/schemas` and import JSON

```json
{
  "scripts": {
    "gen:schema": "tjs-ajv-kit --tsconfig tsconfig.json --types \"CreateUser,ListUsersQuery\" --out src/schemas",
    "build": "npm run gen:schema && tsup",
    "dev": "npm run gen:schema && tsup --watch",
    "prepublishOnly": "npm run build"
  }
}
```

* Put schemas in `src/schemas` so bundlers inline them (no files to copy at runtime).
* In code: `import CreateUserSchema from './schemas/CreateUser.schema.json' assert { type: 'json' }`.

## Plain `tsc` builds — same idea

```json
{
  "scripts": {
    "gen:schema": "tjs-ajv-kit --tsconfig tsconfig.json --types CreateUser --out src/schemas",
    "build": "npm run gen:schema && tsc -p tsconfig.json"
  }
}
```

## If you prefer schemas outside `src/` → copy them post-build

```bash
npm i -D cpy-cli
```

```json
{
  "scripts": {
    "gen:schema": "tjs-ajv-kit --tsconfig tsconfig.json --types CreateUser --out schemas",
    "build": "tsup && cpy \"schemas/**/*.json\" dist/schemas"
  }
}
```

And import at runtime from `dist/schemas` or read via `fs`—your call.

## Optional: lifecycle hook (no change to existing build script)

```json
{
  "scripts": {
    "prebuild": "tjs-ajv-kit --tsconfig tsconfig.json --types CreateUser --out src/schemas",
    "build": "tsup"
  }
}
```

NPM runs `prebuild` automatically before `build`.

## Optional (nice for teams): schema drift check in CI

```json
{
  "scripts": {
    "verify:schema": "npm run gen:schema && git diff --quiet --exit-code -- src/schemas || (echo \"Schemas out of date. Run gen:schema.\" && exit 1)"
  }
}
```

## Note on watch mode

Today the CLI is one-shot. For live regen during dev, add:

```bash
npm i -D chokidar-cli
```

```json
{
  "scripts": {
    "watch:schema": "chokidar \"src/**/*.ts\" -i \"src/schemas/*.schema.json\" -c \"tjs-ajv-kit --tsconfig tsconfig.json --types CreateUser --out src/schemas\"",
    "dev": "npm-run-all -p watch:schema start:dev"
  }
}
```

(Or just re-run `gen:schema` when you change request DTOs-up to you.)

