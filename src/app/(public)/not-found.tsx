import Link from "next/link";
import {translate,localizedPath} from "@/lib/i18n";
export default function NotFound() {const t=(s:string)=>translate("pt",s); return <div className="page-wrap page-heading"><span>♡</span><h1>{t("Esse achadinho se escondeu.")}</h1><p>{t("A página que você procura não está no catálogo.")}</p><Link className="primary-button" href={localizedPath("/","pt")}>{t("Voltar ao início ↗")}</Link></div>;}
