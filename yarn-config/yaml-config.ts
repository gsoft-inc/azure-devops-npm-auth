import * as fs from "fs";
import * as yaml from 'js-yaml';

export type YamlSettings = {
    [key: string]: YamlSettings | string;
}

class YamlConfig {

    filePath: string;

    config: YamlSettings;

    constructor(filePath: string, createIfNotExists = false) {
        this.filePath = filePath;
        this.config = {};

        if (!fs.existsSync(filePath) && createIfNotExists) {
            fs.writeFileSync(filePath, yaml.dump({}));
        }

        if (fs.existsSync(filePath)) {
            this.load();
        }
    }

    get = (key: string) => this.config[key];

    set = (key: string, value: string | YamlSettings) => this.config[key] = value;

    save = () => fs.writeFileSync(this.filePath, yaml.dump(this.config));

    // load = () => this.config = ini.parse(fs.readFileSync(this.filePath, "utf8"));
    load = () => this.config = yaml.load(fs.readFileSync(this.filePath, "utf8")) as YamlSettings;
}

export default YamlConfig;