import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// English source control: bypass the presentation adapter when deliberately capturing references.
export default defineConfig({plugins:[react({jsxImportSource:'react'})],resolve:{alias:{'@ml-i18n':path.resolve('src/i18n')}},server:{watch:{ignored:['**/*.local/**']}}});
