// Config plugin: adds <queries> entries to AndroidManifest so the app can both
// detect Gadgetbridge being installed (PackageManager) and resolve its broadcast
// intents on Android 11+ which enforces package visibility.
//
// Usage in app.json: "./plugins/withGadgetbridgeQueries"

const { withAndroidManifest } = require("@expo/config-plugins");

const GB_PACKAGE = "nodomain.freeyourgadget.gadgetbridge";
const GB_ACTION = "nodomain.freeyourgadget.gadgetbridge.ACTION_REALTIME_SAMPLES";

module.exports = function withGadgetbridgeQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries || [{}];
    const q = manifest.queries[0];

    q.package = q.package || [];
    if (!q.package.some((p) => p.$["android:name"] === GB_PACKAGE)) {
      q.package.push({ $: { "android:name": GB_PACKAGE } });
    }

    q.intent = q.intent || [];
    const hasAction = q.intent.some((i) =>
      (i.action || []).some((a) => a.$["android:name"] === GB_ACTION),
    );
    if (!hasAction) {
      q.intent.push({ action: [{ $: { "android:name": GB_ACTION } }] });
    }

    return cfg;
  });
};
