import Page, {generateMetadata as metadata} from "@/components/pages/collection";
export {generateStaticParams} from "@/components/pages/collection";
type Props = {params:Promise<{slug:string}>};
export function generateMetadata(props:Props) {return metadata(props,"pt");}
export default function Route(props:Props) {return Page(props,"pt");}
