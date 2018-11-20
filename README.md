# Choppy

Automatization of set-upping a blockchain condition with any contract version

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

Install contract

```
$ choppy add v0.23.2
```

Print scripts list and select witch one to use

```
$ choppy scripts
```

Run test-rpc network

```
$ choppy net
```

Run script

```
$ choppy run 0.23.2_script
```

For additional command usage information

```
$ choppy --help
```

## Notes

All scripts ran by `truffle exec`.


