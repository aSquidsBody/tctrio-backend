import express, { Request, Response } from "express";
import {
  SpotifyAlbum,
  spotifyRequest,
  SpotifyTrack,
} from "../../services/spotify";
import { Album, Track } from "../../types/spotify";
import { ARTIST_ID } from "../../config";
import { InternalServerError } from "../../errors/internal-server-error";

const router = express.Router();

interface ArrayResponse<T> {
  items: T[];
}

const convertAlbum = (spotifyAlbum: SpotifyAlbum): Album => {
  return {
    id: spotifyAlbum.id,
    type: spotifyAlbum.type,
    albumType: spotifyAlbum.album_type,
    artist: {
      name: spotifyAlbum.artists[0].name,
      id: spotifyAlbum.artists[0].id,
      uri: spotifyAlbum.artists[0].uri,
    },
    numTracks: spotifyAlbum.total_tracks,
    name: spotifyAlbum.name,
    releaseDate: spotifyAlbum.release_date,
    externalUrl: spotifyAlbum.external_urls.spotify,
    uri: spotifyAlbum.uri,
    images: {
      large: spotifyAlbum.images[0],
      medium: spotifyAlbum.images[1],
      small: spotifyAlbum.images[2],
    },
  };
};

const convertTrack = (spotifyTrack: SpotifyTrack): Track => {
  return {
    artist: {
      uri: spotifyTrack.artists[0].uri,
      name: spotifyTrack.artists[0].name,
      id: spotifyTrack.artists[0].id,
    },
    duration: spotifyTrack.duration,
    externalUrl: spotifyTrack.external_urls.spotify,
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    previewUrl: spotifyTrack.preview_url,
    type: spotifyTrack.type,
    uri: spotifyTrack.uri,
  };
};

router.get("/api/music/album", async (req: Request, res: Response) => {
  // Get a list of all albums from spotify and return them to the client.respData
  const url = `https://api.spotify.com/v1/artists/${ARTIST_ID}/albums`;
  let respData: ArrayResponse<SpotifyAlbum>;
  try {
    respData = await spotifyRequest<ArrayResponse<SpotifyAlbum>>("GET", url);
  } catch (err: any) {
    console.log(
      `Error getting albums from url ${url}.`,
      err.message,
      err.response?.data?.error?.message
    );
    throw new InternalServerError("Error connecting to spotify");
  }

  try {
    const albums: Album[] = respData.items.map((data) => {
      return convertAlbum(data);
    });

    res.status(200).send({ albums });
  } catch (err: any) {
    console.log(`Could not convert albums from url ${url}.`, err.message);
    throw new InternalServerError("Internal server error");
  }
});

// get album
router.get("/api/music/album/:id", async (req: Request, res: Response) => {
  const url = `https://api.spotify.com/v1/albums/${req.params.id}`;
  let respData: SpotifyAlbum;
  try {
    respData = await spotifyRequest<SpotifyAlbum>("GET", url);
  } catch (err: any) {
    console.log(
      `Error getting album from url ${url}.`,
      err.message,
      err.response?.data?.error?.message
    );
    throw new InternalServerError("Error connecting to spotify");
  }

  try {
    const album = convertAlbum(respData);
    res.status(200).send({ album });
  } catch (err: any) {
    console.log(`Could not convert album from url ${url}.`, err.message);
    throw new InternalServerError("Internal server error");
  }
});

// get album tracks
router.get(
  "/api/music/album/:id/tracks",
  async (req: Request, res: Response) => {
    const url = `https://api.spotify.com/v1/albums/${req.params.id}/tracks`;

    let respData: ArrayResponse<SpotifyTrack>;
    try {
      respData = await spotifyRequest<ArrayResponse<SpotifyTrack>>("GET", url);
    } catch (err: any) {
      console.log(
        `Error getting track from url ${url}.`,
        err.message,
        err.response?.data?.error?.message
      );
      throw new InternalServerError("Error connecting to spotify");
    }

    try {
      const tracks = respData.items.map((spotifyTrack) =>
        convertTrack(spotifyTrack)
      );
      res.status(200).send({ tracks });
    } catch (err: any) {
      console.log(`Could not convert album from url ${url}.`, err.message);
      throw new InternalServerError("Internal server error");
    }
  }
);

export { router as albumRouter };
