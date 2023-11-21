const chalk = require('chalk');
const readline = require('readline');
const R = require('ramda');

function readFromPipe() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  return new Promise((resolve) => {
    let content = '';
    rl.on('line', (line) => {
      content += line;
    });
    rl.once('close', () => {
      resolve(content);
    });
  });
}

let readlineSingleton = null;

function getReadlineInstance() {
  if (!readlineSingleton) {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    readlineSingleton = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readlineSingleton.on('history', () => {
      // console.log(
      //   `\nhistory updated: ${JSON.stringify(readlineSingleton.history)}\n`,
      // );
    });
  }
  return readlineSingleton;
}

function readFromUserInput(prompt) {
  const rl = getReadlineInstance();

  return new Promise((resolve) =>
    rl.question(prompt, (input) => {
      resolve({ input: R.trim(input), history: rl.history, rl });
    }),
  );
}

function echo(...args) {
  const text = R.join('')(args);
  process.stdout.write(text);
}

const newline = () => echo('\n');

function error(...args) {
  const text = R.join('')(args);
  process.stderr.write(chalk.red(text));
}

const shouldExit = (str) => R.includes(R.toLower(str))(['q', 'quit', 'exit']);

module.exports = {
  error,
  readFromPipe,
  newline,
  shouldExit,
  echo,
  readFromUserInput,
};
