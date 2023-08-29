import { Config } from './types.js';

type PartialConfig = Partial<{
  readonly [Key in keyof Config]: Partial<Config[Key]>;
}>;

export const configOverride: PartialConfig = {
  slack: {},
  fahrradxxl: {
    itemsToWatch: [],
  },
};
