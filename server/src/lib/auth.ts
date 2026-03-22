import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { pg } from "../db/pg";
import * as schema from "../db/schema/auth";
import { openAPI } from "better-auth/plugins";
import { Elysia } from "elysia";
import { passkey } from "@better-auth/passkey";

export const auth = betterAuth({
  basePath: "/auth",
  trustedOrigins: [Bun.env.ORIGIN],
  database: drizzleAdapter(pg, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    openAPI(),
    passkey({
      rpID: Bun.env.RP_ID,
      rpName: Bun.env.RP_NAME,
      origin: Bun.env.ORIGIN,
    }),
  ],
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const authOpenAPI = {
  getPaths: (prefix = auth.options.basePath) =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        if (!paths[path]) {
          continue;
        }
        reference[key] = paths[path];
        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method];
          operation.tags = ["authentication"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;

export const authPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
