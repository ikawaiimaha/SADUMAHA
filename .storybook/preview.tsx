import type { Preview } from '@storybook/react-vite';
import { I18nProvider } from '../src/context/I18nContext';
import { WorkspaceProvider } from '../src/context/WorkspaceContext';
import '../src/index.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <I18nProvider initialLang="en">
        <WorkspaceProvider initialRole="COORDINATOR" initialExperienceMode="story">
          <Story />
        </WorkspaceProvider>
      </I18nProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;