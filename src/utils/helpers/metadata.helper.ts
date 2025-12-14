import fs from "fs";
import { Metadata } from "../types/global.type";

export const loadPreloadedTokensMetadata = (
  chainTag: string
): Metadata | null => {
  const data = JSON.parse(
    fs.readFileSync(`./assets/${chainTag}/tokens.json`, "utf-8")
  ) as Metadata | null;

  if (!data) {
    throw new Error("Preloaded tokens metadata not found");
  }

  return data;
};
