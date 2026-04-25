import { spawn } from "node:child_process";
import path from "node:path";

const dnsOption = "--dns-result-order=ipv4first";
const existingNodeOptions = process.env.NODE_OPTIONS ?? "";
const nodeOptions = existingNodeOptions.includes(dnsOption)
  ? existingNodeOptions
  : [dnsOption, existingNodeOptions].filter(Boolean).join(" ");

const nextBin = path.resolve("node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
