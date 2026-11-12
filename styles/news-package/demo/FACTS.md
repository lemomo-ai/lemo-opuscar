# Facts and sources ·《本周 AI 四件事 The Week in AI》 (Lemo AI News, week 42)

Checked on 2026-10-21 (each source below was checked page by page; wherever a primary source could be found it was added; event details reported by a single source only are kept off screen and out of the voice-over).
Before the last render, the table below was compared item by item against `vo/lines.json` (Chinese voice-over) and the `STRAP` / `ROWS` / `CUES` and per-shot on-screen text in `main.js`. A line-by-line check of the voice-over is at the end.
Grades: **primary** = a page of the subject of the event itself, or exchange data; **reliable media** = a bylined news report; **snippet** = only a search snippet could be read (page 403 / timed out), used only as corroboration, never on its own to support a number on screen.

On-screen text and voice-over are Chinese; they are quoted as they appear, with an English gloss.

## ① Google opens Gemini 4 Argon to all developers

| # | Claim in the film (on screen / voice-over) | Source | Source wording | Grade |
|---|---|---|---|---|
| G1 | Generally available (GA) on 13 October, model ID `gemini-4-argon`; "谷歌向全部开发者开放 Gemini 4 Argon" (Google opens Gemini 4 Argon to all developers) | Gemini API changelog https://ai.google.dev/gemini-api/docs/changelog | "October 13, 2026 — Gemini 4 Argon (gemini-4-argon) generally available (GA): Released Gemini 4 Argon (gemini-4-argon), our most capable model built for complex coding, agentic, math, and science tasks." | Primary |
| G2 | Introductory price $2 input, $10 output per million tokens | blog.google, "Gemini 4 Argon" (2026-09-30, Koray Kavukcuoglu) https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/ | "Argon will launch at an introductory price of $2 per million input tokens and $10 per million output tokens, with cached input tokens priced at 95% off input token price." | Primary |
| G3 | Afterwards $4 / $20; "价格翻倍 ×2" (price doubles ×2) | Same, footnote 1 | "After the introductory period expires, the price of $4 per 1M input tokens and $20 per 1M output tokens will apply." | Primary; ×2 computed from 2→4 and 10→20 |
| G4 | Introductory price "至 30 NOV" (until 30 NOV), then "FROM 1 DEC" | Gemini API · latest model https://ai.google.dev/gemini-api/docs/latest-model | "Gemini 4 Argon is available at introductory pricing through November 30, 2026: Input tokens: $2.00 per 1M tokens ($4.00 starting December 1, 2026)" | Primary |
| — | Not reported | — | The 9-30 blog post was at the time a release only to cyber defenders in the Fairwind programme ("rolling out to a set of trusted cyber defenders through our Fairwind Program"), so the film does not say it "launched" on 9-30; the benchmark scores are self-reported by Google and not used | — |

## ② South Korea's Kospi falls into a bear market, chip stocks lead the drop

| # | Claim in the film | Source | Source wording | Grade |
|---|---|---|---|---|
| K1 | −7.57% in one day on 15 October, close 5,554.22 | Korea Herald (Im Eun-byel, 2026-10-15) https://www.koreaherald.com/article/10904070 | "The benchmark Kospi tumbled 7.57 percent to close at 5,554.22, extending losses throughout the session after opening 5.59 percent lower." | Reliable media; agrees with the K5 data (5,554.22 ÷ 6,008.81 − 1 = −7.565 %) |
| K2 | Seven straight losing sessions (chart days 1–7, the "连跌 7 日" (7 days down in a row) badge, the readout panel) | Korea Times (2026-10-16) https://www.koreatimes.co.kr/economy/20261016/samsung-sk-hynix-sell-off-excessive-as-memory-outlook-stays-strong-analysts | "as KOSPI rebounded 2.05 percent, snapping a seven-session losing streak"; "over seven consecutive trading sessions starting Oct. 6" | Reliable media; K5 data: seven down closes on 10-06, 07, 08, 12, 13, 14, 15 (market closed 10-09) |
| K3 | "进入熊市 BEAR MARKET" (into a bear market) | Bloomberg (2026-10-15) "Kospi Drops 8% as Samsung, SK Hynix Shares Plunge on AI and Rate Fears" https://www.bloomberg.com/news/articles/2026-10-15/chip-stocks-deepen-losses-as-concerns-mount-over-rates-ai-debt | Snippet: "dragged South Korea's equity benchmark down nearly 8% to push it into a bear market"; "fallen about 21% from its September high" | Snippet (article body 403); the measure is confirmed from the K5 data: down 21.56 % from the 23 September closing high of 7,080.92 |
| K4 | Bear-market line = −20 % from the September high; readout panel "较 9 月高点 −21.56%" (−21.56% from the September high); peak label "PEAK 7,080.92" | Computed from K5 | 5,554.22 ÷ 7,080.92 − 1 = −21.56 %; the −20 % line = 5,664.74 | Primary data + our arithmetic. **Caution on the measure**: in the same Naver Finance daily series (https://api.stock.naver.com/chart/domestic/index/KOSPI?periodType=dayCandle, read for 8 May – 20 Oct 2026; not used in the film) the highest close was 9,114.55 on 22 June; measured from that close it had already fallen more than 20 % by 8 July (7,246.79). "Into a bear market" is Bloomberg's statement measured from the September high, and the film's axis says so: "距 9 月高点 FROM SEPTEMBER HIGH" |
| K5 | Chart: the actual close of every trading day from 15 September to 15 October | Korea Exchange index data via the Naver Finance API https://api.stock.naver.com/chart/domestic/index/KOSPI?periodType=dayCandle (the 19 closes the film uses are written into `main.js`, `KDATA`) | The 19 closes used in the film: 6,627.26 (9-15) · 6,717.97 · 6,715.41 · 6,894.23 · 7,007.72 · 7,017.91 · **7,080.92 (9-23 high)** · 6,889.74 · 6,870.81 · 6,838.04 · 6,971.35 · 7,003.74 (10-02) · 6,941.39 · 6,803.90 · 6,625.93 · 6,384.24 · 6,035.35 · 6,008.81 · **5,554.22 (10-15)** | Primary data. The 10-13 close of 6,035.35 (−5.46 %) and the 10-16 close of 5,668.05 (+2.05 %) agree with the Korea Herald and the Korea Times |
| K6 | Samsung Electronics −9.48 %, SK hynix −11.06 %; "都超过 9%" (both more than 9%) | Korea Herald (as K1) | "SK hynix sank 11.06 percent to 1.26 million won, while Samsung Electronics plunged 9.48 percent to 210,000 won." | Reliable media. Naver's individual-stock data does not match these two figures (−10.56 % / −12.76 %), so for the individual stocks only the reported figures are used, not Naver |
| K7 | Strap "利率与 AI 担忧，芯片股重挫" (rate and AI fears, chip stocks plunge) | Bloomberg headline (as K3) | "… Shares Plunge on AI and Rate Fears" | Headline (checked) |
| — | Not reported | — | Neither "−14.46 % for the week" (computable from the data: 10-08 close 6,625.93 → 10-16 close 5,668.05) nor "worst week since 2008" is reported: the primary statement of "worst week since 2008" applies only to the two individual stocks Samsung and SK hynix (Korea Herald https://www.koreaherald.com/article/10906189 ); only Benzinga says it of the index (403, not read). The film uses "较 9 月高点 −21.56%" (−21.56% from the September high), which the data can confirm | — |

## ③ The EU AI Office sends requests for information to OpenAI and Anthropic

| # | Claim in the film | Source | Source wording | Grade |
|---|---|---|---|---|
| E1 | "欧盟 AI 办公室向 OpenAI、Anthropic 发出问询" (the EU AI Office sends requests for information to OpenAI and Anthropic); two "信息调取 REQUEST FOR INFORMATION" documents addressed to OpenAI and to Anthropic (the body is drawn only as grey text lines, no content) | Euronews (Luca Bertuzzi, 2026-10-14) https://www.euronews.com/2026/10/14/eus-ai-rules-face-first-enforcement-test-over-lab-incidents | "The AI Office sent its requests after judging the documents the two companies had voluntarily disclosed insufficient." | Reliable media, single source. The Commission's own speech does not name the two companies, so both the picture (source line, document sign-off) and the voice-over say "据 Euronews 报道 / Euronews reports"; only the one fact "requests were sent" is reported, and the report's details about what prompted the requests are kept off screen and out of the voice-over |
| E3 | Document sign-off 14 OCT 2026; rundown WED 14 OCT | Euronews publication date; date of the Commission speech (E4) | — | — |
| E4 | Quote card: "Our AI Office has started enforcing these rules …"; "欧盟 AI 办公室已经开始执行这些规则" (the EU AI Office has started enforcing these rules); stamp "已开始执法 ENFORCING" | European Commission Press Corner, "Speech by Executive Vice-President Virkkunen at the International AI Summit in Dublin" (2026-10-14) https://ec.europa.eu/commission/presscorner/detail/en/speech_26_2150 | "Our AI Office has started enforcing these rules, and sent Requests for Information addressing issues such as security, external evaluation and monitoring how models are used." | **Primary**. The quote card takes only the first half of the sentence and marks the rest with an ellipsis; "tech chief" refers to her post (see E5) |
| E5 | Name strap "Henna Virkkunen · 欧盟委员会执行副主席 / EXECUTIVE VICE-PRESIDENT, EUROPEAN COMMISSION · IN DUBLIN" | Same as E4 | The page calls her "Executive Vice-President for Tech Sovereignty, Security and Democracy" | Primary |
| E6 | On the map, "欧盟 AI 办公室 · 隶属欧盟委员会" (EU AI Office · part of the European Commission), city dot at Brussels | AI Office page https://digital-strategy.ec.europa.eu/en/policies/ai-office ; Commission contact page https://commission.europa.eu/about/contact_en | "The European AI Office was established within the European Commission"; Commission postal address "1049 Brussels" | Primary |
| E7 | The 27 EU member states and the borders between them; all other land is one shape with no borders | Natural Earth 1:50m (world-atlas 2.0.2) | — | Public-domain map data |
| — | **Claims not reported** | — | (1) "First use of the AI Act against frontier labs": primary sources show the first requests for information went to several frontier-model providers right after enforcement powers took effect in August (Commission speech of 10-09 https://ec.europa.eu/commission/presscorner/detail/en/speech_26_2148 : "We have sent our first Requests for Information to providers of the most advanced models around the world, on three critical topics: security, external evaluation and post-market monitoring."), so "first" does not hold; Euronews's "first test" means the first test of the Act's scope. (2) "没有罚款，也没有立案 / No fines. Yet." (no fines, no case opened): neither the primary speech nor Euronews mentions fines or a case; not reported. (3) Ticking off three items, "安全 / 外部评测 / 上线后监测" (security / external evaluation / post-market monitoring): these are the topics of the general requests sent in August and cannot be written on the documents addressed to OpenAI and Anthropic. (4) "The AI Office is in Dublin": Dublin is only where the speech was given. (5) Details of the incidents that prompted the requests: Euronews is the only source, and they are allegations about real companies, so they are kept off screen and out of the voice-over; the document body is drawn only as grey text lines with no content | — |

## ④ Meta releases the model weights of Muse Spark Open

| # | Claim in the film | Source | Source wording | Grade |
|---|---|---|---|---|
| M1 | On 15 October Meta releases the weights of Muse Spark Open; stamp "开放权重 OPEN WEIGHTS"; rundown THU 15 OCT | Meta AI research blog, "Muse Spark Open" (2026-10-15) https://research.meta.ai/blog/muse-spark-open | "Today, we're releasing the weights for Muse Spark Open, the most capable US open-weight model to date."; "We're releasing the weights under the Muse Model License with limited commercial terms" | Primary. "Most capable" is Meta's own claim and not reported in the film; the licence restricts commercial use, so the film says "开放权重" (open weights), not "开源" (open source) |
| M2 | 816B total parameters (8160 亿), 42B active per token (420 亿); 1M-token context | Same | "Muse Spark Open is a natively multimodal model with 816B total parameters (42B active) and a 1M-token context window." | Primary |
| M3 | "约 5% / ABOUT 1/20" | Computed from M2 | 42 ÷ 816 = 5.1 % | Our arithmetic |
| M4 | Runs on two Mac Studios (M5 Ultra); 512 GB each; "≈ 1 TB 统一内存" (≈ 1 TB unified memory) | Same | "Muse Spark Open is the first model in its class to run on your desktop using two Apple M5 Ultra Mac Studios…"; "Apple's unified memory architecture lets the M5 Ultra's integrated GPU use up to 512 GB per Mac Studio"; "The result is two Mac Studios behave like one supercomputer with a terabyte of unified memory." | Primary. Mac Studio is set in type only, no logo |
| — | Not reported | — | The revenue threshold in the licence, third-party benchmark scores and the claim that the Hugging Face repository appeared earlier are found only in secondary sources | — |

## Voice-over, line by line (Chinese, Doubao TTS; `vo/lines.json`)

The voice-over lines are quoted in the original Chinese, with an English translation.

| Line | Voice-over | Facts |
|---|---|---|
| v1 | 这里是 Lemo AI 新闻，本周 AI 四件事。 (This is Lemo AI News: four things in AI this week.) | — |
| v2 | 谷歌向全部开发者开放了 Gemini 4 Argon，入门价每百万输入 token 2 美元，12 月起翻倍。 (Google has opened Gemini 4 Argon to all developers; the introductory price is 2 dollars per million input tokens, doubling from December.) | G1, G2, G3, G4 ($2 → $4, from 1 December) |
| v3 | 在首尔，韩国综合股价指数单日跌超 7.5%，较 9 月高点跌去两成多，跌入熊市。 (In Seoul, the Kospi fell more than 7.5% in a day, more than a fifth below its September high, into a bear market.) | K1, K3, K4 |
| v4 | 三星和 SK 海力士单日都跌了 9% 以上。 (Samsung and SK hynix both fell more than 9% in a day.) | K6 |
| v5 | 欧盟 AI 办公室向 OpenAI 和 Anthropic 发出问询，据欧洲新闻台报道。 (The EU AI Office has sent requests for information to OpenAI and Anthropic, Euronews reports.) | E1 |
| v6 | 维尔库宁在都柏林说：AI 办公室已开始执行这些规则。 (Virkkunen said in Dublin: the AI Office has started enforcing these rules.) | E4, E5 (the quotation is the Chinese sense of the speech's wording) |
| v7 | Meta 开放了 Muse Spark Open 的权重。总参数 8160 亿，每个 token 只激活 420 亿，两台 Mac Studio 就能跑。 (Meta has released the weights of Muse Spark Open. 816 billion parameters in total, only 42 billion active per token, and it runs on two Mac Studios.) | M1, M2, M4 |
| v8 | 本周就到这里。这里是 Lemo AI 新闻。 (That's all for this week. This is Lemo AI News.) | — |

## Non-news elements in the picture

| Element | Note |
|---|---|
| Server-room and wafer backgrounds | Illustrative empty shots generated with Codex image_gen, used only as backgrounds; while on screen they carry "ILLUSTRATION / 示意 · AI 生成画面" (illustration · AI-generated image) in the top-left corner throughout; they do not represent any real place, company or event |
| LEMO logo, LEMO AI NEWS | LemoLab's own channel brand |
| Company and product names | Google, OpenAI, Anthropic, Samsung, SK hynix, Meta and Mac Studio are set in type only, no logos |
