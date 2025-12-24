import fp from "fastify-plugin";
import nodemailer from "nodemailer";
import type { SendMailOptions, SentMessageInfo } from "nodemailer";
import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from "src/config";

declare module "fastify" {
  interface FastifyInstance {
    mailer: {
      sendMail(opts: SendMailOptions): Promise<SentMessageInfo>;
    };
  }
}

export default fp(async function (fastify) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true, // use SSL
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    fastify.log.info("Mailer transporter verified");
  } catch (_) {
    fastify.log.warn("Mailer transporter verification failed");
  }

  fastify.decorate("mailer", {
    sendMail: async (opts: SendMailOptions): Promise<SentMessageInfo> => {
      const info = await transporter.sendMail(opts);
      if (!process.env.SMTP_HOST) {
        const url = nodemailer.getTestMessageUrl(info);
        if (url) fastify.log.info(`Preview URL: ${url}`);
      }
      return info as SentMessageInfo;
    },
  });
});
