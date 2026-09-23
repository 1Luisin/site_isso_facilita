import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const paths = ["public/social", "src/app/apple-icon.png", "src/app/favicon.ico"];
const diff = spawnSync("git", ["diff", "--exit-code", "HEAD", "--", ...paths], {
  cwd, stdio: "inherit",
});
const untracked = spawnSync("git", ["ls-files", "--others", "--exclude-standard", "--", ...paths], {
  cwd, encoding: "utf8",
});
if (diff.status !== 0 || untracked.status !== 0 || untracked.stdout.trim()) {
  console.error("Assets sociais desatualizados ou não versionados. Execute npm run generate:social e faça commit dos assets junto com o conteúdo.");
  if (untracked.stdout) console.error(untracked.stdout);
  process.exitCode = 1;
} else {
  console.log("Assets sociais sincronizados com o Git.");
}
