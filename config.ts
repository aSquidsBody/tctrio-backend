export const ARTIST_ID = "63GbQYzf0EbxtI9D23IdrU";

type Enviroment = "development" | "staging" | "production";
export const environment = (process.env.DB_ENV as Enviroment) || "development";
