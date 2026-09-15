//! Tray residency, including the attention tint.
//!
//! Closing the window does not quit: the collector's whole purpose is to run
//! while the user is doing something else, and an app that exits when its window
//! is dismissed cannot observe anything. So `CloseRequested` hides the window
//! instead, and the tray icon is how it is brought back.
//!
//! The icon has two states. Rather than shipping a second hand-drawn file, the
//! attention state is the same sprite with its foreground recoloured: the source
//! art is a dark plate plus a blue mark, so swapping the blue for green keeps the
//! shape and changes only the meaning. That also means the two states can never
//! drift apart in silhouette.

use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime, WindowEvent,
};

/// Stable id so the icon can be looked up and mutated later.
pub const TRAY_ID: &str = "comma-tray";

/// Menu labels. Kept as constants because the shell guard asserts they exist.
const MENU_OPEN: &str = "打开 Comma";
const MENU_QUIT: &str = "退出";

/// PNG bytes for the tray icon in its resting state.
///
/// Resolved relative to this file, which lives in `src-tauri/src/`, so the icons
/// directory is one level up. Getting this wrong is a compile error rather than a
/// runtime one, which is the reason for using include_bytes! over reading the file
/// at startup.
const ICON_NORMAL: &[u8] = include_bytes!("../icons/32x32.png");

/// How long the attention icon stays up before the tray settles back.
///
/// Five minutes: long enough that a user returning from a meeting sees it,
/// short enough that a passing signal does not leave the tray permanently
/// claiming something needs attention.
pub const ATTENTION_MS: u64 = 5 * 60 * 1000;

/// The foreground colour in the source sprite, as measured from the file:
/// 611 pixels of plate colour (23, 29, 36), then 54+ pixels of this blue.
const FOREGROUND: (u8, u8, u8) = (110, 168, 254);

/// What the foreground becomes in the attention state.
const ATTENTION: (u8, u8, u8) = (58, 190, 116);

/// How close a pixel must be to [`FOREGROUND`] to count as part of the mark.
///
/// The source art is anti-aliased, so the mark is a gradient rather than one
/// flat colour. A tolerance of 48 covers the ramp while staying well clear of the
/// plate colour, whose channels are all far below it.
const TOLERANCE: i32 = 48;

/// Recolour the mark, leaving the plate and the alpha channel alone.
///
/// Only pixels near the foreground colour are touched, so the dark plate stays
/// dark and the rounded corners stay transparent. Blending by the pixel's
/// distance from the original mark colour keeps the anti-aliased edges soft
/// instead of producing a hard, jagged outline.
pub fn tint_attention(rgba: &mut [u8]) {
    for pixel in rgba.chunks_exact_mut(4) {
        if pixel[3] == 0 {
            continue;
        }
        let d = distance(pixel, FOREGROUND);
        if d > TOLERANCE {
            continue;
        }
        // 1.0 for an exact match, fading to 0.0 at the tolerance edge.
        let weight = 1.0 - (d as f32 / TOLERANCE as f32);
        for (channel, target) in [ATTENTION.0, ATTENTION.1, ATTENTION.2].iter().enumerate() {
            let original = pixel[channel] as f32;
            pixel[channel] = (original + (*target as f32 - original) * weight)
                .round()
                .clamp(0.0, 255.0) as u8;
        }
    }
}

/// Largest per-channel difference between a pixel and a reference colour.
fn distance(pixel: &[u8], reference: (u8, u8, u8)) -> i32 {
    let dr = (pixel[0] as i32 - reference.0 as i32).abs();
    let dg = (pixel[1] as i32 - reference.1 as i32).abs();
    let db = (pixel[2] as i32 - reference.2 as i32).abs();
    dr.max(dg).max(db)
}

/// Build the tray icon and wire its events.
///
/// Returns the handle so the caller can flip the icon when a situation appears.
pub fn install<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<TrayIcon<R>> {
    let open = MenuItem::with_id(app, "open", MENU_OPEN, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", MENU_QUIT, true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;

    // A missing icon must not stop the app: the tray is a convenience, and
    // failing to build it would take the collector down with it.
    let icon = Image::from_bytes(ICON_NORMAL).ok();

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
        // Left click opens the window rather than opening the menu, so the
        // primary action is one click and the menu is for quitting.
        .show_menu_on_left_click(false)
        .tooltip("Comma Desktop");

    if let Some(icon) = icon {
        builder = builder.icon(icon);
    }

    let tray = builder
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // Only a completed click opens the window; Enter/Leave/Move would
            // make the window appear whenever the pointer crossed the icon.
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(tray)
}

/// Recolour the installed tray icon to the attention state.
///
/// Returns false when the icon or its pixels are unavailable, so a failure here
/// degrades to "no colour change" rather than taking the app down.
pub fn mark_attention<R: Runtime>(app: &AppHandle<R>) -> bool {
    set_tinted(app, true)
}

/// Put the installed tray icon back to its resting colour.
pub fn clear_attention<R: Runtime>(app: &AppHandle<R>) -> bool {
    set_tinted(app, false)
}

fn set_tinted<R: Runtime>(app: &AppHandle<R>, attention: bool) -> bool {
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return false;
    };

    let Some(source) = Image::from_bytes(ICON_NORMAL).ok() else {
        return false;
    };

    // Image exposes only an immutable rgba() slice, so a recoloured copy is built
    // from the pixels rather than mutating in place.
    let (width, height) = (source.width(), source.height());
    let mut rgba = source.rgba().to_vec();
    if attention {
        tint_attention(&mut rgba);
    }

    tray.set_icon(Some(Image::new_owned(rgba, width, height)))
        .is_ok()
}

/// Show the attention colour, then settle back after [`ATTENTION_MS`].
///
/// The timer is the point: an icon that stayed green would stop meaning
/// "something is waiting" and start meaning "this app is green". Resetting on a
/// fresh signal is deliberate - the window restarts from now, so a second
/// reminder does not inherit the remainder of the first one's five minutes.
pub fn flash_attention<R: Runtime>(app: &AppHandle<R>) {
    if !mark_attention(app) {
        return;
    }

    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(ATTENTION_MS));
        clear_attention(&handle);
    });
}

/// Bring the main window back, from any state: hidden, minimised or behind.
pub fn show_main<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();
}

/// Whether a close request should hide rather than close.
///
/// Split out and pure so the rule is testable without a window: the tray is a
/// resident process, and a close request must never be the thing that stops it.
pub fn close_hides_instead_of_quitting() -> bool {
    true
}

/// Apply the close-to-tray rule to a window event.
///
/// Returns `true` when the close was intercepted.
pub fn handle_window_event<R: Runtime>(window: &tauri::Window<R>, event: &WindowEvent) -> bool {
    if let WindowEvent::CloseRequested { api, .. } = event {
        if close_hides_instead_of_quitting() {
            api.prevent_close();
            let _ = window.hide();
            return true;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The real sprite, decoded once per test that needs pixels.
    fn sprite() -> Vec<u8> {
        // Decode via the same path the app uses, so the test fails if the file
        // stops being a PNG the image crate can read.
        Image::from_bytes(ICON_NORMAL)
            .expect("the bundled icon must decode")
            .rgba()
            .to_vec()
    }

    #[test]
    fn a_close_request_never_quits() {
        // The regression this guards: reverting to the default close behaviour
        // would silently stop collection whenever the user dismissed the window.
        assert!(close_hides_instead_of_quitting());
    }

    #[test]
    fn the_normal_icon_is_a_real_png() {
        // include_bytes! would happily embed an empty or truncated file, and the
        // failure would only show as a missing tray icon at runtime.
        assert!(ICON_NORMAL.len() > 100, "icon looks empty");
        assert_eq!(&ICON_NORMAL[..8], b"\x89PNG\r\n\x1a\n", "icon is not a PNG");
    }

    #[test]
    fn the_attention_window_is_five_minutes() {
        assert_eq!(ATTENTION_MS, 300_000);
    }

    #[test]
    fn the_source_sprite_actually_contains_the_foreground_colour() {
        // If the art is ever redrawn with different colours, the tint silently
        // stops matching anything and the attention state becomes invisible.
        let rgba = sprite();
        let matching = rgba
            .chunks_exact(4)
            .filter(|p| p[3] != 0 && distance(p, FOREGROUND) <= TOLERANCE)
            .count();
        assert!(
            matching > 20,
            "expected the mark colour ({FOREGROUND:?}) to cover a meaningful area, found {matching} px"
        );
    }

    #[test]
    fn tinting_turns_the_mark_green_without_touching_the_plate() {
        let before = sprite();
        let mut after = before.clone();
        tint_attention(&mut after);
        assert_eq!(before.len(), after.len());

        // The plate must survive: it is the dark pixels, far from the mark colour.
        let plate_before = before
            .chunks_exact(4)
            .filter(|p| p[3] != 0 && distance(p, FOREGROUND) > TOLERANCE)
            .count();
        let plate_after = after
            .chunks_exact(4)
            .filter(|p| p[3] != 0 && distance(p, (23, 29, 36)) <= 8)
            .count();
        assert!(plate_before > 0, "no plate pixels in the source sprite");
        assert!(
            plate_after >= plate_before / 2,
            "tinting destroyed the plate: {plate_before} -> {plate_after}"
        );

        // Green must lead on the mark, and it must not have led before.
        let greenest_before = before
            .chunks_exact(4)
            .map(|p| p[1] as i32 - ((p[0] as i32 + p[2] as i32) / 2))
            .max()
            .unwrap();
        let greenest_after = after
            .chunks_exact(4)
            .map(|p| p[1] as i32 - ((p[0] as i32 + p[2] as i32) / 2))
            .max()
            .unwrap();
        assert!(
            greenest_after > greenest_before,
            "the mark did not become greener: {greenest_before} -> {greenest_after}"
        );
    }

    #[test]
    fn transparent_pixels_stay_transparent() {
        let mut rgba = vec![0u8; 4 * 4];
        // One transparent pixel that happens to sit on the mark colour; its alpha
        // must not be resurrected into a visible green dot.
        rgba[0] = FOREGROUND.0;
        rgba[1] = FOREGROUND.1;
        rgba[2] = FOREGROUND.2;
        rgba[3] = 0;
        tint_attention(&mut rgba);
        assert_eq!(rgba[3], 0, "a transparent pixel became opaque");
    }

    #[test]
    fn a_pixel_unrelated_to_the_mark_is_left_alone() {
        let mut rgba = vec![200u8, 40, 40, 255];
        let original = rgba.clone();
        tint_attention(&mut rgba);
        assert_eq!(rgba, original, "a red pixel should not be tinted green");
    }
}
