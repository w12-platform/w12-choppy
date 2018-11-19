const path = require('path');
const execa = require('execa');
const axios = require('axios');
const utils = require('./utils');
const Repo = require('./Repo');

const pattern = /^(\d{1,4}\.\d{1,4}\.\d{1,4}(-(alpha|beta|rc)(\.\d+)?)?)_.+$/;
const DEFAULT_SOURCE = 'w12-platform/W12-Product-Blockchain-Protocol';

class Main {
    constructor(version, args) {
        this.version = version;
        this._args = args;
        this.prog = require('commander');
        this.root = path.resolve(__dirname, '../');
        this.containerPath = path.resolve(__dirname, '../../.choppy/repos/');
        this.archivesPath = path.resolve(__dirname, '../../.choppy/archives/');
        this.repos = [];

        this.parseArguments();
    }

    parseArguments() {
        this.prog
            .version(this.version);

        this.prog
            .command('add <ref>')
            .description('Install specified contract version <ref>. <ref> may be a tag name or branch name.')
            .option('-s, --source <url>', 'Specify source for downloading, e.q. i-am-owner/repository-name.')
            .action((ref, cmd) => {
                this.addContracts(cmd.source, ref)
                    .catch((e) => console.error(e));
            });

        this.prog
            .command('run <name>')
            .description('Run script with name <name>. Run `choppy scripts` to see available scripts.')
            .option('-c, --custom <path>', 'Run script from specified directory under <path>.')
            .option('-i, --contractId <contractId>', 'Run script with contract with specified id. Use IDs from `choppy list`.')
            .action((name, cmd) => {
                this.runScript(name, cmd.contractId, cmd.custom)
                    .catch((e) => console.error(e));
            });

        this.prog
            .command('net')
            .description('Run ethereum test-rpc')
            .action(async () => {
                const inst = execa.shell('npm run dev-net', { cwd: this.root, reject: false });

                inst.stdout.pipe(process.stdout);
                inst.stderr.pipe(process.stderr);

                await inst;
            });

        this.prog
            .command('list')
            .description('Show list of contracts [<source>:]<tag|branch name>. By default print locally installed.')
            .option('-i, --installed', 'Show locally installed')
            .option('-a, --all', 'Show all available list')
            .option('-s, --source <url>', 'Specify custom source. <url> must be <owner>/<repo-name>.')
            .action(async (cmd) => {
                let list = [];

                try {
                    if (
                        cmd.installed
                        || !cmd.installed && !cmd.all
                    ) {
                        await this.loadRepos();

                        list = this.repos;
                    }

                    if (cmd.all) {
                        list = await this.getRemoteRepos(cmd.source);
                    }

                    console.log(list.length ? list.map(r => r.ID).join('\n') : 'no items');
                } catch (e) {
                    console.error(e);
                }
            });

        this.prog
            .command('scripts')
            .description('Show list of available scripts')
            .option('-c, --custom <path>', 'Look up to custom directory')
            .action(async (cmd) => {
                await this.loadScripts(cmd.custom);

                console.log(this.scripts.length ? this.scripts.map(s => s.name).join('\n') : 'no items');
            });

        this.prog
            .command('purge')
            .description('Clear all cache data.')
            .action(async () => {
                console.log(`removing: ${this.archivesPath}`);
                await utils.remove(this.archivesPath);
                console.log(`removing: ${this.containerPath}`);
                await utils.remove(this.containerPath);
            });

        this.prog.on('command:*', () => {
            console.error('Invalid command: %s\nSee --help for a list of available commands.', this.prog.args.join(' '));
            process.exit(1);
        });

        if (!process.argv.slice(2).length) {
            this.prog.outputHelp();
        }

        this.prog.parse(this._args);
    }

    async addContracts(source, ref) {
        const repo = new Repo(source, ref);

        await repo.install();
    }

    async runScript(scriptName, id, customPath) {
        await this.loadRepos();
        await this.loadScripts(customPath);

        const script = this.getScript(scriptName);

        if (!script) {
            throw new Error(`Script "${scriptName}" does not exists`);
        }

        if (!script.version && !id) {
            throw new Error(`Wrong contract version at script name "${scriptName}"`);
        }

        id = id || `v${script.version}`;

        const repo = this.repos.find(r => r.ID === id);

        if (!repo) {
            throw new Error(`Contract with id "${id}" does not exists`);
        }

        await repo.execScript(script);
    }

    getScript(name) {
        return this.scripts.find(script => script.name === name);
    }

    async loadScripts(customPath) {
        const container = this.resolvePathToScripts(customPath);

        if (await utils.exists(container)) {

        };

        this.scripts = (await utils.readdir(container))
            .map(p => p.slice(0, -3))
            .map(name => this.parseScript(name, customPath));
    }

    async loadRepos() {
        if (await utils.exists(this.containerPath)) {
            this.repos = (await utils.readdir(this.containerPath)).map(v => {
                return Repo.fromFsName(v.replace(this.containerPath))
            });
        };
    }

    async getRemoteRepos(origin = DEFAULT_SOURCE) {
        const tagResult = await axios.get(`https://api.github.com/repos/${origin}/git/refs/tags`, {
            headers: {
                Accept: 'application/vnd.github.v3+json'
            }
        });
        const branchesResult = await axios.get(`https://api.github.com/repos/${origin}/branches`, {
            headers: {
                Accept: 'application/vnd.github.v3+json'
            }
        });
        const tags = tagResult.data.map(r => r.ref.slice(10)); // "refs/tags/v0.0.1" -> "v0.0.1"
        const branches = branchesResult.data.map(r => r.name);

        return tags.concat(branches)
            .map(ref => new Repo(origin, ref));
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
