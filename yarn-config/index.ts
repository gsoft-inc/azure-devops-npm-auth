import * as os from "os";
import * as url from "url";
import * as path from "path";
import YamlConfig, { YamlSettings } from "./yaml-config";
import { execSync } from "child_process";

class YarnConfig extends YamlConfig {
  constructor(basePath: string, createIfNotExists = false) {
    if (!basePath) {
      throw new Error("No base path defined for .yarnrc.yml file.");
    }

    if (!basePath.endsWith(".yarnrc.yml")) {
      basePath = path.join(basePath, ".yarnrc.yml");
    }

    super(basePath, createIfNotExists);
  }

  getRegistries() {
    return this.getRegistriesHelper(this.config);
  };

  private getRegistriesHelper(config: YamlSettings) {
    const configKeys = Object.keys(config);
    let registries: string[] = [];

    configKeys.forEach(key => {
      const settingValue = config[key];
      if (typeof settingValue === "object") {
        registries.push(...this.getRegistriesHelper(settingValue))
      } else {
        if (key.indexOf("npmRegistryServer") > -1) {
          registries.push(settingValue);
        }
      }
    });

    return registries;
  }

  getRegistryRefreshToken(_registry: string): string {
    // Return undefined because the Yarn 2+ Yaml definition doesn't support
    // a place to store refresh tokens. Maybe there is a way to add this where
    // Yarn won't complain, but not currently sure how.
    return undefined;
  }

  setRegistryAuthToken(registry: string, token: string) {
    const registryUrl = url.parse(registry);
    const registryKey: string = `${registryUrl.hostname}${registryUrl.pathname}`;
    this.set('npmRegistries', {
      ...(typeof this.get('npmRegistries') === 'object' ? this.get('npmRegistries') as YamlSettings : {}),
      [registryKey]: {
        'npmAuthToken': token
      }
    });
    this.save();
  }

  setRegistryRefreshToken(_registry: string, _token: string) {
    // Return void because the Yarn 2+ Yaml definition doesn't support
    // a place to store refresh tokens. Maybe there is a way to add this where
    // Yarn won't complain, but not currently sure how.
    return;
  }
}

class UserYarnConfig extends YarnConfig {
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
    if (filePath.endsWith(".npmrc")) {
      filePath = path.join(filePath.substring(0, filePath.length - ".npmrc".length), ".yarnrc.yml");
    } else {
      filePath = path.join(filePath, ".yarnrc.yml");
    }

    super(filePath, createIfNotExists);
  }
}

class ProjectYarnConfig extends YarnConfig {
  constructor(basePath: string) {
    const filePath = path.join(basePath, ".yarnrc.yml");
    super(filePath);
  }
}

export {
  YarnConfig,
  UserYarnConfig,
  ProjectYarnConfig
};
