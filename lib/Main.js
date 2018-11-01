const path = require('path');
const execa = require('execa');
const utils = require('./utils');
const Repo = require('./Repo');

const pattern = /^(\d{1,4}\.\d{1,4}\.\d{1,4})_.+$/;

class Main {
    constructor(version, args) {
        this.version = version;
        this._args = args;
        this.prog = require('commander');
        this.containerPath = path.resolve(process.cwd(), './.repos/');
        this.templatesPath = path.resolve(process.cwd(), './lib/templates/');
        this.repos = [];

        this.parseArguments();
    }

    parseArguments() {
        this.prog
            .version(this.version);

        this.prog
            .command('add <versions...>')
            .description('load specified versions of contracts')
            .action(this.addContracts.bind(this));

        this.prog
            .command('run <scripts...>')
            .description('run one or move scripts')
            .action(this.runScripts.bind(this));

        this.prog
            .command('net')
            .description('run ethereum test rpc')
            .action(async () => {
                const inst = execa.shell('npm run dev-net');

                inst.stdout.pipe(process.stdout);
                inst.stderr.pipe(process.stderr);

                await inst;
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

    async runScripts(scripts) {
        await this.loadScripts(scripts);
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

    async loadScripts(scripts) {
        this.scripts = scripts.map(name => this.parseScript(name));
    }

    async loadRepos() {
        const list = await this.getReposList();

        this.repos = list.map(v => new Repo(v));
    }

    async getReposList() {
        if (!await utils.exists(this.containerPath)) return [];

        return await utils.readdir(this.containerPath);
    }

    parseScript(name) {
        return {
            version: name.match(pattern)[1],
            name,
            path: path.resolve(process.cwd(), './scripts', name + '.js')
        };
    }
}


module.exports = Main;
