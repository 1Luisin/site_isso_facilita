import Page, {generateMetadata as metadata} from "@/components/pages/content";
export {generateStaticParams} from "@/components/pages/content";
type Props = {params:Promise<{codigo:string}>};
export function generateMetadata(props:Props) {return metadata(props,"pt");}
export default function Route(props:Props) {return Page(props,"pt");}
