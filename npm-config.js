const fs = require("fs");
const ini = require("ini");
const url = require("url");

class IniConfig {
    constructor(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Configuration file at '${filePath}' doesn't exist.`)
        }

        this.filePath = filePath;
        this.config = {};
        this.load();
    }

    get = (key) => this.config[key];

    set = (key, value) => this.config[key] = value;

    save = () => fs.writeFileSync(this.filePath, ini.encode(this.config));

    load = () => this.config = ini.parse(fs.readFileSync(this.filePath, "utf8"));
}

class NpmConfig extends IniConfig {
    constructor(filePath) {
        super(filePath);
    }

    getRegistry() {
        return this.get('registry');
    }

    getRegistryRefreshToken(registry) {
        const registryUrl = url.parse(registry);
        return this.get(`//${registryUrl.hostname}${registryUrl.pathname}:_refreshToken`);
    }

    setRegistryAuthToken(registry, token) {
        const registryUrl = url.parse(registry);
        this.set(`//${registryUrl.hostname}${registryUrl.pathname}:_authToken`, token);
        this.save();
    }

    setRegistryRefreshToken(registry, token) {
        const registryUrl = url.parse(registry);
        this.set(`//${registryUrl.hostname}${registryUrl.pathname}:_refreshToken`, token);
        this.save();
    }
}

module.exports = NpmConfig;