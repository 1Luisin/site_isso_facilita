# Português e inglês no site público

O seletor Brasil/Estados Unidos fica no cabeçalho, com bandeiras SVG locais, contorno circular discreto, foco por teclado e indicação do idioma selecionado. Português mantém as URLs existentes; inglês usa `/en`, preservando os slugs. A seleção acompanha a navegação pelos links e a troca mantém página, query string e fragmento. Não há cookies novos, serviço externo de tradução nem redirecionamento por localização.

Os layouts raiz de cada idioma geram `html lang` correto no servidor. As páginas compartilham componentes e o mesmo snapshot cacheado/RLS. O adapter de apresentação traduz nomes, descrições, categorias, coleções e publicações, sem modificar dados no Supabase, imagens, URLs afiliadas ou o admin. Conteúdo original escrito dentro das imagens permanece parte da imagem, assim como a marca Isso Facilita!.

`src/lib/i18n.ts` contém traduções inglesas revisadas, por texto original. Todo conteúdo público existente foi coberto. Quando textos editoriais novos forem cadastrados ou alterados pelo admin, suas traduções devem ser adicionadas ao dicionário; até isso acontecer, o texto original é preservado, sem reutilizar traduções desatualizadas ou inventar informação. Tradução automática/editorial pelo admin não faz parte desta implementação. `npm run test:i18n` verifica cobertura do catálogo estático e regras de idioma. O catálogo Supabase atual também deve ser revisado ao adicionar traduções.

Canonical, description, títulos, Open Graph textual, `hreflang` e sitemap incluem as versões por idioma. As imagens editoriais e artes sociais existentes são preservadas. `/admin` continua em português, protegido e fora do sitemap. A troca no cabeçalho do admin leva ao site público no idioma escolhido.
