<script lang="ts">
  import { createForm } from '@tanstack/svelte-form';
  import { derived } from 'svelte/store';
  import { appMachine } from '$lib/machines';
  import { useSelector } from '@xstate/svelte';
  import type { ActorRefFrom } from 'xstate';
  import type { AuthMachine } from '$lib/machines/auth/machine';
  import { emailSchema, passwordSchema, usernameSchema } from '$lib/zod/schemas';
  import MdiEmailOutline from '~icons/mdi/email-outline';
  import MdiKeyOutline from '~icons/mdi/key-outline';
  import MdiAccountOutline from '~icons/mdi/account-outline';
  import MdiVisibilityOutline from '~icons/mdi/visibility-outline';
  import MdiVisibilityOffOutline from '~icons/mdi/visibility-off-outline';

  const authActor = useSelector(
    appMachine,
    (state) => state.children['AuthMachine'] as ActorRefFrom<typeof AuthMachine> | undefined
  );
  const isLoading = derived(
    authActor,
    ($actor) => $actor?.getSnapshot().matches('signingUp') || false
  );

  let passwordVisible = $state(false);

  const form = createForm(() => ({
    defaultValues: { username: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      $authActor?.send({
        type: 'signup',
        name: value.username,
        email: value.email,
        password: value.password
      });
    }
  }));
</script>

<div class="flex h-screen w-screen items-center justify-center p-4">
  <div class="container max-w-sm">
    <div class="flex flex-col gap-2">
      <h2 class="text-center text-2xl font-bold">Create an account</h2>
      <p class="text-center text-sm">
        Already have an account?
        <button class="link link-hover" onclick={() => $authActor?.send({ type: 'moveToLogin' })}>
          Login
        </button>
      </p>
    </div>

    <form
      class="mt-4 flex flex-col"
      onsubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="username" validators={{ onBlur: usernameSchema }}>
        {#snippet children(field)}
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Username</legend>
            <label
              class="input w-full"
              class:border-error={field.state.meta.errors.length}
              class:outline-error={field.state.meta.errors.length}
            >
              <MdiAccountOutline class="size-5" />
              <input
                type="text"
                placeholder="username"
                name={field.name}
                value={field.state.value}
                onblur={field.handleBlur}
                oninput={(e) => field.handleChange(e.currentTarget.value)}
              />
            </label>
            <p class="text-xs text-error" class:hidden={!field.state.meta.errors.length}>
              {field.state.meta.errors.at(0)?.message}
            </p>
          </fieldset>
        {/snippet}
      </form.Field>

      <form.Field name="email" validators={{ onBlur: emailSchema }}>
        {#snippet children(field)}
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Email</legend>
            <label
              class="input w-full"
              class:border-error={field.state.meta.errors.length}
              class:outline-error={field.state.meta.errors.length}
            >
              <MdiEmailOutline class="size-5" />
              <input
                type="email"
                placeholder="mail@site.com"
                name={field.name}
                value={field.state.value}
                onblur={field.handleBlur}
                oninput={(e) => field.handleChange(e.currentTarget.value)}
              />
            </label>
            <p class="text-xs text-error" class:hidden={!field.state.meta.errors.length}>
              {field.state.meta.errors.at(0)?.message}
            </p>
          </fieldset>
        {/snippet}
      </form.Field>

      <form.Field name="password" validators={{ onBlur: passwordSchema }}>
        {#snippet children(field)}
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Password</legend>
            <label
              class="input w-full"
              class:border-error={field.state.meta.errors.length}
              class:outline-error={field.state.meta.errors.length}
            >
              <MdiKeyOutline class="size-5" />
              <input
                type={passwordVisible ? 'text' : 'password'}
                placeholder="*******************"
                name={field.name}
                value={field.state.value}
                onblur={field.handleBlur}
                oninput={(e) => field.handleChange(e.currentTarget.value)}
              />
              {#if field.state.value.length > 0}
                <button type="button" onclick={() => (passwordVisible = !passwordVisible)}>
                  {#if passwordVisible}
                    <MdiVisibilityOutline class="btn btn-circle btn-ghost btn-xs" />
                  {:else}
                    <MdiVisibilityOffOutline class="btn btn-circle btn-ghost btn-xs" />
                  {/if}
                </button>
              {/if}
            </label>
            <p class="text-xs text-error" class:hidden={!field.state.meta.errors.length}>
              {field.state.meta.errors.at(0)?.message}
            </p>
          </fieldset>
        {/snippet}
      </form.Field>

      <button type="submit" class="btn mt-4 btn-block btn-primary" disabled={$isLoading}>
        {#if $isLoading}
          <span class="loading loading-spinner"></span>
          loading
        {:else}
          Signup
        {/if}
      </button>
    </form>
  </div>
</div>
