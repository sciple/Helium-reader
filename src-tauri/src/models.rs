use serde::Serialize;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadFileResult {
    pub content: String,
    pub path: String,
    pub mtime: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteFileResult {
    pub success: bool,
    pub path: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileChangedPayload {
    pub path: String,
    pub event: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFileResult {
    pub path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameResult {
    pub new_path: String,
}

