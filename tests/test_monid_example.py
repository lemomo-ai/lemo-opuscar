"""Run the documented JavaScript with mocked fetch; no network calls."""
import json
import os
from pathlib import Path
import subprocess

import pytest


DOC = Path(__file__).resolve().parents[1] / "docs" / "monid-video.md"
BODY = {"prompt": "Image 1 smiles.", "media": [
    {"type": "reference_image", "url": "https://example.test/character.jpg"}
]}


def run_example(tmp_path, replies, key="test-key"):
    source = DOC.read_text().split("```js\n", 1)[1].split("```", 1)[0]
    mock = """
import assert from 'node:assert/strict';
const replies = REPLIES;
let calls = 0;
globalThis.setTimeout = callback => { callback(); };
globalThis.fetch = async (url, options) => {
  assert.equal(options.headers.Authorization, 'Bearer test-key');
  if (calls === 0) {
    assert.equal(url, 'https://api.monid.ai/v1/run');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), {
      provider: 'alibaba', endpoint: '/v1/video/wan2.7-r2v',
      input: { body: BODY, queryParams: {}, pathParams: {} },
    });
  } else {
    assert.equal(url, 'https://api.monid.ai/v1/runs/run-1');
  }
  const reply = replies[calls++];
  assert.ok(reply, 'unexpected request');
  return {
    ok: reply.status < 400, status: reply.status,
    json: async () => reply.data, text: async () => JSON.stringify(reply.data),
  };
};
process.on('exit', () => assert.equal(calls, replies.length));
""".replace("REPLIES", json.dumps(replies)).replace("BODY", json.dumps(BODY))
    script = tmp_path / "example.mjs"
    script.write_text(mock + source)
    scene = tmp_path / "scene.json"
    scene.write_text(json.dumps(BODY))
    env = dict(os.environ)
    env.pop("MONID_API_KEY", None)
    if key:
        env["MONID_API_KEY"] = key
    return subprocess.run(
        ["node", str(script), str(scene)], env=env,
        capture_output=True, text=True, timeout=10,
    )


def test_no_key(tmp_path):
    result = run_example(tmp_path, [], key=None)
    assert result.returncode == 1
    assert "Set MONID_API_KEY" in result.stderr


@pytest.mark.parametrize("asynchronous", [False, True])
def test_output_and_request(tmp_path, asynchronous):
    output = {"video_url": "https://example.test/clip.mp4"}
    replies = [{"status": 200, "data": {"status": "COMPLETED", "output": output}}]
    if asynchronous:
        replies = [
            {"status": 202, "data": {"runId": "run-1"}},
            {"status": 200, "data": {"status": "RUNNING"}},
        ] + replies
    result = run_example(tmp_path, replies)
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == output


@pytest.mark.parametrize("status,data,message", [
    (401, {"message": "bad key"}, "Monid 401"),
    (200, {"providerResponse": {"httpStatus": 404, "error": "no match"}},
     'Alibaba Cloud 404: "no match"'),
    (200, {}, "Monid returned no output"),
])
def test_errors(tmp_path, status, data, message):
    result = run_example(tmp_path, [{"status": status, "data": data}])
    assert result.returncode == 1
    assert message in result.stderr


@pytest.mark.parametrize("status", ["FAILED", "TIMED_OUT", "STOPPED", "BLOCKED"])
def test_terminal_failure(tmp_path, status):
    result = run_example(tmp_path, [
        {"status": 202, "data": {"runId": "run-1"}},
        {"status": 200, "data": {"status": status}},
    ])
    assert result.returncode == 1
    assert f"Monid run {status}" in result.stderr


def test_poll_http_error(tmp_path):
    result = run_example(tmp_path, [
        {"status": 202, "data": {"runId": "run-1"}},
        {"status": 503, "data": {"message": "unavailable"}},
    ])
    assert result.returncode == 1
    assert "Monid 503" in result.stderr
