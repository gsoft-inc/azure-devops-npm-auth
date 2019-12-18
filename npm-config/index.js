const url = require("url");
const path = require("path");
const IniConfig = require("./ini-config");
const { execSync } = require("child_process");

class NpmConfig extends IniConfig {
  constructor(basePath, createIfNotExists = false) {
    if (!basePath) {
      throw new Error("No base path defined for .npmrc file.");
    }

    if (!basePath.endsWith(".npmrc")) {
      basePath = path.join(basePath, ".npmrc");
    }

    super(basePath, createIfNotExists);
  }

  getRegistry() {
    return this.get("registry");
  }

  getRegistryRefreshToken(registry) {
    const registryUrl = url.parse(registry);
    return this.get(
      `//${registryUrl.hostname}${registryUrl.pathname}:_refreshToken`
    );
  }

  setRegistryAuthToken(registry, token) {
    const registryUrl = url.parse(registry);
    this.set(
      `//${registryUrl.hostname}${registryUrl.pathname}:_authToken`,
      token
    );
    this.save();
  }

  setRegistryRefreshToken(registry, token) {
    const registryUrl = url.parse(registry);
    this.set(
      `//${registryUrl.hostname}${registryUrl.pathname}:_refreshToken`,
      token
    );
    this.save();
  }
}

class UserNpmConfig extends NpmConfig {
  constructor(createIfNotExists = true) {
    const filePath = execSync("npm config get userconfig").toString().trim();
    super(filePath, createIfNotExists);
  }
}

class ProjectNpmConfig extends NpmConfig {
  constructor() {
    const filePath = path.join(process.cwd(), '.npmrc');
    super(filePath);
  }
}

module.exports = { 
  NpmConfig,
  UserNpmConfig,
  ProjectNpmConfig
 };
