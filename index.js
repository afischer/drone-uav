#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const { Form, AutoComplete } = require('enquirer');

const parseArgs = require('./src/cli');
const { getRepos, getBuilds, getBuild } = require('./src/api');
const { grayText, getIcon } = require('./src/constants');
const { parseProc } = require('./src/parsers');

const DEFAULT_POLL_DELAY = 4000;

let BASE_CONFIG = { POLL_DELAY_MS: DEFAULT_POLL_DELAY };
let currentRepo;
let lastBuild;

// Get drone token
async function setup() {
  try {
    const configJsonPath = path.join(os.homedir(), '.drone_uav.json');
    if (fs.existsSync(configJsonPath)) { // file exists, read config
      // eslint-disable-next-line global-require
      BASE_CONFIG = { ...BASE_CONFIG, ...require(configJsonPath) };
    } else { // no config file, attempt to create
      const form = new Form({
        name: 'drone_uav',
        message: 'Welcome to uav! Enter the following info to create a ~/.drone_uav.json config file.',
        choices: [
          { name: 'DRONE_URL', message: 'Drone Instane URL', initial: 'https://drone.yourco.com' },
          { name: 'DRONE_TOKEN', message: 'Personal Drone Token', initial: '' },
        ],
      });

      // get answers to form,
      const answers = await form.run();
      BASE_CONFIG = { ...BASE_CONFIG, ...answers };

      // write config to file
      fs.writeFile(
        configJsonPath,
        JSON.stringify(BASE_CONFIG, null, 2),
        (err) => { throw new Error(err); },
      );
    }

    if (!BASE_CONFIG.DRONE_TOKEN) throw new Error('No drone token provided. Check ~/.drone_uav.json');
    if (!BASE_CONFIG.DRONE_URL) throw new Error('No drone URL provided. Check ~/.drone_uav.json');
  } catch (e) {
    console.warn('Error setting up uav:');
    if (e) console.warn(e);
    process.exit(1);
  }

  const { DRONE_URL, DRONE_TOKEN } = BASE_CONFIG;

  axios.defaults.baseURL = `${DRONE_URL}/api`;
  axios.defaults.headers.common = { Authorization: `Bearer ${DRONE_TOKEN}` };
}

const getRepoNames = async (org) => getRepos().then(
  async (res) => {
    const repos = res.data;
    const repoNames = repos.map(({ full_name: fName }) => fName);
    if (org) { // if org provided, only return those
      const orgRepos = repoNames.filter((name) => name.startsWith(org));
      if (!orgRepos.length) { // none found
        console.warn(`No repos found for ${org}.`);
        process.exit(1);
      }
      return orgRepos;
    }
    return repoNames;
  },
).catch((e) => { throw new Error(e); });

const getBuildNames = async (repo) => getBuilds(repo).then(
  async (res) => {
    const builds = res.data;

    return builds.map((build) => {
      const {
        number, status, author, message,
      } = build;
      // sometimes messages can have newlines, be really long, so truncate
      // for the list, add ellipses if shortened
      let truncatedMsg = message.replace(/\n/g, ' ').substring(0, 70);
      if (truncatedMsg !== message) truncatedMsg += '…';
      const icon = getIcon(status);
      const authorText = grayText(`by ${author}`);
      return `${icon} [${number}] ${truncatedMsg} ${authorText}`;
    });
  },
).catch((e) => { throw new Error(e); });

const logBuild = async (repo, buildNo) => {
  // if we have a previously fetched build that's fresh enough, use that
  // gives impression of being more live
  const fetchDelta = lastBuild && new Date().getTime() - lastBuild.fetchedAt;
  if (lastBuild && fetchDelta < BASE_CONFIG.POLL_DELAY_MS) {
    const { procs } = lastBuild;
    procs.forEach((proc) => parseProc(proc));
    return;
  }

  // if time outside query time or on first fetch
  await getBuild(repo, buildNo).then(
    (res) => {
      const {
        status, number, message, author, procs,
      } = res.data;

      // print header if first build fetch
      if (!lastBuild) {
        const buildHeader = `Build ${number} by ${author} ${grayText(message)}`;
        // eslint-disable-next-line no-console
        console.log(`${getIcon(status)} [${status}] ${buildHeader}`);
      }

      procs.forEach((proc) => parseProc(proc));

      // exit if we're no longer running
      if (status !== 'running') process.exit(0);

      // if first fetch, set to repeat every second
      if (!lastBuild) setInterval(() => logBuild(repo, buildNo), 1000);

      // set last build and it's queryTime
      lastBuild = res.data;
      lastBuild.fetchedAt = new Date().getTime();
    },
  ).catch((e) => () => { throw new Error(e); });
};

const promptForBuild = (repo) => {
  const prompt = new AutoComplete({
    name: 'builds',
    message: 'View build',
    limit: 20,
    choices: getBuildNames(repo),
  });

  prompt.run()
    .then((buildDesc) => {
      // i am to tired to figure out groups rn why isnt this working
      const buildNo = buildDesc.match(/\[([0-9])+\]/g)[0].slice(1, -1);
      logBuild(currentRepo, buildNo);
    })
    .catch((e) => { throw new Error(e); });
};

const promptForRepo = (org) => {
  const prompt = new AutoComplete({
    name: 'repos',
    message: 'View build details for',
    limit: 20,
    choices: getRepoNames(org),
  });

  prompt.run()
    .then((repo) => {
      currentRepo = repo;
      promptForBuild(repo);
    })
    .catch((e) => { throw new Error(e); });
};


async function run() {
  await setup();
  const {
    org, repo, buildNo, dev,
  } = parseArgs(); // args are pre-validated

  // turn on dev mode
  if (dev) require('./test/mock').mockEndpoints(); // eslint-disable-line global-require

  // got buildNo, show specific build
  if (buildNo) return logBuild(`${org}/${repo}`, buildNo);
  // got repo, show list of builds
  if (repo) return promptForBuild(`${org}/${repo}`);
  // got org, show list of repos
  if (org) return promptForRepo(org);
  // otherwise, just query for all repos
  return promptForRepo();
}

run();
