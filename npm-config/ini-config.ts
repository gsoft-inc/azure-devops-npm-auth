import * as fs from "fs";
import * as ini from "ini";

class IniConfig {

    filePath: string;
    
    config: { [key: string]: string };
    
    constructor(filePath: string, createIfNotExists = false) {
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

    get = (key: string) => this.config[key];

    set = (key: string, value: string) => this.config[key] = value;

    save = () => fs.writeFileSync(this.filePath, ini.encode(this.config));

    load = () => this.config = ini.parse(fs.readFileSync(this.filePath, "utf8"));
}

export default IniConfig;