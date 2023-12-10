#!/usr/bin/env node

const packageJson = require('../package.json');
const chalk = require('chalk');
const R = require('ramda');
const { Command } = require('commander');
const {
  getAnswer,
  chatCompletionFactory,
  getOpenaiClient,
} = require('./openai');
const {
  newline,
  shouldExit,
  readFromUserInput,
  echo,
  error,
  readFromPipe,
  clearConversation,
  conversationAddUser,
  conversationAddAssistant,
  getConversation,
} = require('./helpers');

const program = new Command();

program
  .name('ai')
  .description(packageJson.description)
  .version(packageJson.version);

program.command('models').action(async () => {
  const models = await getOpenaiClient().models.list();
  const data = models.data;

  const list = R.reduce(
    (acc, item) => {
      return [...acc, `${item.id} by ${item.owned_by}`];
    },
    [],
    data,
  );
  process.stdout.write(JSON.stringify(list, null, 2));
});

program.command('frompipe').action(async () => {
  const text = await readFromPipe();
  if (text) {
    const answer = await getAnswer(text);
    echo(answer);
  } else {
    process.exit(1);
  }
});

function isCmd(cmd) {
  return function (input) {
    return input == cmd;
  };
}

async function askQuestion(options = {}) {
  const { input: question, rl } = await readFromUserInput(
    chalk.blue('•`_´• What do you want from me? '),
  );
  const { prompt = null, askMore = false } = options;

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
    askQuestion(options);
  }
}

program
  .command('ask')
  .option('-p --prompt <string>', 'prompt for openai')
  .action((options) =>
    askQuestion({
      ...options,
      askMore: true,
    }),
  );

program.parse();
