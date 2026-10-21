import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes/router'
import { prepareRoute, restoreLocale } from './i18n/config'

document.documentElement.lang = 'en-IN';
document.documentElement.dir = 'ltr';
void prepareRoute(router.state.location.pathname).then(restoreLocale).catch(() => undefined);
router.subscribe(state => { void prepareRoute(state.location.pathname).catch(() => undefined); });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
