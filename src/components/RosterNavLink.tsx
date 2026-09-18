import { useI18n } from '../context/I18nContext';
import { useNavigation } from '../context/NavigationContext';
import './RosterRegistration.css';

export function RosterNavLink() {
  const { isAr } = useI18n(); const { path, navigate } = useNavigation();
  return <a className="roster-nav-link" href="/join" aria-current={path === '/join' || path === '/artist/register' ? 'page' : undefined} onClick={event => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate('/join'); }
  }}>{isAr ? 'انضم إلى سجل الفنانين' : 'Join Institutional Roster'}</a>;
}
