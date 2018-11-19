const semver = require('semver');
const path = require('path');
const axios = require('axios');
const execa = require('execa');
const fs = require('fs');
const utils = require('./utils');

class Repo {
    constructor(version) {
        if (semver.valid(version) === null) {
            throw new Error(`specified version ${version} is not valid`);
        }

        this.version = version;
        this.containerPath = path.resolve(__dirname, '../../.choppy/repos/');
        this.templatesPath = path.resolve(__dirname, './templates/');
        this.archiveURL = `https://github.com/w12-platform/W12-Product-Blockchain-Protocol/archive/v${version}.zip`;
        this.archivePath = path.resolve(__dirname, '../../.choppy/archives/', version + '.zip');
        this.repoPath = path.resolve(this.containerPath, version + '/');
    }

    async isLocallyExists() {
        return await utils.exists(this.repoPath);
    }

    async isRemoteArchiveExists() {
        try {
            await axios.head(this.archiveURL);
            return true;
        } catch (e) {
            return false;
        }
    }

    async isLocalArchiveExists() {
        return await utils.exists(this.archivePath);
    }

    async downloadArchive() {
        console.log('downloading archive: ', this.archiveURL);

        await utils.ensureDir(path.dirname(this.archivePath));

        const response = await axios.get(this.archiveURL, {
            responseType: 'stream'
        });

        // pipe the result stream into a file on disc
        response.data.pipe(fs.createWriteStream(this.archivePath))

        // return a promise and resolve when download finishes
        const done = new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve()
            })

            response.data.on('error', (e) => {
                reject(e)
            })
        });

        await done;
    }

    async unzipArchive() {
        console.log('unziping archive: ', this.archivePath);

        await utils.ensureDir(this.containerPath, {recursive: true});

        await utils.unzip(this.archivePath, { dir: this.repoPath });

        const root = path.resolve(this.repoPath, (await utils.readdir(this.repoPath))[0]);

        await utils.copy(root, this.repoPath);
        await utils.remove(root);
    }

    async bootstrap() {
        console.log('bootstrapping: ', this.version);

        await utils.copy(path.resolve(this.templatesPath, './truffle.js'), path.resolve(this.repoPath, './truffle.js'));
        await this.clearMigrations();
        await this.clearBuilds();

        const proc = execa.shell('npm ci', { cwd: this.repoPath, reject: false });

        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);

        await proc;
    }

    async clearMigrations() {
        await utils.remove(path.resolve(this.repoPath, './migrations/'));
    }

    async clearBuilds() {
        await utils.remove(path.resolve(this.repoPath, './build/'));
    }

    async execScript(script) {
        await this.clearMigrations();
        await this.clearBuilds();
        // await utils.copy(script.path, path.resolve(this.repoPath, './migrations/1_script.js'));

        const proc = execa.shell('truffle exec -c ' + script.path, { cwd: this.repoPath, reject: false });

        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);

        await proc;
    }

    async install() {
        if (await this.isLocallyExists()) {
            console.log('installed: ', this.version);
            return;
        }

        if (!await this.isLocalArchiveExists()) {
            if (!await this.isRemoteArchiveExists()) {
                throw new Error(`version ${version} dose not exists remotely`);
            }

            await this.downloadArchive();
        }

        await this.unzipArchive();
        await this.bootstrap();

        console.log('installed: ', this.version);
    }
}

module.exports = Repo;
