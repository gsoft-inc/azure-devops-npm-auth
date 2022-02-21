import { expect } from 'chai';
import { YarnConfig, UserYarnConfig, ProjectYarnConfig } from '../yarn-config';

describe('user yarn config', () => {
    it('user yarn file path not empty', () => {
        var config = new UserYarnConfig();
        expect(config.filePath).to.not.be.empty;
    });
});

describe('project yarn config', () => {
    it('project yarn file path not empty', () => {
        var config = new ProjectYarnConfig(process.cwd());
        expect(config.filePath).to.not.be.empty;
    });
});

describe('yarn config', () => {
    it('if yarn file doesn\'t exist, get returns undefined.', () => {
        var config = new YarnConfig("i-dont-exist-path");
        var value = config.get("something");
        expect(value).to.be.undefined;
    });
    it('if yarn file doesn\'t exist, getRegistries returns empty array.', () => {
        var config = new YarnConfig("i-dont-exist-path");
        var value = config.getRegistries();
        expect(value).to.be.an('array').that.is.empty;
    });
});