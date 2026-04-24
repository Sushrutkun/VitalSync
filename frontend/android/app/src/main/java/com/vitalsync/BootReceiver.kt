package com.vitalsync

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.transistorsoft.rnbackgroundfetch.HeadlessTask

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        // react-native-background-fetch handles its own boot registration internally
        // when startOnBoot: true is set. This receiver is a safety net that forces
        // the headless task scheduler alive in case of OEM boot quirks.
        HeadlessTask.onBoot(context)
    }
}
