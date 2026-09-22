import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-wrap page-heading">
      <span>♡</span>
      <h1>Esse achadinho se escondeu.</h1>
      <p>A página que você procura não está no catálogo.</p>
      <Link className="primary-button" href="/">
        Voltar ao início ↗
      </Link>
    </div>
  );
}
