import type { Meta, StoryObj } from '@storybook/react-vite';

import { InboxModal } from './InboxModal';

const meta = {
  title: 'Workspaces/InboxModal',
  component: InboxModal,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof InboxModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
};
