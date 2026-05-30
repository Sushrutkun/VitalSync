package com.vitalsync.gadgetbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Listens for Gadgetbridge's broadcast intents and forwards realtime samples to JS.
 *
 * <p>Gadgetbridge emits `nodomain.freeyourgadget.gadgetbridge.ACTION_REALTIME_SAMPLES` with
 * extras: hr (Int), steps (Int), timestamp (Long, seconds).
 *
 * <p>Receiver registers/unregisters on JS calls to startListening/stopListening so we don't
 * leak when the user disconnects the source.
 */
class GadgetbridgeModule : Module() {

  companion object {
    const val ACTION = "nodomain.freeyourgadget.gadgetbridge.ACTION_REALTIME_SAMPLES"
    const val EVENT_SAMPLE = "onSample"
  }

  private var receiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("Gadgetbridge")

    Events(EVENT_SAMPLE)

    AsyncFunction("startListening") {
      val ctx = appContext.reactContext ?: throw IllegalStateException("No context")
      if (receiver != null) return@AsyncFunction true

      receiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, intent: Intent?) {
          if (intent?.action != ACTION) return
          val hr = intent.getIntExtra("hr", -1)
          val steps = intent.getIntExtra("steps", -1)
          val ts = intent.getLongExtra("timestamp", System.currentTimeMillis() / 1000)
          val payload = mapOf(
            "heartRateBpm" to if (hr > 0) hr else null,
            "steps" to if (steps >= 0) steps else null,
            "timestampSec" to ts
          )
          sendEvent(EVENT_SAMPLE, payload)
        }
      }
      val filter = IntentFilter(ACTION)
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
        ctx.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
      } else {
        @Suppress("UnspecifiedRegisterReceiverFlag")
        ctx.registerReceiver(receiver, filter)
      }
      true
    }

    AsyncFunction("stopListening") {
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      receiver?.let {
        try { ctx.unregisterReceiver(it) } catch (_: IllegalArgumentException) {}
      }
      receiver = null
      true
    }

    AsyncFunction("isGadgetbridgeInstalled") {
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      try {
        ctx.packageManager.getPackageInfo("nodomain.freeyourgadget.gadgetbridge", 0)
        true
      } catch (_: android.content.pm.PackageManager.NameNotFoundException) {
        false
      }
    }

    OnDestroy {
      val ctx = appContext.reactContext ?: return@OnDestroy
      receiver?.let {
        try { ctx.unregisterReceiver(it) } catch (_: IllegalArgumentException) {}
      }
      receiver = null
    }
  }
}
