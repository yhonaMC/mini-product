#import "RCTCurrencyFormatter.h"
#import "MiniTienda-Swift.h"

@implementation RCTCurrencyFormatter {
  CurrencyFormatter *_formatter;
}

- (instancetype)init
{
  if (self = [super init]) {
    _formatter = [CurrencyFormatter new];
  }
  return self;
}

+ (NSString *)moduleName
{
  return @"CurrencyFormatter";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSString *)format:(double)value currency:(NSString *)currency locale:(NSString *)locale
{
  NSString *result = [_formatter format:value currency:currency locale:locale];
  if (result == nil) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                 reason:@"Unable to format currency amount"
                               userInfo:nil];
  }
  return result;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeCurrencyFormatterSpecJSI>(params);
}

@end
