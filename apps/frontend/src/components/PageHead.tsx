type PageHeadProps = {
  title: string;
  content: string;
};

function PageHead({ title, content }: PageHeadProps) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <h2 className="text-3xl font-semibold ">{title}</h2>
      <p className="text-sm opacity-70">{content}</p>
    </div>
  );
}

export default PageHead;
