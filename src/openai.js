const OpenAI = require('openai');
const R = require('ramda');
const debug = require('debug')('openai.js');

const DEFAULT_MODEL = 'gpt-3.5-turbo';

let openaiSingleton = null;

function getOpenaiClient() {
  if (openaiSingleton === null) {
    const apiKey = '';
    openaiSingleton = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'] || apiKey,
    });
  }
  return openaiSingleton;
}

function useModel(model = null) {
  return model || process.env.OPEN_API_MODEL || DEFAULT_MODEL;
}

function generateMessages(conversation, prompt) {
  const messages = [
    {
      role: 'system',
      content: prompt || 'You are an assistant, you do what I ask but grumpy',
    },
  ];
  if (Array.isArray(conversation)) {
    conversation.forEach((q) => {
      messages.push({
        role: 'user',
        content: q,
      });
    });
  } else {
    messages.push({ role: 'user', content: conversation });
  }
  return messages;
}

const chatCompletionFactory =
  (options = { stream: false }) =>
  async (conversation, prompt) => {
    const messages = generateMessages(conversation, prompt);
    debug(messages);
    return await getOpenaiClient().chat.completions.create({
      stream: options.stream || false,
      messages,
      model: useModel(),
    });
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
