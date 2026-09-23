import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { CommitteeView } from './CommitteeView';

const meta = {
  title: 'Workspaces/CommitteeView',
  component: CommitteeView,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof CommitteeView>;

export default meta;
type Story = StoryObj<typeof meta>;

// State 1: locked workspace showing only the mandatory COI declaration.
export const PendingCOI: Story = {
  name: 'State 1 — Pending COI Declaration',
};

// State 2: COI cleared, assessment tools and nomination builder entry point unlocked.
export const ActiveAssessment: Story = {
  name: 'State 2 — Active Assessment Workspace',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /i declare no conflict of interest/i }));
    await waitFor(() => expect(canvas.getByRole('button', { name: /build new nomination/i })).toBeInTheDocument());
  },
};

// State 3: decision signed and submitted, dossier locked read-only.
export const DossierLocked: Story = {
  name: 'State 3 — Cryptographic Closeout (Locked)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /i declare no conflict of interest/i }));
    await userEvent.click(await canvas.findByRole('tab', { name: /final decision/i }));
    await userEvent.click(await canvas.findByRole('button', { name: /^approve/i }));
    await userEvent.click(canvas.getByRole('button', { name: /sign & submit decision/i }));
    await waitFor(
      () => expect(canvas.getByRole('button', { name: /decision locked/i })).toBeDisabled(),
      { timeout: 3000 }
    );
  },
};
