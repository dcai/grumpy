const OpenAI = require('openai');
const R = require('ramda');

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

async function getChatCompletion(question) {
  return await getOpenaiClient().chat.completions.create({
    messages: [{ role: 'user', content: question }],
    model: 'gpt-3.5-turbo',
  });
}

async function getChatCompletionStream(question) {
  const messages = [];
  if (Array.isArray(question)) {
    question.forEach((q) => {
      messages.push({
        role: 'user',
        content: q,
      });
    });
  } else {
    messages.push({ role: 'user', content: question });
  }
  return await getOpenaiClient().chat.completions.create({
    stream: true,
    messages,
    model: 'gpt-3.5-turbo',
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
