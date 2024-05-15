export function isValidVariableId(inString: string, subversion?: string) {
  const regex = new RegExp(
    `([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}` +
      `(_[^}]*?)?(?:_percentile_rank|_descriptor)?)`,
    "g"
  );

  return regex.test(inString);
}