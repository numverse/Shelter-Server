import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import { JWT_SECRET } from "../../config";

export default fp(async function (fastify) {
  await fastify.register(fastifyCookie, {
    secret: JWT_SECRET,
    hook: "onRequest",
    parseOptions: {},
  });
});
