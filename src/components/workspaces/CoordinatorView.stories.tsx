import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PROGRAMMES } from '../../data/mockData';
import { CoordinatorView } from './CoordinatorView';

const meta = {
  title: 'Workspaces/Coordinator View',
  component: CoordinatorView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    lang: 'en',
    selectedProgramme: PROGRAMMES[0],
    onNavigateTab: fn(),
  },
} satisfies Meta<typeof CoordinatorView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};