const chalk = require('chalk');
const readline = require('readline');
const R = require('ramda');
const { chatCompletionFactory } = require('./openai');
const config = require('./config');

let conversation = [];

function getConversation() {
  const history = R.takeLast(config.getConversationContext(), conversation);
  return history;
}

function clearConversation() {
  conversation = [];
}

function conversationAddUser(content) {
  conversation.push({ role: 'user', content });
}

function conversationAddAssistant(content) {
  conversation.push({ role: 'assistant', content });
}

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

const isCmd = (cmd) => (input) => input == cmd;

async function askQuestion(options = {}) {
  const { prompt = null, askMore = false } = options;
  const { input: question, rl } = await readFromUserInput(
    // chalk.blue('•`_´• What do you want from me? '),
    chalk.blue(`${prompt || '•`_´• What do you want from me?'}\n> `),
  );

  if (shouldExit(question)) {
    process.exit(0);
  } else if (isCmd('debug')(question)) {
    rl.history.shift();
    echo(`\nPrompt: ${prompt}\n`);
    echo(`\n${JSON.stringify(getConversation(), null, 2)}\n`);
  } else if (isCmd('clear')(question)) {
    clearConversation();
    echo('\n::: Question history cleared :::\n');
  } else {
    try {
      conversationAddUser(question);
      const stream = await chatCompletionFactory({ stream: true })(
        getConversation(),
        prompt,
      );
      let response = '';
      for await (const chunk of stream) {
        const msg = chunk.choices[0]?.delta?.content || '';
        response += msg;
        echo(msg);
      }
      conversationAddAssistant(response);
    } catch (ex) {
      error('error: ', ex.toString());
    }
    newline();
  }
  if (askMore) {
    await askQuestion(options);
  }
}

module.exports = {
  clearConversation,
  conversationAddAssistant,
  conversationAddUser,
  echo,
  error,
  getConversation,
  newline,
  readFromPipe,
  readFromUserInput,
  askQuestion,
  shouldExit,
};
