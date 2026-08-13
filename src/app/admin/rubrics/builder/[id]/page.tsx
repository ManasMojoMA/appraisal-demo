import RubricBuilder from "../page";

export default function EditRubricBuilder({ params }: { params: Promise<{ id: string }> }) {
  return <RubricBuilder params={params} />;
}
