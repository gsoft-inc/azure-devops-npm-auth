import * as os from "os";
import * as url from "url";
import * as path from "path";
import IniConfig from "./ini-config";
import { execSync } from "child_process";

class NpmConfig extends IniConfig {
  constructor(basePath: string, createIfNotExists = false) {
    if (!basePath) {
      throw new Error("No base path defined for .npmrc file.");
    }

    if (!basePath.endsWith(".npmrc")) {
      basePath = path.join(basePath, ".npmrc");
    }

    super(basePath, createIfNotExists);
  }

  getRegistries() {
    return Object.keys(this.config)
        .filter(key => key.includes("registry"))
        .map(key => this.get(key))
  };  

  getRegistryRefreshToken(registry: string) {
    const registryUrl = url.parse(registry);
    return this.get(
      `//${registryUrl.hostname}${registryUrl.pathname}:_refreshToken`
    );
  }

  setRegistryAuthToken(registry: string, token: string) {
    const registryUrl = url.parse(registry);
    this.set(
      `//${registryUrl.hostname}${registryUrl.pathname}:_authToken`,
      token
    );
    this.save();
  }

  setRegistryRefreshToken(registry: string, token: string) {
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
    let filePath: string;
    try{
      filePath = execSync("npm config get userconfig", { stdio: ["pipe", "pipe", "ignore"] })
        .toString()
        .trim();
    }
    catch {
      filePath = os.homedir();
    }

    super(filePath, createIfNotExists);
  }
}

class ProjectNpmConfig extends NpmConfig {
  constructor(basePath: string) {
    const filePath = path.join(basePath, ".npmrc");
    super(filePath);
  }
}

export {
  NpmConfig,
  UserNpmConfig,
  ProjectNpmConfig
};
