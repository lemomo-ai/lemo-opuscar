# 口播评测

先安装 promptfoo（本目录不保存影片原稿）：

```sh
npm install --prefix /tmp/narration-promptfoo promptfoo@0.125.1
python3 evals/narration/run.py --promptfoo /tmp/narration-promptfoo/node_modules/.bin/promptfoo --report /tmp/narration-eval.md
```

默认读主检出 `~/lemo-opuscar/films/openai-navier-stokes-lean-gap/SCRIPT_v{1,2}.md`。
可用 `--project` 指定其他目录。输入仅取 `## 口播` 至下一个二级标题，不扫描来源注。
v1、v2 均固定标 `baidi_judged_bad`，局部通过不意味着稿件合格。

四个验收断言：

1. 零背景复述：缺少稿内「外行复述句」或 LLM provider 时必须 SKIP。补齐后使用已配置 provider 先只看口播生成一句复述，再用独立 LLM 评分调用比较目标，要求相同中心矛盾、无事实增补，阈值 0.8。不得让复述模型看到目标。当前没有语义分数。
2. 前3秒矛盾：按5字/秒，去标点后前15字命中明确矛盾词才通过。保守词法关口，不冒充语义判分。
3. 事实红线：口播出现「造假」「难题没解决」「证明被推翻」任一词即失败，包括引述和否定句；分数0/1。
4. 人写盲测：见 `human-reference.md`，当前 SKIP：缺人写参照。补齐后随机A/B比较，选择待测稿更像AI即 FAIL；不编造人写稿。

`run.py` 真正调用 promptfoo，使用本地 echo provider 与文件 JS assertions，断言全过才退出0；有失败退出1，工具失败退出2。私有临时配置、完整稿件与原始结果放在系统临时目录并在结束时清理，仅指定报告保留。报告中的0/1及均分仅属确定性检查，不是复述或盲测评分。

可执行语义断言已定义在 `assertions.cjs` 的 `retell` 和 `blind` 中。配置 `NARRATION_LLM_MODEL` 及 `NARRATION_LLM_API_KEY`（或 `OPENAI_API_KEY`），可选 `NARRATION_LLM_BASE_URL`（或 `OPENAI_BASE_URL`）。稿内新增独立一行 `外行复述句：…` 才启用复述断言；`--human-reference /absolute/verified-human.md` 才启用盲测。未满足前提时不将 SKIP 计为通过或给分。
