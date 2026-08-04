import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // `server-only` throws when imported outside a React Server Component;
      // under test the modules are plain Node.
      "server-only": path.resolve(rootDir, "test/stubs/server-only.ts"),
      "@": path.resolve(rootDir, "src"),
    },
  },
});
