#!/usr/bin/env bash
set -euo pipefail

mkdir -p build
export NODE_BINARY
NODE_BINARY="$(command -v node)"
xcodebuild build \
  -workspace "${XCODE_WORKSPACE:-ios/MiniTienda.xcworkspace}" \
  -scheme "${XCODE_SCHEME:-MiniTienda}" \
  -configuration Release \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/ios \
  CODE_SIGN_IDENTITY='' CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
  2>&1 | tee build/ios-build.log

APP=build/ios/Build/Products/Release-iphonesimulator/MiniTienda.app
# Release must run on the simulator without a Metro server.
test -s "$APP/main.jsbundle"
ditto -c -k --sequesterRsrc --keepParent "$APP" build/ios-simulator.zip
