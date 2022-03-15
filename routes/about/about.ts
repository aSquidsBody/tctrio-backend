import express, { Request, Response } from "express";
import { body } from "express-validator";
import { Text } from "../../db/models/text";
import { BadRequestError } from "../../errors/bad-request-error";
import { DuplicateRecordError } from "../../errors/duplicate-records";
import { NotFoundError } from "../../errors/not-found-error";
import { currentUser } from "../../middleware/current-user";
import { requireAuth } from "../../middleware/require-auth";
import { validateRequest } from "../../middleware/validateRequest";

const ABOUT_NAME = "about";

const router = express.Router();

router.get("/api/about", async (req: Request, res: Response) => {
  const bios = await Text.select({ name: ABOUT_NAME });

  if (bios.length < 1) {
    throw new NotFoundError();
  }

  res.status(200).send({
    text: bios[0].text,
  });
});

// create the about text
router.post(
  "/api/about",
  currentUser,
  requireAuth,
  [body("text").exists().withMessage("Missing text param")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { text }: { text: string } = req.body;
    const name = ABOUT_NAME;

    try {
      const t = await Text.insert({ name, text });

      res.send({
        result: {
          value: 1,
          description: "'About' created",
        },
        text,
        name,
      });
    } catch (err: any) {
      if (err.message === "Duplicate record")
        throw new BadRequestError("About text already exists.");
      throw err;
    }
  }
);

// update the about text
router.put(
  "/api/about",
  currentUser,
  requireAuth,
  [body("text").exists().withMessage("Missing text param")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { text }: { text: string } = req.body;
    const name = ABOUT_NAME;
    try {
      const t = await Text.update({ name }, { name, text });

      res.send({
        result: {
          value: 1,
          description: "About updated",
        },
        name,
        text,
      });
    } catch (err: any) {
      if (err.message === "Not found") throw new NotFoundError();
      throw err;
    }
  }
);

router.delete(
  "/api/about",
  currentUser,
  requireAuth,
  async (req: Request, res: Response) => {
    const name = ABOUT_NAME;
    const numDel = await Text.delete({ name });

    if (numDel < 1) throw new NotFoundError();

    res.send({
      result: {
        value: numDel,
        description: "'about' deleted",
      },
      name,
    });
  }
);

export { router as aboutRouter };
