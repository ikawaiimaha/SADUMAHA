import type { Meta, StoryObj } from '@storybook/react-vite';
import { CuratorialCanvas } from './CuratorialCanvas';

const meta = {
  title: 'Workspaces/Curatorial Canvas',
  component: CuratorialCanvas,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CuratorialCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};