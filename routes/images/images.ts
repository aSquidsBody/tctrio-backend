import express, { Request, Response } from "express";
import path from "path";

const router = express.Router();

router.get("/images/signatures", async (req: Request, res: Response) => {
  res
    .status(200)
    .setHeader("Content-Type", "image/png")
    .sendFile(path.resolve("./static/sig_white.png"));
});

export { router as imagesRouter };
