export interface Token {
  accessToken: string;
  expires: Date;
}

export interface Track {
  artist: Artist;
  duration: number;
  externalUrl: string;
  id: string;
  name: string;
  previewUrl: string;
  type: string;
  uri: string;
}

export interface Album {
  id: string;
  type: string;
  albumType: string;
  artist: Artist;
  images: {
    large: AlbumCover;
    medium: AlbumCover;
    small: AlbumCover;
  };
  numTracks: number;
  name: string;
  releaseDate: string;
  externalUrl: string;
  uri: string;
}

export interface AlbumCover {
  height?: number;
  width?: number;
  url: string;
}

export interface Artist {
  name: string;
  uri: string;
  id: string;
}
