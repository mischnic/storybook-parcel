import type { Plugin } from 'vite';
import { vite } from '@storybook/csf-plugin';
import type { StorybookConfig } from '@storybook/types';
import type { ExtendedOptions } from '../types';

export async function csfPlugin(config: ExtendedOptions): Promise<Plugin> {
  const { presets } = config;

  const addons = await presets.apply<StorybookConfig['addons']>('addons', []);
  const docsOptions =
    // @ts-expect-error - not sure what type to use here
    addons.find((a) => [a, a.name].includes('@storybook/addon-docs'))?.options ?? {};

  return vite(docsOptions?.csfPluginOptions);
}
