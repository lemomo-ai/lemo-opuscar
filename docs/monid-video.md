# Optional reference video through Monid

Monid lets you call Alibaba Cloud's Wan reference-to-video endpoint with one API key, pay per call.
This standalone example generates a clip from your reference media; the library's code-rendered films keep their existing workflow.

Save the JavaScript below as `monid-video.mjs` in your film's project folder.
It uses Node 20+'s built-in `fetch`, with no extra packages.
Set `MONID_API_KEY` in your shell, then create `scene.json`:

```json
{
  "prompt": "Image 1 turns toward the camera and smiles.",
  "media": [{"type": "reference_image", "url": "https://your-host.example/character.jpg"}],
  "duration": 2
}
```

Replace the URL with your own publicly accessible HTTPS image or reference video.
For video, use `reference_video`; each character reference can also have a `reference_voice` URL.
Run `node monid-video.mjs scene.json`. It prints the output, including the downloadable `video_url`.
Download the MP4 promptly: the URL expires in about 24 hours.

```js
import { readFile } from 'node:fs/promises';

const key = process.env.MONID_API_KEY;
if (!key) {
  console.error('Set MONID_API_KEY to run this optional example.');
  process.exit(1);
}
const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const terminal = new Set(['COMPLETED', 'FAILED', 'TIMED_OUT', 'STOPPED', 'BLOCKED']);

async function request(path, options = {}) {
  const response = await fetch(`https://api.monid.ai${path}`, {
    ...options, headers, signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Monid ${response.status}: ${await response.text()}`);
  return { status: response.status, run: await response.json() };
}

try {
  const body = JSON.parse(await readFile(process.argv[2], 'utf8'));
  let { status, run } = await request('/v1/run', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'alibaba', endpoint: '/v1/video/wan2.7-r2v',
      input: { body, queryParams: {}, pathParams: {} },
    }),
  });
  if (status === 202) {
    const runId = run.runId;
    if (!runId) throw new Error('Monid returned no runId');
    for (let i = 0; i < 240 && !terminal.has(run.status); i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      ({ run } = await request(`/v1/runs/${encodeURIComponent(runId)}`));
    }
    if (!terminal.has(run.status)) throw new Error(`Monid polling timed out: ${runId}`);
  }
  if (run.status && run.status !== 'COMPLETED') throw new Error(`Monid run ${run.status}`);
  const provider = run.providerResponse;
  if (provider?.httpStatus >= 400) {
    throw new Error(`Alibaba Cloud ${provider.httpStatus}: ${JSON.stringify(provider.error)}`);
  }
  if (run.output === undefined) throw new Error('Monid returned no output');
  console.log(JSON.stringify(run.output, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
```

Polling stops after 20 minutes; HTTP errors, failed runs and Alibaba Cloud errors exit with a message.
No request is made without `MONID_API_KEY`. This example is never called by the film tools.

[Monid docs](https://docs.monid.ai?utm_source=github&utm_campaign=oss-pr&utm_content=lemomo-ai-lemo-opuscar&aid=OSS-LEMOMO-AI-LEMO-OPUSCAR) · [Get a key](https://monid.ai?utm_source=github&utm_campaign=oss-pr&utm_content=lemomo-ai-lemo-opuscar&aid=OSS-LEMOMO-AI-LEMO-OPUSCAR)
