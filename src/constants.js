const COLOR_RESET = '\u001b[0m';
const COLOR_WHITE = '\u001b[37m';
const COLOR_RED = '\u001b[31m';
const COLOR_GREEN = '\u001b[32m';
const COLOR_YELLOW = '\u001b[33m';
const COLOR_GRAY = '\u001b[90m';

const pendIcon = `${COLOR_GRAY}○${COLOR_WHITE}`;
const passIcon = `${COLOR_GREEN}●${COLOR_WHITE}`;
const workIcon = `${COLOR_YELLOW}⦿${COLOR_WHITE}`;
const skipIcon = `${COLOR_GRAY}⊝${COLOR_WHITE}`;
const failIcon = `${COLOR_RED}⊗${COLOR_WHITE}`;
// ⊝⊚⦾⦿🞅○

exports.DEFAULT_POLL_DELAY = 4000;


exports.grayText = (text) => `${COLOR_GRAY}${text}${COLOR_RESET}`;

exports.getIcon = (state) => {
  switch (state) {
    case 'success':
      return passIcon;
    case 'running':
      return workIcon;
    case 'failure':
      return failIcon;
    case 'skipped':
      return skipIcon;
    case 'pending':
    default:
      return pendIcon;
  }
};
