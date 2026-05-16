export async function resolveAcceptLanguage(
  provider?: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>,
): Promise<string | undefined> {
  if (!provider) return undefined;
  const v = await provider();
  return v ?? undefined;
}
