const OpenAI = require('openai');
const R = require('ramda');
const debug = require('debug')('openai.js');
const config = require('./config');

let openaiSingleton = null;

function getOpenaiClient() {
  if (openaiSingleton === null) {
    openaiSingleton = new OpenAI({
      apiKey: config.getOpenaiApiKey(),
    });
  }
  return openaiSingleton;
}

function generateMessages(conversation, prompt) {
  const messages = [
    {
      role: 'system',
      content: prompt || config.getDefaultPrompt(),
    },
  ];
  if (Array.isArray(conversation)) {
    messages.push(...conversation);
  } else {
    messages.push({ role: 'user', content: conversation });
  }
  return messages;
}

const chatCompletionFactory =
  (options = { stream: false, model: null }) =>
  async (conversation, prompt) => {
    const messages = generateMessages(conversation, prompt);
    const request = {
      stream: options.stream || false,
      messages,
      model: config.getModel(options.model),
    };
    debug(request);
    return await getOpenaiClient().chat.completions.create(request);
  };

async function getAnswer(q) {
  const result = await chatCompletionFactory({ stream: false })(q);

  const answer = R.reduce(
    (acc, choice) => {
      return acc + choice.message.content;
    },
    '',
    result.choices,
  );
  return answer;
}

module.exports = { getOpenaiClient, chatCompletionFactory, getAnswer };
