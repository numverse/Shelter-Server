import fp from "fastify-plugin";
import type { FastifyInstance, RouteOptions } from "fastify";

export default fp(async function (fastify: FastifyInstance) {
  fastify.addHook("onRoute", (routeOptions: RouteOptions) => {
    try {
      const schema = routeOptions.schema;
      if (!schema) return;

      const consumes = schema.consumes;
      const list: string[] = [];

      if (Array.isArray(consumes)) list.push(...consumes.map(String));
      else if (typeof consumes === "string") list.push(consumes);

      const hasMultipart = list.some((s) => /multipart\/form-data/i.test(String(s)));

      if (hasMultipart && schema.body) {
        routeOptions.validatorCompiler = () => {
          return (_data: unknown) => true;
        };
      }
    } catch {
      // noop
    }
  });
});
