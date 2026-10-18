use std::process;

use lab_wire::amount_digits;

pub fn digits(raw: &str) -> bool {
    regex::Regex::new(r"^[0-9]+$")
        .map(|pattern| pattern.is_match(raw))
        .unwrap_or(false)
}

pub fn process_id() -> u32 {
    nix::unistd::getpid().as_raw() as u32
}

pub fn runtime_ready() -> bool {
    tokio::runtime::Builder::new_current_thread()
        .build()
        .is_ok()
}

pub fn push_code(code: u32) -> usize {
    let mut items: smallvec::SmallVec<[u32; 4]> = smallvec::SmallVec::new();
    items.push(code);
    items.len()
}

pub fn describe(raw: &str) -> String {
    format!(
        "pid={} digits={} wire={} rt={}",
        process_id(),
        digits(raw),
        amount_digits(raw),
        runtime_ready()
    )
}

pub fn current() -> u32 {
    process::id()
}
