import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { Password } from "../../services/password";
import { validateRequest } from "../../middleware/validateRequest";
import { User } from "../../db/models/users";
import { BadRequestError } from "../../errors/bad-request-error";
import { InternalServerError } from "../../errors/internal-server-error";
import { setJWT } from "../../services/jwt";

const router = express.Router();

router.post(
  "/api/users/signin",
  [
    body("username").notEmpty().withMessage("You must supply a username"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("You must supply a password"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const users = await User.select({ username });
    if (users.length === 0) {
      throw new BadRequestError("Invalid credentials");
    }
    if (users.length > 1) {
      console.error(
        `found two users with same name ${username} in /api/users/signin`
      );
      throw new InternalServerError("Internal server error");
    }

    if (!(await User.validatePassword(username, password)))
      throw new BadRequestError("Invalid credentials");

    // generate a jwt for the signin
    const existingUser = users[0];
    setJWT(res, existingUser);

    res.status(200).send({
      username: existingUser.username,
      email: existingUser.email,
    });
  }
);

export { router as signinRouter };
