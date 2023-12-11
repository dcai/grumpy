#!/usr/bin/env node

const config = require('./config');
const packageJson = require('../package.json');
const R = require('ramda');
const { Command } = require('commander');
const { getAnswer, getOpenaiClient } = require('./openai');
const {
  makeTable,
  echo,
  readFromPipe,
  askQuestion,
  error,
} = require('./helpers');

const program = new Command();

program
  .name('ai')
  .description(packageJson.description)
  .version(packageJson.version);

program.command('models').action(async () => {
  const models = await getOpenaiClient().models.list();
  const data = R.sortBy(R.prop('id'))(models.data);

  const table = makeTable({
    head: ['Model', 'Owned by'],
  });

  data.forEach(({ id, owned_by }) => {
    table.push([id, owned_by]);
  });

  echo(table.toString());
});

program
  .command('as')
  .option('-m --model <string>', 'gpt model to use')
  .action(async (options, cmd) => {
    const { args } = cmd;
    const library = config.getPrompts();
    if (R.length(args) === 0) {
      const actors = Object.entries(library) || [];
      const table = makeTable({
        head: ['As', 'Description'],
      });
      actors.forEach(([key, value]) => table.push([key, value.description]));
      echo(table.toString());
      return;
    }
    const prompt = library?.[args[0]]?.prompt || '';
    if (!prompt) {
      error(`Prompt not found\n`);
      process.exit(1);
      return;
    }
    await askQuestion({
      model: options.model,
      prompt,
      askMore: true,
    });
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
