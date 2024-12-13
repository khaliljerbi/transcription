import { AssemblyAI } from "assemblyai";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const assembleyClientSingleton = () => {
  return new AssemblyAI({
    apiKey: process.env.ASSEMBLY_AI_KEY as string,
  });
};

declare const globalThis: {
  assembleyGlobal: ReturnType<typeof assembleyClientSingleton>;
} & typeof global;

const assembleyClient =
  globalThis.assembleyGlobal ?? assembleyClientSingleton();

export default assembleyClient;

if (process.env.NODE_ENV !== "production")
  globalThis.assembleyGlobal = assembleyClient;
