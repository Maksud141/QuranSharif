
package com.quransharif.app

import android.content.Context
import android.webkit.JavascriptInterface
import org.json.JSONObject

class PrayerNotificationBridge(context: Context) {

    private val prefs = context.getSharedPreferences(
        "prayer_notification_prefs",
        Context.MODE_PRIVATE
    )

    @JavascriptInterface
    fun savePrayerTimings(json: String) {
        try {
            val data = JSONObject(json)
            val dateKey = data.optString("dateKey", "")

            if (dateKey.isBlank()) return

            prefs.edit()
                .putString("prayer_timings_json", data.toString())
                .apply()

            PrayerNotificationScheduler.schedule(context)
        } catch (e: Exception) {
            android.util.Log.e(
                "PrayerNotificationBridge",
                "Could not save prayer timings",
                e
            )
        }
    }
}
