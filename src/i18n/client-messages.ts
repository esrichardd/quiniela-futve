import type { AbstractIntlMessages } from "next-intl";

function getMessageGroup(
  messages: AbstractIntlMessages,
  namespace: string,
): AbstractIntlMessages {
  const group = messages[namespace];

  if (!group || typeof group === "string") {
    throw new Error(`Message namespace "${namespace}" is not an object.`);
  }

  return group;
}

export function pickNestedMessageNamespaces(
  messages: AbstractIntlMessages,
  namespace: string,
  nestedNamespaces: ReadonlyArray<string>,
): AbstractIntlMessages {
  const parent = getMessageGroup(messages, namespace);

  return {
    [namespace]: Object.fromEntries(
      nestedNamespaces.map((nestedNamespace) => [
        nestedNamespace,
        getMessageGroup(parent, nestedNamespace),
      ]),
    ),
  };
}
