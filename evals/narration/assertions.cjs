const forbidden = ['造假', '难题没解决', '证明被推翻'];
exports.redLines = output => {
  const hits = forbidden.filter(word => output.includes(word));
  return { pass: !hits.length, score: hits.length ? 0 : 1, reason: hits.length ? `禁词：${hits.join('、')}` : '口播未出现事实包禁词' };
};
// Conservative lexical gate, not a semantic claim. 3 seconds × 5 spoken characters.
exports.opening = output => {
  const opening = Array.from(output.replace(/[^\p{L}\p{N}]/gu, '')).slice(0, 15).join('');
  const pass = /不是|却|但是|竟|对不上|不一致|不同|可问题|但/.test(opening);
  return { pass, score: pass ? 1 : 0, reason: `前15字=${opening}；明确矛盾标记${pass ? '命中' : '未命中（需人工或LLM复核）'}` };
};

async function chat(messages) {
  const endpoint = process.env.NARRATION_LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const key = process.env.NARRATION_LLM_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.NARRATION_LLM_MODEL;
  if (!key || !model) throw new Error('Missing configured NARRATION_LLM_API_KEY/OPENAI_API_KEY and NARRATION_LLM_MODEL');
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST', headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model, messages, temperature: 0}), signal: AbortSignal.timeout(90000)
  });
  if (!response.ok) throw new Error(`LLM HTTP ${response.status}`);
  return (await response.json()).choices[0].message.content;
}
exports.retell = async (output, context) => {
  if (!context.vars.retell_target) throw new Error('SKIP prerequisite: 缺外行复述句');
  // The simulated audience never sees the target or fact pack.
  const retelling = await chat([{role:'system', content:'你是零背景观众。只根据听到的口播，用一句话复述中心意思，不查资料。'}, {role:'user', content:output}]);
  const judged = await chat([{role:'system', content:'比较复述与目标的中心矛盾是否相同，有无新增事实。仅输出JSON：{"score":0到1,"reason":"理由"}。相同核心且无新增事实才可>=0.8。'}, {role:'user', content:JSON.stringify({retelling, target:context.vars.retell_target})}]);
  const result = JSON.parse(judged.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  if (typeof result.score !== 'number' || result.score < 0 || result.score > 1) throw new Error('Invalid grader score');
  return {pass:result.score >= 0.8, score:result.score, reason:`复述=${retelling}；${result.reason}`};
};
exports.blind = async (output, context) => {
  if (!context.vars.human_reference) throw new Error('SKIP prerequisite: 缺人写参照');
  // Deterministic seed is recorded and alternates the hidden candidate position.
  const seed = context.vars.blind_seed || 42;
  const candidate = seed % 2 ? 'A' : 'B';
  const pair = candidate === 'A' ? {A:output,B:context.vars.human_reference} : {A:context.vars.human_reference,B:output};
  const judged = await chat([{role:'system',content:'盲测两条口播，判断哪条更像AI写作。只输出JSON：{"choice":"A或B","reason":"具体证据"}。不知道作者身份。'}, {role:'user',content:JSON.stringify(pair)}]);
  const result = JSON.parse(judged.replace(/^```(?:json)?\s*|\s*```$/g,''));
  if (!['A','B'].includes(result.choice)) throw new Error('Invalid blind choice');
  const pass = result.choice !== candidate;
  return {pass, score:pass ? 1 : 0, reason:`seed=${seed}；选择=${result.choice}；${result.reason}`};
};

// Evidence is loaded and checked against stripped narration by run.py.
exports.recordedRetell = (output, context) => {
  const state = context.vars.recorded_retell;
  if (state.status === 'STALE') return {pass:false, score:0, reason:`STALE: ${state.reason}`};
  const score = state.record.score;
  if (score === null) throw new Error('SKIP records must not become scored assertions');
  return {pass:score >= 7, score:score / 10, reason:`存档裁判 ${score}/10: ${state.reason}`};
};
