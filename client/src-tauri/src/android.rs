use jni::objects::JObject;
use jni::JNIEnv;

#[no_mangle]
pub unsafe extern "C" fn Java_io_zenith_client_MainActivity_initNdkContext<'local>(
    env: JNIEnv<'local>,
    activity: JObject<'local>,
) {
    let vm = env.get_java_vm().unwrap();
    let context = env.new_global_ref(activity).unwrap();
    ndk_context::initialize_android_context(
        vm.get_java_vm_pointer() as *mut std::ffi::c_void,
        context.as_raw() as *mut std::ffi::c_void,
    );
    std::mem::forget(context);
}
