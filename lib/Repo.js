const semver = require('semver');
const path = require('path');
const axios = require('axios');
const execa = require('execa');
const fs = require('fs');
const utils = require('./utils');

const DEFAULT_SOURCE = 'w12-platform/W12-Product-Blockchain-Protocol';
const ORIGIN_RX = /^[^\/]+\/[^\/]+$/;
const validateOrigin = (origin) => ORIGIN_RX.test(origin);
const toBase64 = (string) => Buffer.from(string, 'utf8').toString('base64');
const fromBase64 = (string) => Buffer.from(string, 'base64').toString('utf8');

class Repo {
    static fromFsName(fsName) {
        const ID = fromBase64(fsName);
        let [source, ref] = ID.split(':');
        if (!ref && source) {
            ref = source;
            source = undefined;
        }
        return new Repo(source, ref);
    }

    constructor(source, ref) {
        if (source && !validateOrigin(source)) {
            throw new Error('the origin must be a <OWNER>/<REPO>');
        }

        this.source = source || DEFAULT_SOURCE;
        this.ref = ref;
        this.ID = `${this.source === DEFAULT_SOURCE ? '' : this.source + ':'}${this.ref}`;
        this.containerPath = path.resolve(__dirname, '../../.choppy/repos/');
        this.templatesPath = path.resolve(__dirname, './templates/');
        this.archiveURL = `${this.originURL}/archive/${ref}.zip`;
        this.archivePath = path.resolve(__dirname, '../../.choppy/archives/', this.fsName + '.zip');
        this.repoPath = path.resolve(this.containerPath, this.fsName);
    }

    get originURL() { return `https://github.com/${this.source}`; }

    get fsName() { return toBase64(this.ID); }

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
        if (!await this.isRemoteArchiveExists()) {
            throw new Error(`Archive ${this.archiveURL} does not exists remotely`);
        }

        console.log('Downloading archive: ', this.archiveURL);

        await utils.ensureDir(path.dirname(this.archivePath));

        const response = await axios.get(this.archiveURL, {
            responseType: 'stream'
        });

        response.data.pipe(fs.createWriteStream(this.archivePath))

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
        console.log('Unziping archive: ', this.archivePath);

        await utils.ensureDir(path.dirname(this.archivePath));
        await utils.unzip(this.archivePath, { dir: this.repoPath });

        const root = path.resolve(this.repoPath, (await utils.readdir(this.repoPath))[0]);

        await utils.copy(root, this.repoPath);
        await utils.remove(root);
    }

    async bootstrap() {
        console.log('Bootstrapping: ', this.ID);

        await utils.copy(path.resolve(this.templatesPath, './truffle.js'), path.resolve(this.repoPath, './truffle.js'));
        await this.clearMigrations();
        await this.clearBuilds();

        const proc = execa.shell('npm ci', { cwd: this.repoPath, reject: false });

        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);

        await proc;
    }

    async remove() {
        console.log('Removing: ', this.ID);
        await utils.remove(this.archivePath);
        await utils.remove(this.repoPath);
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

        console.log(`Running: ${script.name}`);
        console.log(`Contracts: ${this.ID}`);
        console.log('');
        console.log('Note that the script should compile contracts before run...');
        console.log('');

        const proc = execa.shell('truffle exec -c ' + script.path, { cwd: this.repoPath, reject: false });

        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);

        await proc;
    }

    async install() {
        if (await this.isLocallyExists()) {
            console.log('Installed: ', this.ID);
            return;
        }

        if (!await this.isLocalArchiveExists()) {
            await this.downloadArchive();
        }

        await this.unzipArchive();
        await this.bootstrap();

        console.log('Installed: ', this.ID);
    }
}

module.exports = Repo;
