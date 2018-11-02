# Choppy

Automatization of set-upping a blockchain condition with any contract version

## Commands

`list [-i|--installed, -r|--remote]`

Print list of contracts versions.

 * `--installed` - print locally installed versions
 * `--remote` - print remote versions

`scripts [-c|--custom <path>]`

Print list of available scripts.

* `--custom <path>` - path to custom directory with scripts, e.q. /path/to, ../path/to

`add <versions...>`

Install specified version or versions of contracts.

`run [-c|--custom <path>] <scripts...>`

Run specified script or scripts.

* `--custom <path>` - path to custom directory with scripts, e.q. /path/to, ../path/to

`net`

Run ethereum blockchain testrpc.

## Script name

Script name should consists of contract version(on which this script will be run) and script name.
Script should have corresponding `.js` file in scripts directory.

```
<version>_<name>
0.23.2_script

<scripts_dir>/0.23.2_script.js
```

## Usage

Install CLI:

```
$ npm install -g @w12/choppy
```

Install contracts

```
$ choppy add 0.23.2 0.27.1
```

Print scripts list

```
$ choppy scripts
```

Run dev network
```
$ choppy net
```

Select scripts from list and run
```
$ choppy run 0.23.2_script 0.27.1_script
```

## Notes

All scripts ran by `truffle exec`.


