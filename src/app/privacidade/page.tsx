import Link from "next/link";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Política de Privacidade",
  description: "Como o Isso Facilita utiliza analytics e links de afiliado.",
  path: "/privacidade",
});

export default function PrivacyPage() {
  return (
    <div className="page-wrap">
      <Link href="/" className="back-link">← Voltar ao catálogo</Link>
      <div className="page-heading"><h1>Política de Privacidade</h1></div>
      <section className="section">
        <h2>Uso do site e analytics</h2>
        <p>Utilizamos ferramentas de analytics para entender como o site é usado e melhorar a seleção de achadinhos. Quando habilitado, o Google Analytics recebe informações técnicas e de navegação, como páginas visitadas, origem do acesso, tipo de dispositivo e cliques em produtos.</p>
        <p>O Google Analytics pode usar cookies para reconhecer navegadores e sessões. Você pode bloquear ou apagar cookies nas configurações do seu navegador. Consulte também a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade do Google</a>.</p>
        <p>Não enviamos os textos digitados na busca nem dados de identificação pessoal nos eventos de clique em produtos. A busca funciona localmente, e o site não exige cadastro.</p>
      </section>
      <section className="section">
        <h2>Links de afiliado</h2>
        <p>Alguns links são de afiliado. O Isso Facilita pode receber uma comissão quando uma compra é realizada, sem aumentar o preço para você.</p>
        <p>Ao acessar uma loja ou rede social, você passa a utilizar um serviço externo, sujeito às políticas de privacidade desse serviço.</p>
      </section>
    </div>
  );
}
