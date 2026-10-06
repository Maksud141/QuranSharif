package com.quransharif.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object DailyNotificationScheduler {

    private const val ALARM_REQUEST_CODE = 9001

    fun schedule(context: Context) {

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

        /*
         * Device-এর বর্তমান Local Time অনুযায়ী
         * পরবর্তী রাত ৯:০০টা নির্ধারণ করা হবে।
         */
        val calendar = Calendar.getInstance().apply {

            set(Calendar.HOUR_OF_DAY, 21)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)

            // আজকের ৯টা পার হয়ে গেলে আগামীকাল ৯টা
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        val triggerTime = calendar.timeInMillis

        scheduleAlarm(
            context,
            alarmManager,
            triggerTime,
            pendingIntent
        )
    }

    private fun scheduleAlarm(
        context: Context,
        alarmManager: AlarmManager,
        triggerTime: Long,
        pendingIntent: PendingIntent
    ) {

        /*
         * Android 12+ (API 31+)
         *
         * Exact alarm permission থাকলে
         * ঠিক ৯:০০ PM-এর জন্য exact alarm ব্যবহার করা হবে।
         */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

            if (alarmManager.canScheduleExactAlarms()) {

                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )

            } else {

                /*
                 * Exact alarm permission না থাকলে
                 * app বন্ধ হয়ে যাবে না।
                 *
                 * Android system-এর allowed inexact alarm
                 * ব্যবহার করা হবে।
                 */
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            }

        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {

            /*
             * Android 6–11
             */
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            )

        } else {

            /*
             * Android 5 এবং তার আগের version
             */
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            )
        }
    }
}