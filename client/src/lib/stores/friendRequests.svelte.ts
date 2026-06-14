import { client } from '$lib/client';
import { generic_error } from '$lib/constants';

type FriendRequests = Awaited<
  ReturnType<(typeof client.api.v1)['friend-request']['find']['get']>
>['data'];

function createFriendRequestsStore() {
  let data = $state<FriendRequests>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
 
  async function load() {
    loading = true;
    error = null;

    const res = await client.api.v1['friend-request'].find.get();

    if (res.error) {
      if (res.error.status === 401) {
        error = res.error.value;
      } else {
        error = res.error.value?.message || generic_error;
      }
      loading = false;
      return;
    }

    data = res.data;
    loading = false;
  }

  return {
    get data() {
      return data;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    load,
    invalidate: load
  };
}

export const friendRequests = createFriendRequestsStore();
