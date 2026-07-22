import { describe, expect, it } from "vitest";

import { pickNestedMessageNamespaces } from "@/i18n/client-messages";

const messages = {
  auth: {
    login: {
      title: "Iniciar sesión",
    },
  },
  dashboard: {
    actions: {
      signOut: "Cerrar sesión",
    },
  },
  pools: {
    errors: {
      join_failed: "No pudimos completar el ingreso.",
    },
    join: {
      title: "Unirme a una quiniela",
    },
    status: {
      retry: "Reintentar",
    },
  },
};

describe("client message selection", () => {
  it("selects only requested groups inside a namespace", () => {
    expect(
      pickNestedMessageNamespaces(messages, "pools", ["join", "errors"]),
    ).toEqual({
      pools: {
        join: messages.pools.join,
        errors: messages.pools.errors,
      },
    });
  });

  it("rejects missing or scalar namespaces", () => {
    expect(() =>
      pickNestedMessageNamespaces(messages, "home", ["metadata"]),
    ).toThrow('Message namespace "home" is not an object.');
    expect(() =>
      pickNestedMessageNamespaces(
        { pools: { status: "Invalid shape" } },
        "pools",
        ["status"],
      ),
    ).toThrow('Message namespace "status" is not an object.');
  });
});
