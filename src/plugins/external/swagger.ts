import fp from "fastify-plugin";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifySwagger from "@fastify/swagger";

export default fp(async function (fastify) {
  await fastify.register(fastifySwagger, {
    hideUntagged: true,
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Shelter Server API",
        description: "API documentation for Shelter chat server. All endpoints require authentication except /api/auth/login and /api/auth/register.",
        version: "1.0.0",
      },
      servers: [
        // {
        //   url: "http://localhost:3000",
        //   description: "Development server",
        // },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
    theme: {
      title: "Shelter API",
    },
  });
});
