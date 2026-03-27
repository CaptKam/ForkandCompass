const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// pnpm uses symlinks — tell Metro to watch the real locations
config.watchFolders = [monorepoRoot];

// Resolve packages from both the project and workspace root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Follow symlinks (required for pnpm)
config.resolver.unstable_enableSymlinks = true;

// Exclude .local (temp/skills files) and .git from Metro's file watcher
// to prevent ENOENT crashes when Replit deletes temp files during a session
config.resolver.blockList = [
  new RegExp(`${path.resolve(monorepoRoot, ".local").replace(/\\/g, "/")}(/.*)?$`),
  new RegExp(`${path.resolve(monorepoRoot, ".git").replace(/\\/g, "/")}(/.*)?$`),
];

module.exports = config;
