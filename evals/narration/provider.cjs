// Echo the selected narration. This provider never generates or rewrites a script.
module.exports = class NarrationFixture {
  id() { return 'narration-fixture'; }
  async callApi(prompt, context) { return { output: context.vars.narration }; }
};
