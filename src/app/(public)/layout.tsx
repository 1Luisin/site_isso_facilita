import SiteLayout, { siteMetadata } from "@/components/site-layout";
export const metadata = siteMetadata("pt");
export default function Layout({children}: {children:React.ReactNode}) { return <SiteLayout language="pt">{children}</SiteLayout>; }
