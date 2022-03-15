import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";

import { validateRequest } from "../../middleware/validateRequest";
import { BadRequestError } from "../../errors/bad-request-error";
import { User, UserSchema } from "../../db/models/users";

import { environment } from "../../config";
import { NotFoundError } from "../../errors/not-found-error";

const router = express.Router();

router.post(
  "/api/users/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("username").trim().notEmpty().withMessage("Username must be defined"),
    body("password")
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage("Password must be between 6 and 20 characters"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    if (environment === "production") throw new NotFoundError();

    const { username, email, password } = req.body;

    let existingUsers: UserSchema[];
    try {
      existingUsers = await User.select({ email });
    } catch (err) {
      console.log("Error selecting");
      throw err;
    }

    if (existingUsers.length !== 0) {
      throw new BadRequestError("Email already in use");
    }
    existingUsers = await User.select({ username });
    if (existingUsers.length !== 0) {
      throw new BadRequestError("Username already in use");
    }

    let user: UserSchema;
    try {
      user = await User.insert({ email, password, username, admin: true });
    } catch (err) {
      console.log("Error in insert");
      throw err;
    }

    // generate JWT
    const userJwt = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_KEY!,
      {
        expiresIn: "1h",
      }
    );

    res.cookie(
      "x2f01",
      {
        jwt: userJwt,
      },
      {
        sameSite: "strict",
        httpOnly: true,
      }
    );

    res.status(201).send({
      username: user.username,
      email: user.email,
    });
  }
);

export { router as signupRouter };
