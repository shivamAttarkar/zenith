import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import type { Actor } from "xstate";
import appMachine from "$lib/machines/app/machine";

export function startRouter(appMachineRef: Actor<typeof appMachine>) {
  appMachineRef.subscribe((snapshot) => {
    if (snapshot.matches("authenticating")) {
      goto(resolve("/auth/login"));
    } else if (snapshot.matches("ready")) {
      goto(resolve("/home"));
    } else {
      goto(resolve("/"));
    }
  });
}
