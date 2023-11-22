const OpenAI = require('openai');
const R = require('ramda');
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

function useModel() {
  return process.env.OPEN_API_MODEL || DEFAULT_MODEL;
}

async function getChatCompletion(question) {
  return await getOpenaiClient().chat.completions.create({
    messages: [{ role: 'user', content: question }],
    model: useModel(),
  });
}

async function getChatCompletionStream(conversation, prompt) {
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
  return await getOpenaiClient().chat.completions.create({
    stream: true,
    messages,
    model: useModel(),
  });
}

async function getAnswer(q) {
  const result = await getChatCompletion(q);

  const answer = R.reduce(
    (acc, choice) => {
      return acc + choice.message.content;
    },
    '',
    result.choices,
  );
  return answer;
}

module.exports = { getChatCompletion, getChatCompletionStream, getAnswer };
