import Page, {generateMetadata as metadata} from "@/components/pages/product";
export {generateStaticParams} from "@/components/pages/product";
type Props = {params:Promise<{slug:string}>};
export function generateMetadata(props:Props) {return metadata(props,"en");}
export default function Route(props:Props) {return Page(props,"en");}
