#!/usr/bin/env node

const packageJson = require('../package.json');
const chalk = require('chalk');
const R = require('ramda');
const { Command } = require('commander');
const { getAnswer, getChatCompletionStream } = require('./openai');
const {
  newline,
  shouldExit,
  readFromUserInput,
  echo,
  error,
  readFromPipe,
} = require('./helpers');

const program = new Command();

program.name('ai').description('OpenAI Client').version(packageJson.version);

program.command('frompipe').action(async () => {
  const text = await readFromPipe();
  if (text) {
    const answer = await getAnswer(text);
    echo(answer);
  } else {
    process.exit(1);
  }
});

async function askQuestion(askMore) {
  const {
    input: question,
    history,
    rl,
  } = await readFromUserInput(chalk.blue('•`_´• What do you want from me? '));
  if (shouldExit(question)) {
    process.exit(0);
  } else if (question === 'clear') {
    rl.history = [];
    echo('\n::: Question history cleared\n');
  } else {
    try {
      const stream = await getChatCompletionStream(R.reverse(history));
      for await (const chunk of stream) {
        echo(chunk.choices[0]?.delta?.content || '');
      }
    } catch (ex) {
      error('error: ', ex.toString());
    }
    newline();
  }
  if (askMore) {
    askQuestion(true);
  }
}

program.command('ask').action(async () => {
  await askQuestion(true);
});

program.parse();
