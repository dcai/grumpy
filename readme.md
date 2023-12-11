### grumpy

Openai client I use on cli.

#### Install

```
npm install grumpy-ai
```

This installs a executable called `ai`, and requires `OPENAI_API_KEY` in your shell environment, then you can do things like this:

- `ai as`: list predefined prompts, to edit the library, edit `$HOME/ai.json`.
- `ai as dict`: Assume you have `dict` prompt in ai.json, this will use `dict` prompt to answer your questions.
- `ai ask`: ask openai in an interactive way.
- `cat question.md | ai frompipe | bat -l markdown`: read question from a markdown file and render answer with [bat](https://github.com/sharkdp/bat)
- `cat question.md | ai frompipe | pbcopy`: read question from markdown and copy the answer to clipboard, I find difficult to copy long answer in chatgpt web or other GUI, this makes it easier.
