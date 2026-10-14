package com.quransharif.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object PrayerNotificationScheduler {

    private const val PREFS_NAME = "prayer_notification_prefs"
    private const val CONTENT_KEY = "prayer_timings_json"
    private const val TAG = "PrayerNotificationScheduler"

    private val prayers = listOf(
        "fajr" to "ফজর",
        "dhuhr" to "যোহর",
        "asr" to "আসর",
        "maghrib" to "মাগরিব",
        "isha" to "এশা"
    )

    fun schedule(context: Context) {
        try {
            val prefs = context.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
            )

            val jsonText = prefs.getString(CONTENT_KEY, null) ?: return
            val data = JSONObject(jsonText)

            val today = SimpleDateFormat(
                "yyyy-MM-dd",
                Locale.US
            ).format(Date())

            if (data.optString("dateKey") != today) {
                Log.d(TAG, "Prayer timings are not for today")
                return
            }

            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            val now = System.currentTimeMillis()

            for ((index, prayer) in prayers.withIndex()) {
                val (key, displayName) = prayer
                val timeText = data.optString(key, "")

                if (timeText.isBlank()) continue

                val parts = timeText.split(":")
                if (parts.size < 2) continue

                val hour = parts[0].toIntOrNull() ?: continue
                val minute = parts[1].toIntOrNull() ?: continue

                if (hour !in 0..23 || minute !in 0..59) continue

                val calendar = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }

                val triggerAt = calendar.timeInMillis

                // আজকের সময় ইতিমধ্যে পেরিয়ে গেলে বাদ দাও।
                if (triggerAt <= now) continue

                val intent = Intent(
                    context,
                    PrayerNotificationReceiver::class.java
                ).apply {
                    putExtra("prayer_name", displayName)
                }

                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    7200 + index,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or
                        PendingIntent.FLAG_IMMUTABLE
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerAt,
                        pendingIntent
                    )
                } else {
                    alarmManager.set(
                        AlarmManager.RTC_WAKEUP,
                        triggerAt,
                        pendingIntent
                    )
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Could not schedule prayer notifications", e)
        }
    }
}
