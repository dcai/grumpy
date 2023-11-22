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

async function askQuestion(options = {}) {
  const {
    input: question,
    history,
    rl,
  } = await readFromUserInput(chalk.blue('•`_´• What do you want from me? '));
  const { prompt = null, askMore = false } = options;

  if (shouldExit(question)) {
    process.exit(0);
  } else if (question === 'debug') {
    rl.history.shift();
    echo(`\nPrompt: ${prompt}\n`);
    echo(`\n${JSON.stringify(rl.history, null, 2)}\n`);
  } else if (question === 'clear') {
    rl.history = [];
    echo('\n::: Question history cleared :::\n');
  } else {
    try {
      const numberOfContextMessages = 5;
      const input = R.pipe(
        R.slice(0, numberOfContextMessages - 1),
        R.reverse,
      )(history);
      const stream = await chatCompletionFactory({ stream: true })(
        input,
        prompt,
      );
      for await (const chunk of stream) {
        echo(chunk.choices[0]?.delta?.content || '');
      }
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
