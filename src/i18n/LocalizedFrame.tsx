import { useEffect, useRef, type IframeHTMLAttributes, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { i18n } from './config';
import { localizeEmbeddedDocument } from './embedded-document';

export function LocalizedFrame({ original }: { original: IframeHTMLAttributes<HTMLIFrameElement> & {ref?: Ref<HTMLIFrameElement>} }) {
  const { t } = useTranslation('common', { i18n, useSuspense:false });
  const adapter = useRef<ReturnType<typeof localizeEmbeddedDocument> | null>(null);
  useEffect(() => { adapter.current?.refresh(); }, [t]);
  useEffect(() => () => adapter.current?.dispose(), []);
  return <iframe {...original} data-i18n-frame-managed onLoad={(event: React.SyntheticEvent<HTMLIFrameElement>) => {
    original.onLoad?.(event);
    adapter.current?.dispose();
    adapter.current = null;
    try {
      const document = event.currentTarget.contentDocument;
      if (document?.documentElement) adapter.current = localizeEmbeddedDocument(document);
    } catch { /* Cross-origin frames keep their own language and security boundary. */ }
  }} />;
}
