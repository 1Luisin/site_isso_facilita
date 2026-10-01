"use client";
import { usePathname } from "next/navigation";
import { localizedPath, type Language } from "@/lib/i18n";

function Flag({ country }: {country: "br" | "us"}) {
  return country === "br" ? (
    <svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" fill="#229e45"/><path d="M14 2 26 10 14 18 2 10Z" fill="#ffdc43"/><circle cx="14" cy="10" r="5" fill="#23519b"/><path d="M9.2 8.5Q14 7.5 18.6 11.5" fill="none" stroke="white" strokeWidth="1.2"/></svg>
  ) : (
    <svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" fill="white"/>{[0,3.08,6.16,9.24,12.32,15.4,18.48].map(y=><rect key={y} y={y} width="28" height="1.54" fill="#bb3445"/>)}<rect width="12" height="10.8" fill="#294378"/>{[2,5.3,8.6].flatMap(y=>[2,5,8,10.5].map(x=><circle key={`${x}-${y}`} cx={x} cy={y} r=".55" fill="white"/>))}</svg>
  );
}
export function LanguageChoices({language, path = "/"}: {language: Language; path?: string}) {
  const clean = path === "/en" ? "/" : path.replace(/^\/en\//,"/");
  // Admin remains in Portuguese; do not advertise a non-existent English admin.
  const target = clean.startsWith("/admin") ? "/" : clean;
  return <nav className="language-switcher" aria-label={language === "en" ? "Choose language" : "Escolher idioma"}>
    {([['pt','br','Brasil — Português'],['en','us','United States — English']] as const).map(([lang,country,label])=>
      <a key={lang} className="language-choice" href={localizedPath(target,lang)} hrefLang={lang === 'pt' ? 'pt-BR' : 'en-US'} aria-label={label} title={label} aria-current={language===lang ? "true" : undefined}
        onClick={event=>{event.currentTarget.href=localizedPath(target,lang)+window.location.search+window.location.hash;}}>
        <span className="flag-circle"><Flag country={country}/></span><span className="language-abbreviation">{lang.toUpperCase()}</span>
      </a>)}
  </nav>;
}
export function LanguageSwitcher({language}: {language: Language}) {
  const path = usePathname();
  return <LanguageChoices language={language} path={path}/>;
}
