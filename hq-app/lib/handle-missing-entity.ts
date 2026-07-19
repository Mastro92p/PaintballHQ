export type MissingEntityAction = "update" | "delete";

type HandleMissingEntityOptions = {
  entityName: string;
  action: MissingEntityAction;
  reload: () => Promise<void>;
  onMissing?: () => void;
  notify?: (message: string) => void;
};

export async function handleMissingEntity(
  res: Response,
  options: HandleMissingEntityOptions
): Promise<boolean> {
  if (res.status !== 404) return false;

  const {
    entityName,
    action,
    reload,
    onMissing,
    notify = (message) => alert(message),
  } = options;

  const message =
    action === "delete"
      ? `This ${entityName} was already deleted.`
      : `This ${entityName} no longer exists.`;

  onMissing?.();
  notify(message);

  try {
    await reload();
  } catch (err) {
    console.error(`Failed to reload ${entityName} list after 404`, err);
  }

  return true;
}