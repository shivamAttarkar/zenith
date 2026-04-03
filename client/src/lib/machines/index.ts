import { createActor } from 'xstate';
import { createSkyInspector } from '@statelyai/inspect';
import { AppMachine } from './app/machine';
import { settings } from '$lib/persistance/settings';
import { get } from 'svelte/store';

const inspect = get(settings).inspectEnabled
  ? createSkyInspector({ maxDeferredEvents: 500 }).inspect
  : undefined;

export const appMachine = createActor(AppMachine, { inspect });

export function startMachine() {
  appMachine.start();
}
