import { requireNativeModule } from "expo-modules-core";
import { EventEmitter, type Subscription } from "expo-modules-core";

export type GadgetbridgeSample = {
  heartRateBpm: number | null;
  steps: number | null;
  timestampSec: number;
};

type NativeModule = {
  startListening(): Promise<boolean>;
  stopListening(): Promise<boolean>;
  isGadgetbridgeInstalled(): Promise<boolean>;
};

const native = requireNativeModule<NativeModule>("Gadgetbridge");
const emitter = new EventEmitter(native as any);

export const Gadgetbridge = {
  start: () => native.startListening(),
  stop: () => native.stopListening(),
  isInstalled: () => native.isGadgetbridgeInstalled(),
  onSample(listener: (sample: GadgetbridgeSample) => void): Subscription {
    return emitter.addListener<GadgetbridgeSample>("onSample", listener);
  },
};

export default Gadgetbridge;
