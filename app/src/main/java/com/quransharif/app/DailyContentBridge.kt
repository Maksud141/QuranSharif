
package com.quransharif.app

import android.content.Context
import android.webkit.JavascriptInterface
import org.json.JSONObject

class DailyContentBridge(context: Context) {

    private val prefs = context.getSharedPreferences(
        "daily_content_native",
        Context.MODE_PRIVATE
    )

    @JavascriptInterface
    fun saveDailyContent(json: String) {
        try {
            val data = JSONObject(json)
            val dateKey = data.optString("dateKey", "")

            if (dateKey.isBlank()) return

            prefs.edit()
                .putString("data_json", data.toString())
                .apply()

        } catch (e: Exception) {
            android.util.Log.e(
                "DailyContentBridge",
                "Could not save daily content",
                e
            )
        }
    }
}
