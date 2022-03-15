import express, { Request, Response } from "express";
import { oneOf, body, param } from "express-validator";
import { currentUser } from "../../middleware/current-user";
import { requireAuth } from "../../middleware/require-auth";
import { validateRequest } from "../../middleware/validateRequest";
import { BadRequestError } from "../../errors/bad-request-error";
import {
  YoutubePlaylist,
  urlBase,
  urlRegex,
  YoutubePlaylistSchema,
} from "../../db/models/youtubePlaylists";
import { DuplicateRecordError } from "../../errors/duplicate-records";
import { NotFoundError } from "../../errors/not-found-error";
import { getPlaylist } from "../../services/youtube";

const router = express.Router();

// Get all playlists
router.get(
  "/api/videos/playlists",
  async (req: Request<{ playlist: string }>, res: Response) => {
    const playlists = await YoutubePlaylist.select({});

    res.status(200).send({
      playlists: playlists.map(({ name, youtubeId }) => {
        return { id: youtubeId, name };
      }),
    });
  }
);

// get all youtube video ids
router.get(
  "/api/videos/playlists/:playlist",
  async (req: Request<{ playlist: string }>, res: Response) => {
    const name = req.params.playlist;
    if (!name) throw new NotFoundError();
    const playlist = await YoutubePlaylist.select({ name });
    if (!playlist) {
      throw new NotFoundError();
    }

    const ids = await getPlaylist(playlist[0].youtubeId);
    res.status(200).send({
      playlist: {
        id: playlist,
        videos: ids.map((id) => {
          return { id };
        }),
      },
    });
  }
);

// update a playlist
router.put(
  "/api/videos/playlists",
  [
    oneOf(
      [body("newId").trim().notEmpty(), body("newUrl").trim().notEmpty()],
      "No newId or newUrl specified"
    ),
    body("oldName").exists().trim().notEmpty().withMessage("Name required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      oldName,
      newId,
      newUrl,
    }: {
      oldName: string;
      newId: string;
      newUrl: string;
    } = req.body;
    const parsedNewId = handleId({ id: newId, url: newUrl });

    let yt: YoutubePlaylistSchema[];
    try {
      yt = await YoutubePlaylist.update(
        {
          name: oldName,
        },
        {
          youtubeId: parsedNewId,
          name: oldName,
        }
      );

      res.send({
        result: {
          value: yt.length,
          description: "Number of youtube playlists updated",
        },
        playlists: yt.map((playlist) => {
          return {
            id: playlist.youtubeId,
            name: playlist.name,
          };
        }),
      });
    } catch (err: any) {
      if (err.message === "Not found") throw new NotFoundError();
      throw err;
    }
  }
);

// add a new video
router.post(
  "/api/videos/playlists",
  [
    oneOf(
      [body("id").trim().notEmpty(), body("url").trim().notEmpty()],
      "No id or url specified"
    ),
    body("name").exists().trim().isString(),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const parsedId = handleId(req.body);

    try {
      const yt = await YoutubePlaylist.insert({
        youtubeId: parsedId,
        name: req.body.name,
      });

      res.send({
        result: {
          value: 1,
          description: "Number of youtube playlists created",
        },
        playlists: [
          {
            id: yt.youtubeId,
            name: yt.name,
          },
        ],
      });
    } catch (err: any) {
      if (err.message === "Duplicate record")
        throw new DuplicateRecordError(
          "Field conflict; record already exists",
          "id"
        );
      throw err;
    }
  }
);

router.delete(
  "/api/videos/playlists/:playlist",
  currentUser,
  requireAuth,
  async (req: Request<{ playlist: string }>, res: Response) => {
    const youtubeId = req.params.playlist;

    if (!youtubeId) throw new NotFoundError();

    const numDel = await YoutubePlaylist.delete({ youtubeId });

    if (numDel < 1) throw new NotFoundError();

    res.send({
      result: {
        value: numDel,
        description: "Video deleted",
      },
      videos: [
        {
          youtubeId,
        },
      ],
    });
  }
);

export { router as youtubeRouter };

// helper
const handleId = ({ id, url }: { id?: string; url?: string }): string => {
  if (!id && !url)
    throw new BadRequestError("Either id or url must be specified");

  let idUrl: string;
  if (url) {
    idUrl = YoutubePlaylist.id(url);

    if (id && id !== idUrl)
      throw new BadRequestError("id and url disagree. Only one is necessary");

    return idUrl;
  } else {
    return id!;
  }
};
