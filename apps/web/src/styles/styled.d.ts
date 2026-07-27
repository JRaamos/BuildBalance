import 'styled-components';
import type { AppTheme } from './theme';

declare module 'styled-components' {
  // A biblioteca usa interface aberta para permitir a tipagem do tema via module augmentation.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
