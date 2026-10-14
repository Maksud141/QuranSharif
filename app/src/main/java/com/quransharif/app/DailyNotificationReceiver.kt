
package com.quransharif.app

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class DailyNotificationReceiver : BroadcastReceiver() {

    companion object {
        private const val NOTIFICATION_ID = 9001
        private const val NOTIFICATION_CHANNEL_ID =
            "quran_daily_notification"
        private const val ALARM_REQUEST_CODE = 9001

        private const val PREFS_NAME = "daily_content_native"
        private const val CONTENT_KEY = "data_json"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        showNotification(context)
        scheduleNextNotification(context)
    }

    private fun showNotification(context: Context) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE)
                    as NotificationManager

        val notificationIntent =
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

        val pendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
        )

        val content = getTodayContent(context)

        val title = "কুরআন শরীফ"
        val shortText = content?.first ?: "আজকের কুরআনের বাণী পড়ুন 🌙"
        val detailText = content?.second
            ?: "আজকের আয়াত ও হাদিস পড়তে অ্যাপটি খুলুন।"

        val notification = NotificationCompat.Builder(
            context,
            NOTIFICATION_CHANNEL_ID
        )
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(shortText)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(detailText)
            )
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(
            NOTIFICATION_ID,
            notification
        )
    }

    private fun getTodayContent(
        context: Context
    ): Pair<String, String>? {
        return try {
            val prefs = context.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
            )

            val json = prefs.getString(CONTENT_KEY, null)
                ?: return null

            val data = JSONObject(json)
            val savedDate = data.optString("dateKey", "")
            val today = SimpleDateFormat(
                "yyyy-MM-dd",
                Locale.getDefault()
            ).format(Date())

            // পুরোনো দিনের কনটেন্ট আজকের নোটিফিকেশনে দেখাবে না।
            if (savedDate != today) return null

            val ayah = data.optJSONObject("ayah")
            val hadith = data.optJSONObject("hadith")

            val ayahArabic =
                ayah?.optString("arabic", "").orEmpty()
            val ayahBengali =
                ayah?.optString("bengali", "").orEmpty()

            val surahNumber = ayah?.optInt("surah", 0) ?: 0
            val ayahNumber = ayah?.optInt("ayah", 0) ?: 0

            val ayahReference =
                if (surahNumber > 0 && ayahNumber > 0) {
                    "সূরা $surahNumber, আয়াত $ayahNumber"
                } else {
                    ""
                }

            val hadithArabic =
                hadith?.optString("arabic", "").orEmpty()
            val hadithBengali =
                hadith?.optString("bengali", "").orEmpty()
            val hadithBook =
                hadith?.optString("book", "").orEmpty()
            val hadithNumber =
                hadith?.optString("number", "").orEmpty()

            val sections = mutableListOf<String>()

            if (ayahArabic.isNotBlank()) {
                sections.add("📖 আজকের আয়াত:\n$ayahArabic")
            }

            if (ayahBengali.isNotBlank()) {
                sections.add(ayahBengali)
            }

            if (ayahReference.isNotBlank()) {
                sections.add("— $ayahReference")
            }

            if (hadithArabic.isNotBlank()) {
                sections.add("📜 আজকের হাদিস:\n$hadithArabic")
            }

            if (hadithBengali.isNotBlank()) {
                sections.add(hadithBengali)
            }

            val hadithReference = listOf(
                hadithBook,
                if (hadithNumber.isNotBlank()) {
                    "হাদিস $hadithNumber"
                } else {
                    ""
                }
            ).filter { it.isNotBlank() }
                .joinToString(" • ")

            if (hadithReference.isNotBlank()) {
                sections.add("— $hadithReference")
            }

            if (sections.isEmpty()) return null

            val shortText = when {
                ayahBengali.isNotBlank() ->
                    ayahBengali
                hadithBengali.isNotBlank() ->
                    hadithBengali
                else ->
                    "আজকের কুরআনের বাণী পড়ুন 🌙"
            }

            Pair(shortText, sections.joinToString("\n\n"))
        } catch (error: Exception) {
            android.util.Log.e(
                "DailyNotificationReceiver",
                "Daily content read failed",
                error
            )
            null
        }
    }

    private fun scheduleNextNotification(context: Context) {
        val alarmManager =
            context.getSystemService(Context.ALARM_SERVICE)
                    as AlarmManager

        val intent = Intent(
            context,
            DailyNotificationReceiver::class.java
        )

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            ALARM_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
        )

        val calendar = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 21)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        scheduleAlarm(
            alarmManager,
            calendar.timeInMillis,
            pendingIntent
        )
    }

    private fun scheduleAlarm(
        alarmManager: AlarmManager,
        triggerAtMillis: Long,
        pendingIntent: PendingIntent
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )
        } else {
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )
        }
    }
}
