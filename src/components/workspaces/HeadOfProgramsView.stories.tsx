import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { HeadOfProgramsView } from './HeadOfProgramsView';

const meta = {
  title: 'Workspaces/HeadOfProgramsView',
  component: HeadOfProgramsView,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof HeadOfProgramsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dispatched: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /approve & dispatch/i }));
    await waitFor(() => expect(canvas.getByRole('button', { name: /^dispatched$/i })).toBeInTheDocument());
  },
};
