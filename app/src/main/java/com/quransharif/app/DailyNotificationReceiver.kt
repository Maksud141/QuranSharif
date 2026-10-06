package com.quransharif.app

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import java.util.Calendar

class DailyNotificationReceiver : BroadcastReceiver() {

    companion object {
        private const val NOTIFICATION_ID = 9001
        private const val NOTIFICATION_CHANNEL_ID = "quran_daily_notification"
        private const val ALARM_REQUEST_CODE = 9001
    }

    override fun onReceive(context: Context, intent: Intent?) {

        showNotification(context)

        // পরের দিনের রাত ৯টার notification আবার schedule করা
        scheduleNextNotification(context)
    }

    private fun showNotification(context: Context) {

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE)
                    as NotificationManager

        val notificationIntent = Intent(context, MainActivity::class.java).apply {
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

        val notification = NotificationCompat.Builder(
            context,
            NOTIFICATION_CHANNEL_ID
        )
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("কুরআন শরীফ")
            .setContentText("আজকের কুরআনের বাণী পড়ুন 🌙")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("আজকের কুরআনের বাণী পড়ুন এবং কুরআনের সাথে আপনার সম্পর্ক আরও দৃঢ় করুন।")
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

            // পরবর্তী দিন
            add(Calendar.DAY_OF_YEAR, 1)

            // রাত ৯:০০টা
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