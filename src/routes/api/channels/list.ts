import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as channelRepo from "../../../database/repository/channelRepo";
import { ChannelResponse } from "../../../schemas/response";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/", {
    schema: {
      response: {
        200: Type.Object({
          channels: Type.Array(ChannelResponse),
        }),
      },
      tags: ["Channels"],
      summary: "List all channels",
      description: "Retrieve a list of all channels",
    },
    handler: async (request, reply) => {
      const channels = await channelRepo.findAllChannels();
      return reply.status(200).send({
        channels: channels.map((channel) => ({
          ...channel,
          createdAt: channel.createdAt.toISOString(),
          updatedAt: channel.updatedAt?.toISOString(),
        })),
      });
    },
  });
};

export default plugin;
