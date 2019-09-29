const cli = require('commander');

/**
 * parses the passed CLI options
 * @method parseArgs
 * @return {object}  parsed arguments
 */
const parseArgs = () => {
  const opts = {
    org: undefined,
    repo: undefined,
    buildNo: undefined,
    dev: false,
  };

  let error;

  cli
    .version('0.0.1')
    .arguments('[org[/repo]] [build number]')
    .option('-d, --dev', 'developer mode - use mocked data')
    .action((orgRepo, buildNo) => {
      if (!orgRepo) return;

      // get repo and org names, if defined
      const repoArr = orgRepo.split('/');
      [opts.org, opts.repo] = repoArr;

      // get build number and validate
      opts.buildNo = buildNo;

      if (buildNo && !/^[0-9]+$/.test(buildNo)) error = 'Build number must be an integer';
      if (opts.buildNo && !opts.repo) error = 'Specify a repo to view a specific buld';

      if (error) {
        console.warn(`Error: ${error}`);
        process.exit(1);
      }
    });

  cli.parse(process.argv);

  if (cli.dev) opts.dev = true;

  return opts;
};

module.exports = parseArgs;
