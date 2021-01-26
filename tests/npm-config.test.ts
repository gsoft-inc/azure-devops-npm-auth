import { expect } from 'chai';
import { NpmConfig, UserNpmConfig, ProjectNpmConfig } from '../npm-config';

describe('user npm config', () => {
    it('user npm file path not empty', () => {
        var config = new UserNpmConfig();
        expect(config.filePath).to.not.be.empty;
    });
});

describe('project npm config', () => {
    it('project npm file path not empty', () => {
        var config = new ProjectNpmConfig(process.cwd());
        expect(config.filePath).to.not.be.empty;
    });
});

describe('npm config', () => {
    it('if npm file doesnt exist, get returns undefined.', () => {
        var config = new NpmConfig("i-dont-exist-path");
        var value = config.get("something");
        expect(value).to.be.undefined;
    });
    it('if npm file doesnt exist, getRegistries returns empty array.', () => {
        var config = new NpmConfig("i-dont-exist-path");
        var value = config.getRegistries();
        expect(value).to.be.an('array').that.is.empty;
    });
});