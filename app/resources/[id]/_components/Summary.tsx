function Summary({ summary }: { summary: string }) {
  return (
    <p className="text-muted-foreground">{summary || "No summary available"}</p>
  );
}

export default Summary;
