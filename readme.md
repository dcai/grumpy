### grumpy

Openai client I use on cli.

#### Install

```
npm install grumpy-ai
```

This installs a executable called `ai`, and requires `OPENAI_API_KEY` in your shell environment, then you can do things like this:

- `ai ask`: ask openai in an interactive way.
- `cat question.md | ai frompipe | bat -l markdown`: read question from a markdown file and render answer with [bat](https://github.com/sharkdp/bat)
