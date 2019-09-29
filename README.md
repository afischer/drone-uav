# Drone UAV

A CLI for viewing drone build status.

### Usage
```bash
$ uav -h
Usage: uav [options] [org[/repo]] [build number]

Options:
  -V, --version  output the version number
  -d, --dev      developer mode - use mocked data
  -h, --help     output usage information
```

For example:
```bash
$ uav acmeCorp/website 70065
⦿ [running] Build 70065 by jsmith updated to latest version of node
  ● clone 00:01
  ⦿ fetch_deps 02:22
  ○ install
  ○ lint
  ○ test
  ○ build
  ○ deploy
```

### Installation

Currently not published on npm! Clone, `cd` into the repo, and run `npm link`.
Requires node >= 10.

A `~/.drone_uav.json` file will be created on first run. You can edit this file if your drone
information changes, or if you would like to change the API poll frequency.


### Todo
- [ ] handle non-200 results
- [ ] clean up async code
- [ ] use streaming json for repos request? It's pretty big.
