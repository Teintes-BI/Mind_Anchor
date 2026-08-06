const { execFile } = require("node:child_process");

function buildPowerShellScript({ includeWindowTitle = false } = {}) {
  const titleMethods = includeWindowTitle
    ? `
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int maxCount);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowTextLength(IntPtr hWnd);
`
    : "";
  const titleCapture = includeWindowTitle
    ? `
$windowTitle = ""
$windowTitleLength = [MindAnchorForegroundWindow]::GetWindowTextLength($windowHandle)
if ($windowTitleLength -gt 0) {
    $windowBuilder = New-Object System.Text.StringBuilder ($windowTitleLength + 1)
    [void][MindAnchorForegroundWindow]::GetWindowText($windowHandle, $windowBuilder, $windowTitleLength + 1)
    $windowTitle = $windowBuilder.ToString()
}
`
    : "";
  const output = includeWindowTitle
    ? '[pscustomobject]@{ appName = $process.ProcessName; windowTitle = $windowTitle } | ConvertTo-Json -Compress'
    : "$process.ProcessName";

  return String.raw`
$ErrorActionPreference = "Stop"
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class MindAnchorForegroundWindow {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
${titleMethods}
}
"@ | Out-Null

$windowHandle = [MindAnchorForegroundWindow]::GetForegroundWindow()
if ($windowHandle -eq [IntPtr]::Zero) {
    exit 0
}

[uint32]$processId = 0
[void][MindAnchorForegroundWindow]::GetWindowThreadProcessId($windowHandle, [ref]$processId)
if ($processId -eq 0) {
    exit 0
}

try {
    $process = Get-Process -Id $processId -ErrorAction Stop
} catch {
    exit 0
}
${titleCapture}
${output}
`.trim();
}

const POWERSHELL_SCRIPT = buildPowerShellScript();

function encodePowerShellScript(script) {
  return Buffer.from(script, "utf16le").toString("base64");
}

function parseProcessName(stdout) {
  return String(stdout ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? "";
}

function parseForegroundOutput(stdout, { includeWindowTitle = false } = {}) {
  const rawOutput = String(stdout ?? "").trim();
  if (!rawOutput) {
    return { appName: "", windowTitle: "" };
  }

  if (includeWindowTitle) {
    try {
      const parsed = JSON.parse(rawOutput);
      if (parsed && typeof parsed === "object") {
        return {
          appName: String(parsed.appName ?? "").trim(),
          windowTitle: typeof parsed.windowTitle === "string" ? parsed.windowTitle : "",
        };
      }
    } catch {}
  }

  return { appName: parseProcessName(rawOutput), windowTitle: "" };
}

function createWindowsForegroundReader({ execFileImpl = execFile } = {}) {
  if (typeof execFileImpl !== "function") {
    throw new TypeError("Windows foreground reader requires execFile.");
  }

  const read = ({ includeWindowTitle = false } = {}) =>
    new Promise((resolve) => {
      const script = buildPowerShellScript({ includeWindowTitle });
      execFileImpl(
        "powershell.exe",
        [
          "-NoLogo",
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-EncodedCommand",
          encodePowerShellScript(script),
        ],
        {
          windowsHide: true,
          maxBuffer: 32 * 1024,
          timeout: 5_000,
        },
        (error, stdout) => {
          if (error) {
            resolve({ appName: "", windowTitle: "", error: error.message });
            return;
          }

          const { appName, windowTitle } = parseForegroundOutput(stdout, { includeWindowTitle });
          resolve({
            appName,
            windowTitle,
            error: appName ? null : "Windows foreground app is unavailable.",
          });
        },
      );
    });

  return { read };
}

module.exports = {
  POWERSHELL_SCRIPT,
  buildPowerShellScript,
  createWindowsForegroundReader,
  encodePowerShellScript,
  parseForegroundOutput,
  parseProcessName,
};
