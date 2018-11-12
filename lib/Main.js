const path = require('path');
const execa = require('execa');
const axios = require('axios');
const utils = require('./utils');
const Repo = require('./Repo');

const pattern = /^(\d{1,4}\.\d{1,4}\.\d{1,4}(-(alpha|beta|rc)(\.\d+)?)?)_.+$/;

class Main {
    constructor(version, args) {
        this.version = version;
        this._args = args;
        this.prog = require('commander');
        this.root = path.resolve(__dirname, '../');
        this.containerPath = path.resolve(__dirname, '../.repos/');
        this.templatesPath = path.resolve(__dirname, './templates/');
        this.repos = [];

        this.parseArguments();
    }

    parseArguments() {
        this.prog
            .version(this.version);

        this.prog
            .command('add <versions...>')
            .description('load specified versions of contracts')
            .action((versions, cmd) => {
                this.addContracts(versions)
                    .catch((e) => console.error(e));
            });

        this.prog
            .command('run <scripts...>')
            .description('run one or more scripts')
            .option('-c, --custom [path]', 'load scripts from custom directory')
            .description('run one or move scripts')
            .action((scripts, cmd) => {
                this.runScripts(scripts, cmd.custom)
                    .catch((e) => console.error(e));
            });

        this.prog
            .command('net')
            .description('run ethereum test rpc')
            .action(async () => {
                const inst = execa.shell('npm run dev-net', { cwd: this.root, reject: false });

                inst.stdout.pipe(process.stdout);
                inst.stderr.pipe(process.stderr);

                await inst;
            });

        this.prog
            .command('list')
            .description('show list of repos')
            .option('-i, --installed', 'installed repos')
            .option('-r, --remote', 'remote repos')
            .action(async (cmd) => {
                let list = [];

                try {
                    if (
                        cmd.installed
                        || !cmd.installed && !cmd.remote
                    ) {
                        list = await this.getReposList();
                    }

                    if (cmd.remote) {
                        list = await this.getRemoteReposList();
                    }
                } catch (e) {
                    console.error(e);
                }

                console.log(list.length ? list.join('\n') : 'nothing');
                process.exit(0);
            });

        this.prog
            .command('scripts')
            .description('show list of scripts')
            .option('-c, --custom [path]', 'look up to custom directory')
            .action(async (cmd) => {
                let list = [];

                try {
                    list = await this.getScriptsList(cmd.custom);
                } catch (e) {
                    console.error(e);
                }

                console.log(list.length ? list.join('\n') : 'nothing');
                process.exit(0);
            });

        this.prog.parse(this._args);
    }

    async addContracts(versions) {
        if (versions.length === 0) {
            console.log('nothing to add');
            process.exit(0);
        }

        const repos = versions.map(v => new Repo(v));

        try {
            await Promise.all(repos.map(r => r.install()));
        } catch (e) {
            console.error(e);
        }
    }

    async runScripts(scripts, customPath) {
        await this.loadScripts(scripts, customPath);
        await this.loadRepos();

        for (const script of this.scripts) {
            if (!await utils.exists(script.path)) {
                throw new Error(`script "${script.name}" dose not exists`);
            }

            if (!script.version) {
                throw new Error(`wrong repo version at script name "${script.name}"`);
            }

            const repo = this.repos.find(r => r.version === script.version);

            if (!repo) {
                throw new Error(`repo of version "${script.version}" not found`);
            }

            await repo.execScript(script);
        }
    }

    async loadScripts(scripts, customPath) {
        this.scripts = scripts.map(name => this.parseScript(name, customPath));
    }

    async loadRepos() {
        const list = await this.getReposList();

        this.repos = list.map(v => new Repo(v));
    }

    async getReposList() {
        if (!await utils.exists(this.containerPath)) return [];

        return await utils.readdir(this.containerPath);
    }

    async getScriptsList(customPath) {
        const container = this.resolvePathToScripts(customPath);

        if (!await utils.exists(container)) return [];

        return (await utils.readdir(container)).map(p => p.slice(0, -3));
    }

    async getRemoteReposList() {
        try {
            const {data} = await axios.get('https://api.github.com/repos/w12-platform/W12-Product-Blockchain-Protocol/git/refs/tags', {
                headers: {
                    Accept: 'application/vnd.github.v3+json'
                }
            });
            const list = data.map(r => r.ref.slice(11)); // "refs/tags/v0.0.1" -> "0.0.1"

            return list;
        } catch (e) {
            console.error(e);
            throw new Error('fail to load repos list');
        }
    }

    resolvePathToScripts(customPath) {
        return (
            customPath
                ? path.isAbsolute(customPath)
                    ? customPath
                    : path.resolve(process.cwd(), customPath)
                : path.resolve(__dirname, '../scripts')
        );
    }

    resolvePathToScript(customPath, name) {
        return path.resolve(this.resolvePathToScripts(customPath), name + '.js');
    }

    parseScript(name, customPath) {
        return {
            version: name.match(pattern)[1],
            name,
            path: this.resolvePathToScript(customPath, name)
        };
    }
}


module.exports = Main;
