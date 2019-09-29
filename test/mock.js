const fs = require('fs');
const path = require('path');

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const mock = new MockAdapter(axios);

function getMock(mockName) {
  return fs.readFileSync(path.join(__dirname, `./fixtures/${mockName}.json`), 'utf8');
}

function getLiveBuild() {
  const build = getMock('build-running');
  // eventually change this to have it progress
  return build;
}

exports.mockEndpoints = () => {
  mock.onGet('/user/repos').reply(200, getMock('repos'));
  mock.onGet(/\/repos\/.*\/.*\/builds$/).reply(200, getMock('builds'));

  mock.onGet(/\/repos\/.*\/.*\/builds\/70064/).reply(200, getMock('build'));
  mock.onGet(/\/repos\/.*\/.*\/builds\/70065/).reply(200, getLiveBuild());

  // mock.onGet(/\/repos\/.*\/.*\/builds\/[0-9]+/).reply(200, getMock('build'));
};
