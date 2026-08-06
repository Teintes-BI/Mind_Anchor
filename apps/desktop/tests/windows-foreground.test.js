import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPowerShellScript,
  createWindowsForegroundReader,
  encodePowerShellScript,
  POWERSHELL_SCRIPT,
} from "../windows-foreground.cjs";

function createExecFileStub({ error = null, stdout = "", stderr = "" } = {}) {
  const calls = [];
  const execFileImpl = (file, args, options, callback) => {
    calls.push({ file, args, options });
    callback(error, stdout, stderr);
  };
  return { calls, execFileImpl };
}

test("reads only the foreground process name from PowerShell output", async () => {
  const stub = createExecFileStub({ stdout: "notepad\r\n" });
  const reader = createWindowsForegroundReader({ execFileImpl: stub.execFileImpl });

  assert.deepEqual(await reader.read(), { appName: "notepad", windowTitle: "", error: null });
  assert.equal(stub.calls.length, 1);
  assert.equal(stub.calls[0].file, "powershell.exe");
  assert.ok(stub.calls[0].args.includes("-EncodedCommand"));
  assert.equal(stub.calls[0].options.windowsHide, true);
  assert.equal(POWERSHELL_SCRIPT.includes("GetWindowText"), false);
});

test("reads a window title only when title capture is explicitly enabled", async () => {
  const stub = createExecFileStub({ stdout: '{"appName":"notepad","windowTitle":"Budget.xlsx - Notepad"}' });
  const reader = createWindowsForegroundReader({ execFileImpl: stub.execFileImpl });

  assert.deepEqual(await reader.read({ includeWindowTitle: true }), {
    appName: "notepad",
    windowTitle: "Budget.xlsx - Notepad",
    error: null,
  });

  const encodedCommand = stub.calls[0].args.at(-1);
  const script = Buffer.from(encodedCommand, "base64").toString("utf16le");
  assert.match(script, /GetWindowText/);
  assert.match(buildPowerShellScript({ includeWindowTitle: true }), /windowTitle/);
  assert.equal(encodePowerShellScript(script), encodedCommand);
});

test("reports an unavailable foreground app when PowerShell returns no process", async () => {
  const stub = createExecFileStub({ stdout: "\r\n", stderr: "no foreground window" });
  const reader = createWindowsForegroundReader({ execFileImpl: stub.execFileImpl });

  assert.deepEqual(await reader.read(), {
    appName: "",
    windowTitle: "",
    error: "Windows foreground app is unavailable.",
  });
});

test("surfaces PowerShell failures without throwing from the collector", async () => {
  const stub = createExecFileStub({ error: new Error("powershell failed") });
  const reader = createWindowsForegroundReader({ execFileImpl: stub.execFileImpl });

  assert.deepEqual(await reader.read(), { appName: "", windowTitle: "", error: "powershell failed" });
});
