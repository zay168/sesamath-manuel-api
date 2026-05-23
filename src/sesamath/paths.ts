import path from "node:path";

export const projectRoot = path.resolve(__dirname, "..", "..");
export const dataRoot = path.join(projectRoot, "data");
export const publicRoot = path.join(projectRoot, "public");
export const outRoot = path.join(projectRoot, "out");

export const dataPath = (...parts: string[]): string => path.join(dataRoot, ...parts);
export const publicPath = (...parts: string[]): string => path.join(publicRoot, ...parts);
export const outPath = (...parts: string[]): string => path.join(outRoot, ...parts);
