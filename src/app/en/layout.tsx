import SiteLayout, { siteMetadata } from "@/components/site-layout";
export const metadata = siteMetadata("en");
export default function Layout({children}: {children:React.ReactNode}) { return <SiteLayout language="en">{children}</SiteLayout>; }
