import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PROGRAMMES } from '../../data/mockData';
import { ArchiveView } from './ArchiveView';

const meta = {
  title: 'Workspaces/Archive View',
  component: ArchiveView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    lang: 'en',
    selectedProgramme: PROGRAMMES[0],
    onNavigateTab: fn(),
  },
} satisfies Meta<typeof ArchiveView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};