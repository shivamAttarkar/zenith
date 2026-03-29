use keyring::Entry;
use rand::distr::{Alphanumeric, SampleString};

pub fn get_or_create_password() -> Result<String, keyring::Error> {
    let entry = Entry::new("zenith", "stronghold-password")?;

    match entry.get_password() {
        Ok(password) => Ok(password),
        Err(keyring::Error::NoEntry) => {
            let password = Alphanumeric.sample_string(&mut rand::rng(), 32);
            entry.set_password(&password)?;
            Ok(password)
        }
        Err(e) => Err(e),
    }
}
