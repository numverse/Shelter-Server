import fp from "fastify-plugin";

declare module "fastify" {
  export interface FastifyInstance {
    bitFieldManager: typeof bitFieldManager;
  }
}

const bitFieldManager = {
  hasBothFlag, hasEitherFlag, setFlag, clearFlag, toggleFlag, match,
};

function hasBothFlag(value: number, flag: number): boolean {
  return (value & flag) === flag;
}

function hasEitherFlag(value: number, flag: number): boolean {
  return (value & flag) !== 0;
}

function match(value: number, flag: number): boolean {
  return value === flag;
}

function setFlag(value: number, flag: number): number {
  return value | flag;
}

function clearFlag(value: number, flag: number): number {
  return value & ~flag;
}

function toggleFlag(value: number, flag: number): number {
  return value ^ flag;
}

export default fp(
  async function (fastify) {
    fastify.decorate("bitFieldManager", bitFieldManager);
  },
  { name: "bitField" },
);
