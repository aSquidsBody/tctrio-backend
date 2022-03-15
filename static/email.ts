import { readFileSync } from "fs";
import handlebars from "handlebars";
import nodemailer from "nodemailer";

interface EmailVars {
  name: string;
  email: string;
  comment?: string;
  venue?: string;
}

function emailHTML(vars: EmailVars) {
  const backend = process.env.DEV ? "http://localhost:3000" : "";

  let buffer = readFileSync("./static/email-template.html");
  const fileText = buffer.toString("utf8");

  const template = handlebars.compile(fileText);
  const htmlToSend = template({
    name: vars.name,
    email: vars.email,
    comment: vars.comment || "",
    venue: vars.venue || "",
    backendUrl: backend,
  });
  return htmlToSend;
}

export function sendEmail(
  sendTo: string,
  vars: EmailVars,
  callback: (error: Error | null, res: any) => void
) {
  const transporter = nodemailer.createTransport({
    // @ts-ignore: doesn't like gmail?
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.SITE_EMAIL_USER,
      pass: process.env.SITE_EMAIL_PASS,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  });

  const mailOptions = {
    from: `Tctrio Notification Service`,
    to: sendTo,
    subject: `Booking request for the trio.`,
    html: emailHTML(vars),
  };

  transporter.sendMail(mailOptions, callback);
}
