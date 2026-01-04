import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import { COOKIE_SECRET } from "../../config";

export default fp(async function (fastify) {
  await fastify.register(fastifyCookie, {
    secret: COOKIE_SECRET,
    hook: "onRequest",
    parseOptions: {},
  });
});
