export async function generateAddonSetupCode() {
  return `
    import { createChannel as createPostMessageChannel } from '@storybook/channel-postmessage';
    import { createChannel as createWebSocketChannel } from '@storybook/channel-websocket';
    import { addons } from '@storybook/preview-api';

    const channel = createPostMessageChannel({ page: 'preview' });
    addons.setChannel(channel);
    window.__STORYBOOK_ADDONS_CHANNEL__ = channel;

    const { SERVER_CHANNEL_URL } = globalThis;
    if (SERVER_CHANNEL_URL) {
      const serverChannel = createWebSocketChannel({ url: SERVER_CHANNEL_URL });
      addons.setServerChannel(serverChannel);
      window.__STORYBOOK_SERVER_CHANNEL__ = serverChannel;
    }
  `.trim();
}
