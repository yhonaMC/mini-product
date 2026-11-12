import Foundation

@objcMembers public final class CurrencyFormatter: NSObject {
  // Objective-C++ translates a formatting failure to a JS error, never a silent fallback.
  @objc(format:currency:locale:)
  public func format(_ value: Double, currency: String, locale: String) -> String? {
    guard value.isFinite else { return nil }
    let formatter = NumberFormatter()
    formatter.locale = Locale(identifier: locale)
    formatter.numberStyle = .currency
    formatter.currencyCode = currency.uppercased()
    formatter.roundingMode = .halfUp
    return formatter.string(from: NSNumber(value: value))
  }
}
