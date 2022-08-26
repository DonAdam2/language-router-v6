import { createContext, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
//constants
import { isAuthenticated } from '@/ts/constants/Helpers';
//routing helpers
import { getDefaultLanguage } from '@/ts/routing/routingConstants/RoutingHelpers';
//routes
import { getHomePageUrl, getLoginPageUrl } from '@/ts/routing/routingConstants/AppUrls';
import { privateRoutes, publicRoutes } from '@/ts/routing/routingConstants/RoutesConfig';
//route guards
import PublicRouteGuard from '@/ts/routing/guards/PublicRouteGuard';
import PrivateRouteGuard from '@/ts/routing/guards/PrivateRouteGuard';
import RestrictedRouteGuard from '@/ts/routing/guards/RestrictedRouteGuard';
//root component
import App from '../../App';
//pages
import NotFoundPage from '@/ts/containers/pages/NotFoundPage';
//components
import LoadingIcon from '@/ts/components/shared/LoadingIcon';

export const LocaleContext = createContext({
  locale: '',
  // eslint-disable-next-line
  setLocale: (newLocale: string) => {},
});

const LangRouter = () => {
  const { i18n } = useTranslation(),
    { pathname, search, hash } = useLocation(),
    navigate = useNavigate(),
    availableLocales = ['en', 'ar'],
    defaultLocale = (
      getDefaultLanguage() === 'en' || getDefaultLanguage() === 'ar' ? getDefaultLanguage() : 'en'
    ) as string,
    pathnameLocale = pathname.substring(1, 3).toLowerCase(),
    [locale, setLocale] = useState(defaultLocale),
    loaderTimerRef = useRef<any>(),
    [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loaderTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      clearTimeout(loaderTimerRef.current);
    }, 300);
  }, []);

  useEffect(() => {
    if (availableLocales.includes(pathnameLocale)) {
      updateLocale(pathnameLocale);
    } else if (pathname === '/') {
      updateLocale(defaultLocale);
    }
    // eslint-disable-next-line
  }, [pathname]);

  useEffect(() => {
    let lang = defaultLocale;

    if (availableLocales.includes(pathnameLocale)) {
      lang = pathnameLocale;
      setLanguageHandler(lang);
    } else if (pathname === '/') {
      setLanguageHandler(lang);
    }
    // eslint-disable-next-line
  }, [locale]);

  const setLanguageHandler = (lang: string) => {
    if (lang === 'en') {
      i18n.changeLanguage('en-US');
    } else {
      i18n.changeLanguage('ar-SA');
    }
  };

  const updateLocale = (newLocale: string) => {
    const newPath = `/${newLocale}` + pathname.substring(3);

    if (locale !== newLocale) {
      if (newPath === `/${newLocale}/` || newPath === `/${newLocale}` || pathname === '/') {
        navigate(getHomePageUrl(newLocale));
      } else {
        navigate(`${newPath}${hash}${search}`);
      }
      setLocale(newLocale);
    } else if (newPath === `/${newLocale}/` || newPath === `/${newLocale}` || pathname === '/') {
      if (isAuthenticated()) {
        navigate(getHomePageUrl(newLocale));
      } else {
        navigate(getLoginPageUrl(newLocale));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loader-wrapper">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: updateLocale }}>
      <Routes>
        <Route path={`/${locale}`} element={<App />}>
          {publicRoutes.map((el, i) => (
            <Route
              key={i}
              path={el.path(locale)}
              element={
                <PublicRouteGuard
                  restricted={el.restricted}
                  redirect={el.redirect ? el.redirect(locale) : undefined}
                >
                  {el.element}
                </PublicRouteGuard>
              }
            />
          ))}

          {privateRoutes.map((el, i) => (
            <Route
              key={i}
              path={el.path(locale)}
              element={
                el.permissions ? (
                  <RestrictedRouteGuard requiredPermissions={el.permissions}>
                    {el.element}
                  </RestrictedRouteGuard>
                ) : (
                  <PrivateRouteGuard>{el.element}</PrivateRouteGuard>
                )
              }
            >
              {el.children &&
                el.children.map((innerEl, innerI) => (
                  <Route key={innerI} path={innerEl.path(locale)} element={innerEl.element} />
                ))}
            </Route>
          ))}
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </LocaleContext.Provider>
  );
};

export default LangRouter;
