package io.zenith.client

import android.os.Bundle
import android.webkit.CookieManager
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  private external fun initNdkContext()

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    initNdkContext()
  }

  override fun onStop() {
    super.onStop()
    CookieManager.getInstance().flush()
  }
}
