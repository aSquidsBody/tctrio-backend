import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { validateRequest } from "../../middleware/validateRequest";
import { User } from "../../db/models/users";
import { BadRequestError } from "../../errors/bad-request-error";
import { InternalServerError } from "../../errors/internal-server-error";
import { currentUser } from "../../middleware/current-user";
import { requireAuth } from "../../middleware/require-auth";
import { NotFoundError } from "../../errors/not-found-error";
import { setJWT } from "../../services/jwt";

const router = express.Router();

router.put(
  "/api/users/update",
  currentUser,
  requireAuth,
  [
    body("username").notEmpty().withMessage("You must supply a username"),
    body("email").trim().notEmpty().withMessage("You must supply an email"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, email } = req.body;

    const currentUser = req.currentUser!;

    const updated = await User.update(
      { id: currentUser.id },
      { username, email }
    );

    if (updated.length === 0) {
      console.log("User not updated");
      throw new NotFoundError();
    }

    const updatedUser = updated[0];

    setJWT(res, updatedUser);

    res.status(200).send({
      updatedUser: {
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  }
);

export { router as updateRouter };
