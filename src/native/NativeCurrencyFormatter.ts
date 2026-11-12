import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  format(value: Double, currency: string, locale: string): string;
}

// Optional so non-native runtimes (including Jest) can use the Intl implementation.
export default TurboModuleRegistry.get<Spec>('CurrencyFormatter');
