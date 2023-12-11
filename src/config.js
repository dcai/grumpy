const { error } = require('console');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_MODEL = 'gpt-3.5-turbo';
const DEFAULT_PROMPT = `You are ChatGPT, a large language model trained by OpenAI. Follow the user instructions carefully, your response is in markdown format.`;

const defaultConfig = {
  conversationContext: 6,
  apiKey: '',
  model: DEFAULT_MODEL,
  library: {
    translator: {
      prompt:
        'you are a translator, assume the input is australian english, response with mandarin chinese.',
    },
  },
};
class Config {
  constructor(file, options = {}) {
    this.file = file;
    this.options = options;
    if (fs.existsSync(this.file)) {
      this.config = JSON.parse(fs.readFileSync(this.file));
    } else {
      this.init();
    }
  }

  init() {
    const dir = path.dirname(this.file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.save(defaultConfig);
  }

  getConversationContext() {
    return this.get().conversationContext || 6;
  }

  getDefaultPrompt() {
    return this.get().defaultPrompt || DEFAULT_PROMPT;
  }

  getPrompts() {
    return this.get().library || {};
  }

  get() {
    try {
      return JSON.parse(fs.readFileSync(this.file)) || {};
    } catch (ex) {
      error(`config.get(): ${ex.toString()}`);
      return {};
    }
  }

  getModel() {
    return this.get().model || process.env.OPEN_API_MODEL || DEFAULT_MODEL;
  }

  getOpenaiApiKey() {
    return this.get().apiKey || process.env['OPENAI_API_KEY'];
  }

  save(json) {
    fs.writeFileSync(this.file, JSON.stringify(json, null, 2), {
      flag: 'w+',
    });
  }
}

module.exports = new Config(
  process.env.GRUMPY_AI_CONFIG_PATH || path.join(os.homedir(), 'ai.json'),
);
