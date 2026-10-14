
package com.quransharif.app

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONObject

class PrayerNotificationBridge(
    private val context: Context
) {
    companion object {
        private const val PREFS_NAME = "prayer_notification_prefs"
        private const val CONTENT_KEY = "prayer_timings_json"
        private const val TAG = "PrayerNotificationBridge"
    }

    @JavascriptInterface
    fun savePrayerTimings(json: String) {
        try {
            val data = JSONObject(json)
            val days = data.optJSONArray("days")

            if (days == null || days.length() == 0) {
                Log.w(TAG, "No prayer calendar days received")
                return
            }

            val prefs = context.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
            )

            val oldJson = prefs.getString(CONTENT_KEY, null)

            // Cancel alarms from the previous calendar before replacing it.
            if (!oldJson.isNullOrBlank()) {
                try {
                    PrayerNotificationScheduler.cancelScheduled(
                        context,
                        JSONObject(oldJson)
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Could not cancel old prayer alarms", e)
                }
            }

            prefs.edit()
                .putString(CONTENT_KEY, data.toString())
                .apply()

            PrayerNotificationScheduler.schedule(context)

            Log.d(TAG, "Prayer calendar saved: ${days.length()} days")
        } catch (e: Exception) {
            Log.e(TAG, "Could not save prayer calendar", e)
        }
    }
}
