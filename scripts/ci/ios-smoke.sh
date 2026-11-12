#!/usr/bin/env bash
set -euo pipefail

APP=build/ios/Build/Products/Release-iphonesimulator/MiniTienda.app
test -d "$APP"
SIMULATOR_ID="$(xcrun simctl list devices available --json | node -e '
  let input = "";
  process.stdin.on("data", chunk => { input += chunk; });
  process.stdin.on("end", () => {
    const devices = Object.entries(JSON.parse(input).devices)
      .filter(([runtime]) => runtime.includes("iOS"))
      .flatMap(([, items]) => items)
      .filter(device => device.isAvailable && device.name.startsWith("iPhone"));
    const device = devices.find(item => item.state === "Booted") ?? devices[0];
    if (!device) { console.error("No available iPhone simulator"); process.exit(1); }
    process.stdout.write(device.udid);
  });
')"

STATE="$(xcrun simctl list devices booted --json)"
if ! node -e 'process.exit(process.argv[1].includes(process.argv[2]) ? 0 : 1)' "$STATE" "$SIMULATOR_ID"; then
  xcrun simctl boot "$SIMULATOR_ID"
fi
xcrun simctl bootstatus "$SIMULATOR_ID" -b
xcrun simctl install "$SIMULATOR_ID" "$APP"
BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP/Info.plist")"
xcrun simctl launch --terminate-running-process "$SIMULATOR_ID" "$BUNDLE_ID" | tee build/ios-launch.log
APP_PID="$(awk -F ': ' 'NF > 1 {print $NF}' build/ios-launch.log | tail -n 1)"
[[ "$APP_PID" =~ ^[0-9]+$ ]]

# A successful launch alone does not prove the process survives initialization.
for DELAY in 5 15; do
  sleep "$DELAY"
  xcrun simctl spawn "$SIMULATOR_ID" launchctl list > build/ios-processes.log
  awk -v pid="$APP_PID" '$1 == pid {found=1} END {exit !found}' build/ios-processes.log
done
xcrun simctl io "$SIMULATOR_ID" screenshot build/ios-home.png
echo "Simulator smoke passed: process $APP_PID alive after 20 seconds."
