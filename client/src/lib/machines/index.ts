import { createActor } from "xstate";
import appMachine from "$lib/machines/app/machine";

const appMachineRef = createActor(appMachine);
appMachineRef.start();

export { appMachineRef };
