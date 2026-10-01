import { translate, localizedPath, type Language } from "@/lib/i18n";
import Link from "next/link";
import { pageMetadata } from "@/lib/site";

export function localizedMetadata(language: Language = "pt") { const t = (text:string) => translate(language,text); return pageMetadata({
  title: t("Política de Privacidade"),
  description: t("Como o Isso Facilita utiliza analytics e links de afiliado."),
  path: localizedPath("/privacidade", language), language,
}); }

export default function PrivacyPage({language = "pt"}: {language?: Language} = {}) {
 const t = (text:string) => translate(language,text);
  return (
    <div className="page-wrap">
      <Link href={localizedPath("/", language)} className="back-link">{t("← Voltar ao catálogo")}</Link>
      <div className="page-heading"><h1>{t("Política de Privacidade")}</h1></div>
      <section className="section">
        <h2>{t("Uso do site e analytics")}</h2>
        <p>{t("Utilizamos ferramentas de analytics para entender como o site é usado e melhorar a seleção de achadinhos. Quando habilitado, o Google Analytics recebe informações técnicas e de navegação, como páginas visitadas, origem do acesso, tipo de dispositivo e cliques em produtos.")}</p>
        <p>{t("O Google Analytics pode usar cookies para reconhecer navegadores e sessões. Você pode bloquear ou apagar cookies nas configurações do seu navegador. Consulte também a")}{" "}<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">{t("Política de Privacidade do Google")}</a>.</p>
        <p>{t("Não enviamos os textos digitados na busca nem dados de identificação pessoal nos eventos de clique em produtos. A busca funciona localmente, e o site não exige cadastro.")}</p>
      </section>
      <section className="section">
        <h2>{t("Links de afiliado")}</h2>
        <p>{t("Alguns links são de afiliado. O Isso Facilita pode receber uma comissão quando uma compra é realizada, sem aumentar o preço para você.")}</p>
        <p>{t("Ao acessar uma loja ou rede social, você passa a utilizar um serviço externo, sujeito às políticas de privacidade desse serviço.")}</p>
      </section>
    </div>
  );
}
