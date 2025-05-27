package com.example.streamingenhanced

import android.app.AlertDialog
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Environment
import android.util.Log
import android.view.KeyEvent
import android.webkit.*
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.core.content.FileProvider
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

// import androidx.appcompat.app.AppCompatActivity

class TvActivity : ComponentActivity() {
    private val TVUA =
            "Mozilla/5.0 (Linux; Android 14; SH-M26 Build/SA181; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.108 Mobile Safari/537.36 Instagram 372.0.0.48.60 Android (34/14; 490dpi; 1080x2213; SHARP; SH-M26; Quess; qcom; in_ID; 709818019)"
    private val chromeUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 GLS/100.10.9939.100"
    private val firefoxUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.1"
    private val websites =
            mapOf(
                    "Amazon.com" to
                            Triple(
                                    "https://www.amazon.com/gp/video/storefront",
                                    "amazon.js",
                                    chromeUA
                            ),
                    "Amazon.co.jp" to
                            Triple(
                                    "https://www.amazon.co.jp/gp/video/storefront",
                                    "amazon.js",
                                    chromeUA
                            ),
                    "Amazon.co.uk" to
                            Triple(
                                    "https://www.amazon.co.uk/gp/video/storefront",
                                    "amazon.js",
                                    chromeUA
                            ),
                    "Amazon.de" to
                            Triple(
                                    "https://www.amazon.de/gp/video/storefront",
                                    "amazon.js",
                                    chromeUA
                            ),
                    "Primevideo.com" to
                            Triple("https://www.primevideo.com/", "amazon.js", chromeUA),
                    "Disney DE" to
                            Triple("https://www.disneyplus.com/de-de", "disney.js", chromeUA),
                    "Starplus" to Triple("https://www.starplus.com", "disney.js", chromeUA)
            )
    // default 'Mozilla/5.0 (Linux; Android 14; AOSP TV on x86 Build/UTT1.240131.001.F1; wv)
    // AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile
    // Safari/537.36'

    private val websiteHistory = mutableListOf<String>()
    private var downloadId: Long = -1
    private val FILENAME_APK = "update.apk"

    private val downloadCompleteReceiver =
            object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    Log.d("DownloadReceiver", "Download completed")
                    val id = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (id == downloadId) {
                        Log.d("DownloadReceiver", "id == downloadId")
                        // val query = DownloadManager.Query()
                        // query.setFilterById(downloadId)
                        // val downloadManager = context?.getSystemService(Context.DOWNLOAD_SERVICE)
                        // as DownloadManager
                        // val cursor = downloadManager.query(query)
                        // if (cursor.moveToFirst()) {
                        //     val status =
                        // cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS))
                        //     if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        //         val uriString =
                        // cursor.getString(cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI))
                        //         if (uriString != null) {
                        //             val uri = Uri.parse(uriString)
                        //             installApk(uri)
                        //         }
                        //     } else {
                        //         Log.e("DownloadReceiver", "Download failed")
                        //     }
                        // }
                        // cursor.close()
                    }
                }
            }

    private fun installApk(file: File) {
        val uri =
                FileProvider.getUriForFile(this, "${applicationContext.packageName}.provider", file)
        val intent =
                Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/vnd.android.package-archive")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
        startActivity(intent)
    }

    // private static void installAPK(File apkFile) {
    //     Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".provider",
    // apkFile);
    //     Intent i = new Intent(Intent.ACTION_VIEW);
    //     i.setDataAndType(uri, CONTENT_TYPE_APK);
    //     i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    //     activity.startActivity(i);
    // }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        checkForUpdates() // Check for updates on app startup

        val webView = findViewById<WebView>(R.id.web)
        setupWebView(webView)

        showWebsiteSelectionDialog(webView)
        webView.setOnKeyListener { _, keyCode, event ->
            if (event.action == KeyEvent.ACTION_DOWN) {
                // val videoElement = webView.evaluateJavascript(
                //     "(function() { return document.querySelector('video'); })();",
                //     null
                // )
                when (keyCode) {
                    // KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    //     Log.d("Interceptor", "KEYCODE_DPAD_RIGHT intercepted in
                    // dispatchKeyEvent")
                    //     true
                    // }
                    // KeyEvent.KEYCODE_DPAD_LEFT -> {
                    //     Log.d("Interceptor", "KEYCODE_DPAD_LEFT intercepted in dispatchKeyEvent")
                    //     true
                    // }
                    // go back in history
                    KeyEvent.KEYCODE_BACK -> {
                        Log.d("Interceptor", "KEYCODE_BACK intercepted")
                        if (websiteHistory.isNotEmpty()) {
                            val lastWebsite = websiteHistory.removeAt(websiteHistory.size - 1)
                            webView.loadUrl(lastWebsite)
                            true
                        } else false
                    }
                    else -> false
                }
            } else false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(
                downloadCompleteReceiver
        ) // Unregister the receiver to avoid memory leaks
    }

    // override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    //     if (event.action == KeyEvent.ACTION_DOWN) {
    //         Log.d("Interceptor", "dispatchKeyEvent: key pressed: ${event.keyCode}, action:
    // ${event.action}")
    //         when (event.keyCode) {
    //             KeyEvent.KEYCODE_DPAD_RIGHT -> {
    //                 Log.d("Interceptor", "KEYCODE_DPAD_RIGHT intercepted in dispatchKeyEvent")
    //                 return true
    //             }
    //             KeyEvent.KEYCODE_DPAD_LEFT -> {
    //                 Log.d("Interceptor", "KEYCODE_DPAD_LEFT intercepted in dispatchKeyEvent")
    //                 return true
    //             }
    //         }
    //     }
    //     return super.dispatchKeyEvent(event)
    // }

    private fun setupWebView(webView: WebView) {
        webView.settings.setMediaPlaybackRequiresUserGesture(false)
        webView.settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.domStorageEnabled = true
        // set scale of website to 1
        webView.settings.setUseWideViewPort(true)
        webView.setInitialScale(1)
        // Enable WebView debugging
        WebView.setWebContentsDebuggingEnabled(true)

        webView.webChromeClient =
                object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        val resources = request?.resources
                        resources?.forEach { resource ->
                            if (PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID == resource) {
                                request.grant(resources)
                                return
                            }
                        }
                        super.onPermissionRequest(request)
                    }
                }
        webView.settings.javaScriptEnabled = true
        webView.webViewClient =
                object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        val selectedWebsite = view?.tag as? String
                        val fileName = websites[selectedWebsite]?.second
                        if (fileName != null) {
                            modifyWebViewContent(webView, fileName)
                        }
                        modifyWebViewContent(webView, "shared-functions.js")
                    }
                    // error could not load scripts
                    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                        if (url != null && url.startsWith("chrome-extension://")) {
                            return true
                        }
                        return super.shouldOverrideUrlLoading(view, url)
                    }
                }
        webView.addJavascriptInterface(WebAppInterface(this), "Android")
    }

    private fun showWebsiteSelectionDialog(webView: WebView) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_website_selection, null)
        val spinner = dialogView.findViewById<Spinner>(R.id.website_spinner)

        val adapter =
                ArrayAdapter(this, android.R.layout.simple_spinner_item, websites.keys.toList())
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinner.adapter = adapter

        // Load the last selected website from SharedPreferences
        val sharedPreferences = getSharedPreferences("TvActivityPrefs", Context.MODE_PRIVATE)
        val lastSelectedWebsite = sharedPreferences.getString("lastSelectedWebsite", null)
        if (lastSelectedWebsite != null) {
            val position = websites.keys.toList().indexOf(lastSelectedWebsite)
            if (position >= 0) {
                spinner.setSelection(position)
            }
        }

        AlertDialog.Builder(this)
                .setTitle("Select Website Test")
                .setView(dialogView)
                .setPositiveButton("OK") { _, _ ->
                    val selectedWebsite = spinner.selectedItem.toString()
                    val url = websites[selectedWebsite]?.first
                    webView.settings.userAgentString = websites[selectedWebsite]?.third
                    webView.tag = selectedWebsite
                    if (url != null) {
                        websiteHistory.add(url)
                        webView.loadUrl(url)
                    }

                    // Save the selected website to SharedPreferences
                    with(sharedPreferences.edit()) {
                        putString("lastSelectedWebsite", selectedWebsite)
                        apply()
                    }
                }
                .setCancelable(false)
                .show()
    }

    private fun modifyWebViewContent(webView: WebView, fileName: String) {
        val jsCode = loadJsCodeFromFile(fileName)
        Log.d("Enhanced", "evaluateJavascript")
        webView.evaluateJavascript(jsCode, null)
    }

    private fun loadJsCodeFromFile(fileName: String): String {
        val inputStream = assets.open(fileName)
        val bufferedReader = BufferedReader(InputStreamReader(inputStream))
        return bufferedReader.use { it.readText() }
    }
    // TODO: remove this function
    private fun getUnsafeOkHttpClient(): OkHttpClient {
        val trustAllCerts =
                arrayOf<javax.net.ssl.TrustManager>(
                        object : javax.net.ssl.X509TrustManager {
                            override fun checkClientTrusted(
                                    chain: Array<java.security.cert.X509Certificate>,
                                    authType: String
                            ) {}
                            override fun checkServerTrusted(
                                    chain: Array<java.security.cert.X509Certificate>,
                                    authType: String
                            ) {}
                            override fun getAcceptedIssuers():
                                    Array<java.security.cert.X509Certificate> = arrayOf()
                        }
                )

        val sslContext = javax.net.ssl.SSLContext.getInstance("SSL")
        sslContext.init(null, trustAllCerts, java.security.SecureRandom())
        val sslSocketFactory = sslContext.socketFactory

        return OkHttpClient.Builder()
                .sslSocketFactory(
                        sslSocketFactory,
                        trustAllCerts[0] as javax.net.ssl.X509TrustManager
                )
                .hostnameVerifier { _, _ -> true }
                .build()
    }

    private fun checkForUpdates() {
        val packageInfo = packageManager.getPackageInfo(packageName, 0)
        val currentVersion = packageInfo.versionName
        Log.d("AppVersion", "Version Name: $currentVersion")
        val updateUrl =
                "https://raw.githubusercontent.com/Dreamlinerm/Netflix-Prime-Auto-Skip/refs/heads/main/android-app/app-update.json" // Replace with your server URL

        Thread {
                    try {
                        val client = getUnsafeOkHttpClient()
                        // val client = OkHttpClient()
                        val request = Request.Builder().url(updateUrl).build()
                        val response = client.newCall(request).execute()
                        val responseBody = response.body?.string()
                        if (responseBody != null) {
                            val jsonObject = JSONObject(responseBody)
                            val latestVersion = jsonObject.getString("version")
                            val downloadUrl = jsonObject.getString("downloadUrl")
                            Log.d("UpdateCheck", "latestVersion: $latestVersion")
                            if (latestVersion > currentVersion) {
                                Log.d("UpdateCheck", ">")
                                runOnUiThread { showUpdateDialog(downloadUrl) }
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("UpdateCheck", "Failed to check for updates", e)
                    }
                }
                .start()
    }

    private fun showUpdateDialog(downloadUrl: String) {
        Log.d("UpdateCheck", "downloadUrl: $downloadUrl")
        AlertDialog.Builder(this)
                .setTitle("Update Available")
                .setMessage("A new version of the app is available. Would you like to update?")
                .setPositiveButton("Update") { _, _ ->
                    Thread {
                                try {
                                    val client = getUnsafeOkHttpClient()
                                    val request = Request.Builder().url(downloadUrl).build()
                                    val response = client.newCall(request).execute()
                                    if (response.isSuccessful) {
                                        val inputStream = response.body?.byteStream()
                                        val file =
                                                File(
                                                        getExternalFilesDir(
                                                                Environment.DIRECTORY_DOWNLOADS
                                                        ),
                                                        FILENAME_APK
                                                )
                                        file.outputStream().use { outputStream ->
                                            inputStream?.copyTo(outputStream)
                                        }
                                        Log.d(
                                                "UpdateCheck",
                                                "File downloaded to: ${file.absolutePath}"
                                        )
                                        runOnUiThread { installApk(file) }
                                    } else {
                                        Log.e(
                                                "UpdateCheck",
                                                "Failed to download update: ${response.code}"
                                        )
                                        runOnUiThread {
                                            Toast.makeText(
                                                            this,
                                                            "Failed to download the update.",
                                                            Toast.LENGTH_LONG
                                                    )
                                                    .show()
                                        }
                                    }
                                } catch (e: Exception) {
                                    Log.e("UpdateCheck", "Failed to download update", e)
                                    runOnUiThread {
                                        Toast.makeText(
                                                        this,
                                                        "Failed to download the update.",
                                                        Toast.LENGTH_LONG
                                                )
                                                .show()
                                    }
                                }
                            }
                            .start()
                }
                .setNegativeButton("Cancel", null)
                .show()
    }

    // JavaScript interface class
    class WebAppInterface(private val activity: TvActivity) {
        @JavascriptInterface
        fun sendMessage(message: String) {
            // Log.d("WebAppInterface", "Message from JS: $message")
            try {
                val jsonObject = JSONObject(message)
                // Handle the JSON message here
                Log.d("WebAppInterface", "JSON message: ${jsonObject.toString()}")
            } catch (e: Exception) {
                Log.e("WebAppInterface", "Failed to parse JSON message", e)
            }
        }
    }
}
