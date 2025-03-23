package com.example.streamingenhanced

import android.os.Bundle
import android.util.Log
import android.webkit.*
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Spinner
import androidx.activity.ComponentActivity
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader

class TvActivity : ComponentActivity() {
    private val websites = mapOf(
        "Amazon DE" to Pair("https://www.amazon.de/gp/video/storefront", "amazon.js"),
        "Amazon IT" to Pair("https://www.amazon.it/gp/video/storefront", "amazon.js"),
        "Disney DE" to Pair("https://www.disneyplus.com/de-de", "disney.js"),
        "Disney IT" to Pair("https://www.disneyplus.com/it-it", "disney.js")
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView = findViewById<WebView>(R.id.web)
        val spinner = findViewById<Spinner>(R.id.website_spinner)

        webView.settings.setMediaPlaybackRequiresUserGesture(false)
        webView.settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.domStorageEnabled = true
        // Add Permissions-Policy header
        // Modify the user agent
        // TV User Agent
        webView.settings.userAgentString = "Mozilla/5.0 (Linux; Android 14; SH-M26 Build/SA181; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.108 Mobile Safari/537.36 Instagram 372.0.0.48.60 Android (34/14; 490dpi; 1080x2213; SHARP; SH-M26; Quess; qcom; in_ID; 709818019)"
        webView.webChromeClient = object : WebChromeClient() {
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
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                val selectedWebsite = spinner.selectedItem.toString()
                val fileName = websites[selectedWebsite]?.second
                if (fileName != null) {
                    modifyWebViewContent(webView, fileName)
                }
            }
            // error could not load scripts
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null && url.startsWith("chrome-extension://")) {
                    // Handle the unsupported URL scheme
                    return true
                }
                return super.shouldOverrideUrlLoading(view, url)
            }
        }
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, websites.keys.toList())
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinner.adapter = adapter

        spinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: android.view.View, position: Int, id: Long) {
                val selectedWebsite = parent.getItemAtPosition(position).toString()
                val url = websites[selectedWebsite]?.first
                if (url != null) {
                    webView.loadUrl(url)
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }
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

    // JavaScript interface class
    class WebAppInterface(private val activity: TvActivity) {
        @JavascriptInterface
        fun sendMessage(message: String) {
            //Log.d("WebAppInterface", "Message from JS: $message")
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