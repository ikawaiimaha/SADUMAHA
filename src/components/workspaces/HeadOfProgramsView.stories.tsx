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

export const DispatchNewInvitation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByPlaceholderText(/e.g. youssef nabhan/i), 'Amal Al Hashimi');
    await userEvent.type(canvas.getByPlaceholderText(/artist@studio.art/i), 'amal@studio.art');
    await userEvent.click(canvas.getByRole('button', { name: /generate & dispatch secure link/i }));
    await waitFor(() => expect(canvas.getByText('Amal Al Hashimi')).toBeInTheDocument());
  },
};
