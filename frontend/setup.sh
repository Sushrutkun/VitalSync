#!/bin/bash
set -e

FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="VitalSyncApp"
PROJECT_DIR="$FRONTEND_DIR/$PROJECT_NAME"
PACKAGE_NAME="com.vitalsyncapp"

echo "==> VitalSync React Native Setup"
echo "    Frontend dir : $FRONTEND_DIR"
echo "    Project dir  : $PROJECT_DIR"
echo ""

# ── 1. Init React Native project ─────────────────────────────────────────────
if [ -d "$PROJECT_DIR" ]; then
  echo "[1/7] $PROJECT_NAME already exists, skipping init."
else
  echo "[1/7] Initialising React Native project..."
  cd "$FRONTEND_DIR"
  npx @react-native-community/cli@latest init "$PROJECT_NAME" --skip-install
fi

# ── 2. Copy source files ──────────────────────────────────────────────────────
echo "[2/7] Copying source files..."
cp -r "$FRONTEND_DIR/src"      "$PROJECT_DIR/"
cp    "$FRONTEND_DIR/App.tsx"  "$PROJECT_DIR/App.tsx"

# ── 3. Install dependencies ───────────────────────────────────────────────────
echo "[3/7] Installing dependencies..."
cd "$PROJECT_DIR"
npm install \
  @react-native-async-storage/async-storage@^2.1.0 \
  axios@^1.7.9 \
  react-native-background-fetch@^4.2.7 \
  react-native-get-random-values@^1.11.0 \
  react-native-health-connect@^3.1.0 \
  react-native-keychain@^9.1.0 \
  uuid@^11.0.4

npm install --save-dev @types/uuid@^10.0.0

# ── 4. Set minSdkVersion = 26 (Health Connect requirement) ───────────────────
echo "[4/7] Setting minSdkVersion to 26..."
GRADLE="$PROJECT_DIR/android/build.gradle"
if grep -q "minSdkVersion" "$GRADLE"; then
  sed -i.bak 's/minSdkVersion\s*=\s*[0-9]*/minSdkVersion = 26/' "$GRADLE"
  rm -f "$GRADLE.bak"
  echo "    Updated $GRADLE"
else
  echo "    WARNING: Could not find minSdkVersion in $GRADLE — set it manually to 26."
fi

# ── 5. Patch AndroidManifest.xml ─────────────────────────────────────────────
echo "[5/7] Patching AndroidManifest.xml..."
MANIFEST="$PROJECT_DIR/android/app/src/main/AndroidManifest.xml"

python3 - "$MANIFEST" <<'PYEOF'
import sys
import xml.etree.ElementTree as ET

path = sys.argv[1]
ET.register_namespace('android', 'http://schemas.android.com/apk/res/android')

tree = ET.parse(path)
root = tree.getroot()
ns = 'http://schemas.android.com/apk/res/android'

def attr(name):
    return f'{{{ns}}}{name}'

# ── Add <queries> block ──────────────────────────────────────────────────────
if root.find('queries') is None:
    queries = ET.Element('queries')
    pkg = ET.SubElement(queries, 'package')
    pkg.set(attr('name'), 'com.google.android.apps.healthdata')
    root.insert(0, queries)  # insert at top of manifest

# ── Add permissions ──────────────────────────────────────────────────────────
new_permissions = [
    'android.permission.health.READ_HEART_RATE',
    'android.permission.health.READ_STEPS',
    'android.permission.health.READ_OXYGEN_SATURATION',
    'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
    'android.permission.health.READ_EXERCISE',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
]
existing = {el.get(attr('name')) for el in root.findall('uses-permission')}
for perm in new_permissions:
    if perm not in existing:
        el = ET.SubElement(root, 'uses-permission')
        el.set(attr('name'), perm)

# ── Add Health Connect rationale intent-filter to MainActivity ───────────────
app = root.find('application')
if app is not None:
    for activity in app.findall('activity'):
        if activity.get(attr('name')) == '.MainActivity':
            filters = [f.find('action') for f in activity.findall('intent-filter')]
            has_rationale = any(
                a is not None and a.get(attr('name')) == 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'
                for a in filters
            )
            if not has_rationale:
                intent_filter = ET.SubElement(activity, 'intent-filter')
                action = ET.SubElement(intent_filter, 'action')
                action.set(attr('name'), 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE')

    # ── Add BootReceiver ─────────────────────────────────────────────────────
    existing_receivers = [r.get(attr('name')) for r in app.findall('receiver')]
    if '.BootReceiver' not in existing_receivers:
        receiver = ET.SubElement(app, 'receiver')
        receiver.set(attr('name'), '.BootReceiver')
        receiver.set(attr('exported'), 'false')
        intent_filter = ET.SubElement(receiver, 'intent-filter')
        action = ET.SubElement(intent_filter, 'action')
        action.set(attr('name'), 'android.intent.action.BOOT_COMPLETED')

tree.write(path, encoding='utf-8', xml_declaration=True)
print('    AndroidManifest.xml patched.')
PYEOF

# ── 6. Copy BootReceiver.kt ───────────────────────────────────────────────────
echo "[6/7] Copying BootReceiver.kt..."
KOTLIN_DIR="$PROJECT_DIR/android/app/src/main/java/com/vitalsyncapp"
mkdir -p "$KOTLIN_DIR"

sed "s/package com\.vitalsync$/package $PACKAGE_NAME/" \
  "$FRONTEND_DIR/android/app/src/main/java/com/vitalsync/BootReceiver.kt" \
  > "$KOTLIN_DIR/BootReceiver.kt"

echo "    Written to $KOTLIN_DIR/BootReceiver.kt"

# ── 7. Create .env ────────────────────────────────────────────────────────────
echo "[7/7] Creating .env..."
ENV_FILE="$PROJECT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "API_BASE_URL=https://your-backend.com" > "$ENV_FILE"
  echo "    Created $ENV_FILE — update API_BASE_URL before running."
else
  echo "    .env already exists, skipping."
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit $PROJECT_DIR/.env and set API_BASE_URL"
echo "  2. Connect an Android 13+ device (USB debugging on) or start an emulator"
echo "  3. cd $PROJECT_DIR && npx react-native run-android"
