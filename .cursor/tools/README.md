# `.cursor/tools`

Place **optional** scripts used by agents or maintainers (OpenAPI validate, codegen wrappers, local smoke).

- Prefer **`npm run`** scripts in the package root for primary workflows.
- Do not commit secrets; use **`${env:VAR}`** for CI.

Default OpenAPI for codegen: **`../api-documentations/openapi/v1.yaml`** (relative to this folder).
