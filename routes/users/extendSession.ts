import express, { Request, Response } from "express";
import { currentUser } from "../../middleware/current-user";
import { requireAuth } from "../../middleware/require-auth";
import { setJWT } from "../../services/jwt";

const router = express.Router();

router.get(
  "/api/users/extend-session",
  currentUser,
  requireAuth,
  (req: Request, res: Response) => {
    const currentUser = req.currentUser!;
    setJWT(res, currentUser);
    res.status(200).send({
      message: "success",
    });
  }
);

export { router as extendSessionRouter };
