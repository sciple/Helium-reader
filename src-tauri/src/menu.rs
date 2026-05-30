use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Runtime,
};

pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&MenuItemBuilder::with_id("menu:new-file", "New File").accelerator("CmdOrCtrl+N").build(app)?)
        .item(&MenuItemBuilder::with_id("menu:open-folder", "Open Folder...").accelerator("CmdOrCtrl+Shift+O").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("menu:save", "Save").accelerator("CmdOrCtrl+S").build(app)?)
        .item(&MenuItemBuilder::with_id("menu:save-as", "Save As...").accelerator("CmdOrCtrl+Shift+S").build(app)?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, None)?)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&PredefinedMenuItem::undo(app, None)?)
        .item(&PredefinedMenuItem::redo(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, None)?)
        .item(&PredefinedMenuItem::copy(app, None)?)
        .item(&PredefinedMenuItem::paste(app, None)?)
        .item(&PredefinedMenuItem::select_all(app, None)?)
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&MenuItemBuilder::with_id("menu:toggle-sidebar", "Toggle Sidebar").accelerator("CmdOrCtrl+B").build(app)?)
        .item(&MenuItemBuilder::with_id("menu:toggle-preview", "Toggle Preview").accelerator("CmdOrCtrl+\\").build(app)?)
        .item(&MenuItemBuilder::with_id("menu:toggle-chat", "Toggle Chat").accelerator("CmdOrCtrl+Shift+L").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("menu:toggle-focus", "Focus Mode").accelerator("F11").build(app)?)
        .build()?;

    let version = app.package_info().version.to_string();
    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&MenuItemBuilder::with_id("about", format!("Helium Reader v{}", version)).enabled(false).build(app)?)
        .build()?;

    MenuBuilder::new(app)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&help_menu)
        .build()
}
