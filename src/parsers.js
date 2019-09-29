const process = require('process');
const { getIcon } = require('./constants');

const formatSeconds = (sec) => {
  const padded = (num) => (num < 10 ? `0${num}` : num);

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec) % 60;

  return `${h ? `${padded(h)}:` : ''}${m ? `${padded(m)}` : '00'}:${padded(s)}`;
};

// this is a dumb way to do this but don't want to import a full curses library
let lastProcLength;

exports.parseProc = (proc) => {
  // if this is a repeat run, move back to the beginning and print over
  if (lastProcLength) process.stdout.moveCursor(0, -lastProcLength);
  lastProcLength = 0;

  const tasks = proc.children;
  tasks.forEach((task) => {
    lastProcLength += 1;

    const {
      name, state, start_time: buildStart, end_time: buildEnd,
    } = task;

    let runtime;
    // if process ended - no build end is provided if still running
    if (buildEnd) {
      runtime = formatSeconds(buildEnd - buildStart);
    } else if (state === 'skipped' || state === 'pending') {
      runtime = '';
    } else {
      const elapsed = ((Date.now() / 1000) - new Date(buildStart).getTime());
      runtime = formatSeconds(elapsed);
    }

    process.stdout.write(`  ${getIcon(state)} ${name} ${runtime}\n`);
  });
};
