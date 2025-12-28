import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';

const globalBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalBuffer.Buffer) {
  globalBuffer.Buffer = Buffer;
}
