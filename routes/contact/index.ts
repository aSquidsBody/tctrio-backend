import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest } from "../../middleware/validateRequest";
import nodemailer from "nodemailer";
import { User } from "../../db/models/users";
import { sendEmail } from "../../static/email";

const router = express.Router();

router.post(
  "/api/contact",
  [
    body("name").trim().notEmpty().withMessage("You must supply a name"),
    body("email").isEmail().withMessage("Email must be valid"),
    body("venue").trim(),
    body("comment").trim().notEmpty().withMessage("You must supply a comment"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      name,
      email,
      venue,
      comment,
    }: { name: string; email: string; venue?: string; comment: string } =
      req.body;

    const admin = await User.select({
      username: process.env.SITE_ADMIN,
      admin: true,
    });

    if (admin.length <= 0) {
      throw Error(
        "No admin found with username SITE_ADMIN " + process.env.SITE_ADMIN
      );
    }

    sendEmail(
      admin[0].email,
      { name, email, venue, comment },
      function (error, resolution) {
        if (error) {
          throw error;
        } else {
          res.status(200).send({
            message: "Contact form was submitted successfully",
          });
        }
      }
    );
  }
);

export { router as ContactRouter };
