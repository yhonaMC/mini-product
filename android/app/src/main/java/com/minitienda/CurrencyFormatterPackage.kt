package com.minitienda

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class CurrencyFormatterPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      if (name == CurrencyFormatterModule.NAME) CurrencyFormatterModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
        CurrencyFormatterModule.NAME to ReactModuleInfo(
            name = CurrencyFormatterModule.NAME,
            className = CurrencyFormatterModule::class.java.name,
            canOverrideExistingModule = false,
            needsEagerInit = false,
            isCxxModule = false,
            isTurboModule = true,
        ),
    )
  }
}
