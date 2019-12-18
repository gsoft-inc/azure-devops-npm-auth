const fs = require("fs");
const ini = require("ini");

class IniConfig {
    constructor(filePath, createIfNotExists = false) {
        if (!fs.existsSync(filePath)) {
            if (createIfNotExists) {
                fs.writeFileSync(filePath, {});
            } else {
                throw new Error(`Configuration file at '${filePath}' doesn't exist.`)
            }
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

module.exports = IniConfig;