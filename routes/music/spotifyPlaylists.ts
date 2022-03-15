import express, { Request, Response } from "express";
import { body, oneOf, param } from "express-validator";

import {
  SpotifyPlaylist,
  SpotifyPlaylistSchema,
  urlBase,
  urlRegex,
} from "../../db/models/spotifyPlaylists";
import { BadRequestError } from "../../errors/bad-request-error";
import { currentUser } from "../../middleware/current-user";
import { validateRequest } from "../../middleware/validateRequest";
import { requireAuth } from "../../middleware/require-auth";
import { NotFoundError } from "../../errors/not-found-error";
import { DuplicateRecordError } from "../../errors/duplicate-records";
import { getPlaylist } from "../../services/spotify";

const router = express.Router();

// Get playlists
router.get(
  "/api/music/playlists",
  currentUser,
  requireAuth,
  async (req: Request, res: Response) => {
    const playlists = await SpotifyPlaylist.select({});

    res.status(200).send({
      playlists: playlists.map(({ name, spotifyId }) => {
        return {
          name,
          id: spotifyId,
        };
      }),
    });
  }
);

// Get songs from a playlist
router.get(
  "/api/music/playlists/:playlist",
  async (req: Request<{ playlist: string }>, res: Response) => {
    const name = req.params.playlist;
    if (!name) throw new NotFoundError();
    const found = await SpotifyPlaylist.select({ name });
    if (!found) throw new NotFoundError();

    const playlist = await getPlaylist(found[0].spotifyId);

    res.status(200).send({
      playlist,
    });
  }
);

// update highlight
router.put(
  "/api/music/playlists",
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

    let playlists: SpotifyPlaylistSchema[];
    try {
      playlists = await SpotifyPlaylist.update(
        {
          name: oldName,
        },
        {
          spotifyId: parsedNewId,
          name: oldName,
        }
      );

      res.send({
        result: {
          value: 1,
          description: "spotify playlist updated",
        },
        playlists: playlists.map((playlist) => {
          return {
            id: playlist.spotifyId,
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

// add highlight
router.post(
  "/api/music/playlists",
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
      const playlist = await SpotifyPlaylist.insert({
        spotifyId: parsedId,
        name: req.body.name,
      });

      res.send({
        result: {
          value: 1,
          description: "Number of spotify playlists created",
        },
        playlists: [
          {
            id: playlist.spotifyId,
            name: playlist.name,
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
  "/api/music/playlists/:playlist",
  currentUser,
  requireAuth,
  async (req: Request<{ playlist: string }>, res: Response) => {
    const name = req.params.playlist;
    if (!name) throw new NotFoundError();

    const numDel = await SpotifyPlaylist.delete({ name });

    if (numDel < 1) throw new NotFoundError();

    res.send({
      result: {
        value: numDel,
        description: "Playlist deleted",
      },
      playlists: [
        {
          name,
        },
      ],
    });
  }
);

export { router as highlightsRouter };

// helper
const handleId = ({ id, url }: { id?: string; url?: string }): string => {
  if (!id && !url)
    throw new BadRequestError("Either id or url must be specified");

  if (url) {
    const idUrl = SpotifyPlaylist.id(url);

    if (id && id !== idUrl)
      throw new BadRequestError("id and url disagree. Only on is necessary");

    return idUrl;
  } else {
    return id!;
  }
};
