package com.quransharif.app

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var pendingGeoOrigin: String? = null
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null
    private var lastBackPressTime = 0L
    private var backRequestInProgress = false

    companion object {
        private const val NOTIFICATION_CHANNEL_ID = "quran_daily_notification"
    }

    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        val origin = pendingGeoOrigin
        val callback = pendingGeoCallback
        if (origin != null && callback != null) {
            callback.invoke(origin, fineGranted || coarseGranted, false)
        }
        pendingGeoOrigin = null
        pendingGeoCallback = null
    }

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* Notification permission result. */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        createNotificationChannel()
        requestNotificationPermission()
        requestExactAlarmPermission()
        DailyNotificationScheduler.schedule(this)
        PrayerNotificationScheduler.schedule(this)

        val rootLayout = FrameLayout(this).apply { setBackgroundColor(Color.WHITE) }
        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadsImagesAutomatically = true
            databaseEnabled = true
            useWideViewPort = false
            loadWithOverviewMode = false
            setGeolocationEnabled(true)
        }

        webView.addJavascriptInterface(DailyContentBridge(this), "AndroidDailyContent")
        webView.addJavascriptInterface(PrayerNotificationBridge(this), "AndroidPrayerNotifications")

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            @Suppress("DEPRECATION")
            override fun shouldInterceptRequest(view: WebView, url: String): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(Uri.parse(url))
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                val fineGranted = ContextCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                val coarseGranted = ContextCompat.checkSelfPermission(
                    this@MainActivity, Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (fineGranted || coarseGranted) {
                    callback.invoke(origin, true, false)
                    return
                }

                pendingGeoOrigin = origin
                pendingGeoCallback = callback
                locationPermissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                )
            }
        }

        val webViewParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
        rootLayout.addView(webView, webViewParams)

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { _, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            val params = webView.layoutParams as FrameLayout.LayoutParams
            params.topMargin = systemBars.top
            params.bottomMargin = systemBars.bottom
            params.leftMargin = systemBars.left
            params.rightMargin = systemBars.right
            webView.layoutParams = params
            insets
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
        setContentView(rootLayout)
        ViewCompat.requestApplyInsets(rootLayout)

        // Android Back: close drawer first, then navigate app page history.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (backRequestInProgress || !::webView.isInitialized) return
                backRequestInProgress = true

                webView.evaluateJavascript(
                    """
                    (function() {
                        try {
                            var drawer = document.getElementById('drawer');
                            if (drawer && drawer.classList.contains('open')) {
                                if (typeof window.closeDrawer === 'function') {
                                    window.closeDrawer(false);
                                } else {
                                    drawer.classList.remove('open');
                                    var overlay = document.getElementById('drawerOverlay');
                                    if (overlay) overlay.classList.remove('active');
                                }
                                if (window.history.state && window.history.state.drawer === true) {
                                    window.history.back();
                                }
                                return 'handled';
                            }

                            var active = document.querySelector('.page.active');
                            var pageId = active ? active.id : 'homePage';
                            if (pageId !== 'homePage') {
                                if (window.history.length > 1) {
                                    window.history.back();
                                } else if (typeof window.showPage === 'function') {
                                    window.showPage('homePage', false);
                                    window.history.replaceState({page:'homePage'}, '', '');
                                } else {
                                    return 'exit';
                                }
                                return 'handled';
                            }
                            return 'exit';
                        } catch (e) {
                            return 'exit';
                        }
                    })();
                    """.trimIndent()
                ) { result ->
                    backRequestInProgress = false
                    if (result == "\"exit\"" || result == "null") {
                        handleHomeBackPress()
                    }
                }
            }
        })
    }

    private fun handleHomeBackPress() {
        val now = System.currentTimeMillis()
        if (now - lastBackPressTime < 2000L) {
            finish()
        } else {
            lastBackPressTime = now
            Toast.makeText(this, "আবার Back চাপলে অ্যাপ বন্ধ হবে", Toast.LENGTH_SHORT).show()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "দৈনিক কুরআন নোটিফিকেশন",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            channel.description = "প্রতিদিন রাত ৯টায় কুরআন শরীফের নোটিফিকেশন"
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun requestExactAlarmPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = getSystemService(AlarmManager::class.java)
            if (!alarmManager.canScheduleExactAlarms()) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                } catch (error: Exception) {
                    error.printStackTrace()
                }
            }
        }
    }

    override fun onDestroy() {
        pendingGeoOrigin = null
        pendingGeoCallback = null
        if (::webView.isInitialized) {
            webView.stopLoading()
            webView.destroy()
        }
        super.onDestroy()
    }
}
