import fp from "fastify-plugin";

declare module "fastify" {
  export interface FastifyInstance {
    passwordManager: typeof passwordManager;
  }
}

const passwordManager = {
  hash, compare,
};

async function hash(password: string): Promise<string> {
  return Bun.password.hash(password);
}

// Compare password
async function compare(password: string, hashedPassword: string): Promise<boolean> {
  return Bun.password.verify(password, hashedPassword);
}

export default fp(
  async function (fastify) {
    fastify.decorate("passwordManager", passwordManager);
  },
  { name: "password" },
);
