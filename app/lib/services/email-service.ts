import { createTransport } from "nodemailer";

if (
  process.env.EMAIL_DEBUG !== "on" &&
  (!process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS)
) {
  throw new Error("SMTP configuration missing");
}

const transport =
  process.env.EMAIL_DEBUG !== "on"
    ? createTransport({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT!),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        logger: process.env.SMTP_DEBUG === "on",
        debug: process.env.SMTP_DEBUG === "on"
      })
    : {
        sendMail: async ({
          to,
          subject,
          text
        }: {
          to: string;
          subject: string;
          text: string;
        }) => {
          console.log(`Email to: ${to}`);
          console.log(`Subject: ${subject}`);
          console.log(`Text: ${text}`);
        }
      };

export const sendEmail = async ({
  to,
  subject,
  text
}: {
  to: string;
  subject: string;
  text: string;
}) => {
  await transport.sendMail({
    from: "no-reply@snapsafe.app",
    to,
    subject,
    text
  });
};
