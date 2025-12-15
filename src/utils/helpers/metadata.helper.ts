import fs from "fs";
import * as zlib from "zlib";
import { Metadata } from "../types/global.type";

export const loadPreloadedTokensMetadata = (
  chainTag: string
): Metadata | null => {
  const base64Content = fs.readFileSync(
    `./assets/${chainTag}/tokens.br`,
    "utf-8"
  );

  const compressedBuffer = Buffer.from(base64Content, "base64");

  const decompressed = zlib.brotliDecompressSync(compressedBuffer);

  const data = JSON.parse(decompressed.toString()) as Metadata | null;

  if (!data) {
    throw new Error("Preloaded tokens metadata not found");
  }

  return data;
};
