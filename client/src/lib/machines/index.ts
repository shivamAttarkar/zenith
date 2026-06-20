import { createActor } from "xstate";
import appMachine from "$lib/machines/app/machine";
import { friendRequestMachine } from "$lib/machines/friendRequest/machine";

const appMachineRef = createActor(appMachine);
appMachineRef.start();

const friendRequestActor = createActor(friendRequestMachine);
friendRequestActor.start();

export { appMachineRef, friendRequestActor };
