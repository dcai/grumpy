#!/usr/bin/env node

const config = require('./config');
const packageJson = require('../package.json');
const R = require('ramda');
const { Command } = require('commander');
const { getAnswer, getOpenaiClient } = require('./openai');
const { echo, readFromPipe, askQuestion, error } = require('./helpers');
const Table = require('cli-table3');

const program = new Command();

program
  .name('ai')
  .description(packageJson.description)
  .version(packageJson.version);

program.command('models').action(async () => {
  const models = await getOpenaiClient().models.list();
  const data = models.data;
  const table = new Table({
    head: ['Model', 'Owned by'],
  });

  data.forEach(({ id, owned_by }) => {
    table.push([id, owned_by]);
  });
  echo(table.toString());
});

program.command('as').action(async (_, cmd) => {
  const { args } = cmd;
  const library = config.getPrompts();
  if (R.length(args) === 0) {
    const actors = Object.entries(library) || [];
    const table = new Table({
      head: ['As', 'Description'],
    });
    actors.forEach(([key, value]) => {
      table.push([key, value.description]);
    });
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
    prompt,
    askMore: true,
  });
});

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
