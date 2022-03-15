import express, { Request, Response } from "express";
import { InternalServerError } from "../../errors/internal-server-error";
import { getToken } from "../../services/spotify";

const router = express.Router();

router.get("/api/music/spotify-token", async (req: Request, res: Response) => {
  try {
    const { accessToken, expires } = await getToken();
    res.status(200).send({
      accessToken,
      expires,
    });
  } catch (err: any) {
    console.log("Error getting token from spotify", err.response.data);
    throw new InternalServerError("Error occured while connecting to spotify");
  }
});

export { router as spotifyTokenRouter };
