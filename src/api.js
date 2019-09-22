const axios = require('axios');

exports.getRepos = async () => {
  const reqURL = '/user/repos';
  const res = await axios.get(reqURL);
  return res;
};

exports.getBuilds = async (repo) => {
  const reqURL = `/repos/${repo}/builds`;
  const res = await axios.get(reqURL);
  return res;
};

exports.getBuild = async (repo, number) => {
  if (!repo || !number) throw new Error('Invalid params');
  const reqURL = `/repos/${repo}/builds/${number}`;
  const res = await axios.get(reqURL);
  return res;
};
