package com.minitienda

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.minitienda.specs.NativeCurrencyFormatterSpec
import java.math.RoundingMode
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

@ReactModule(name = CurrencyFormatterModule.NAME)
class CurrencyFormatterModule(reactContext: ReactApplicationContext) :
    NativeCurrencyFormatterSpec(reactContext) {

  override fun getName() = NAME

  override fun format(value: Double, currency: String, locale: String): String {
    require(value.isFinite()) { "Currency amount must be finite" }
    val currencyUnit = Currency.getInstance(currency.uppercase(Locale.ROOT))
    // A formatter per invocation avoids sharing mutable NumberFormat across calls.
    val formatter = NumberFormat.getCurrencyInstance(Locale.forLanguageTag(locale))
    formatter.currency = currencyUnit
    val fractionDigits = currencyUnit.defaultFractionDigits
    if (fractionDigits >= 0) {
      formatter.minimumFractionDigits = fractionDigits
      formatter.maximumFractionDigits = fractionDigits
    }
    formatter.roundingMode = RoundingMode.HALF_UP
    return formatter.format(value)
  }

  companion object {
    const val NAME = "CurrencyFormatter"
  }
}
