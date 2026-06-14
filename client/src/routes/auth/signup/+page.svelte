<script lang="ts">
    import { createForm } from "@tanstack/svelte-form";
    import Input from "$lib/components/Input/Input.svelte";
    import Button from "$lib/components/Button/Button.svelte";
    import EmailIcon from "$lib/icons/email.svg?component";
    import LockIcon from "$lib/icons/lock.svg?component";
    import UserIcon from "$lib/icons/user.svg?component";
    import KeyIcon from "$lib/icons/key.svg?component";
    import ErrorIcon from "$lib/icons/error.svg?component";
    import PasswordInput from "$lib/components/Input/PasswordInput.svelte";
    import { signupFormSchema } from "$lib/utils/zodSchemas";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { get, derived } from "svelte/store";
    import { appMachineRef } from "$lib/machines/index";
    import { useSelector } from "@xstate/svelte";

    const authMachineStore = useSelector(
        appMachineRef,
        (snapshot) => snapshot.context.authRef,
    );
    const authContext = derived(
        authMachineStore,
        ($authRef, set) => {
            if (!$authRef) return;
            const sub = $authRef.subscribe((snap) => set(snap.context));
            return () => sub.unsubscribe();
        },
        { loading: false } as { error?: string; loading: boolean },
    );

    const form = createForm(() => ({
        defaultValues: {
            email: "",
            name: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            get(authMachineStore)?.send({
                type: "signup",
                email: value.email,
                name: value.name,
                password: value.password,
            });
        },
    }));
</script>

<div
    class="flex min-h-screen w-screen items-center justify-center overflow-y-auto p-4 pb-15"
>
    <div class="container max-w-sm">
        <div class="flex flex-col gap-2 mb-2">
            <h2 class="text-center text-2xl font-bold">Create your account</h2>
            <p class="text-center text-sm">
                Already have an account? <button
                    onclick={() => goto(resolve("/auth/login"))}
                    class="link link-hover">Login</button
                >
            </p>
        </div>
        {#if $authContext.error}
            <p
                class="bg-error gap-2 inline-flex items-center rounded-box w-full my-2 p-2 px-3"
            >
                <ErrorIcon class="size-6" />{$authContext.error}
            </p>
        {/if}
        <form
            onsubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
            }}
            class="flex flex-col gap-2"
        >
            <form.Field
                name="email"
                validators={{ onBlur: signupFormSchema.email }}
            >
                {#snippet children(field)}
                    <Input
                        icon={EmailIcon}
                        placeholder="mail@site.com"
                        legend="Email"
                        value={field.state.value}
                        oninput={(e) =>
                            field.handleChange(e.currentTarget.value)}
                        onblur={() => field.handleBlur()}
                        error={field.state.meta.errors[0]?.message ?? ""}
                        success={field.state.meta.isBlurred &&
                            !field.state.meta.errors.length}
                    />
                {/snippet}
            </form.Field>
            <form.Field
                name="name"
                validators={{ onBlur: signupFormSchema.username }}
            >
                {#snippet children(field)}
                    <Input
                        icon={UserIcon}
                        placeholder="name"
                        legend="Name"
                        value={field.state.value}
                        oninput={(e) =>
                            field.handleChange(e.currentTarget.value)}
                        onblur={() => field.handleBlur()}
                        error={field.state.meta.errors[0]?.message ?? ""}
                        success={field.state.meta.isBlurred &&
                            !field.state.meta.errors.length}
                    />
                {/snippet}
            </form.Field>
            <form.Field
                name="password"
                validators={{ onBlur: signupFormSchema.password }}
            >
                {#snippet children(field)}
                    <PasswordInput
                        icon={LockIcon}
                        value={field.state.value}
                        oninput={(e) =>
                            field.handleChange(e.currentTarget.value)}
                        placeholder="******************"
                        onblur={() => field.handleBlur()}
                        legend="Password"
                        error={field.state.meta.errors[0]?.message ?? ""}
                        success={field.state.meta.isBlurred &&
                            !field.state.meta.errors.length}
                    />
                {/snippet}
            </form.Field>
            <Button width="fill" class="mt-4" type="submit" loading={$authContext.loading}
                >Sign up</Button
            >
        </form>
        <div class="divider">Or continue with</div>
        <div class="flex">
            <Button icon={KeyIcon} variant="ghost" width="fill" style="outline"
                >Continue with Passkey</Button
            >
        </div>
    </div>
</div>
