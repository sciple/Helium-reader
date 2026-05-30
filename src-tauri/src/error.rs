use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Io(std::io::Error),
    AccessDenied(String),
    Other(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Io(e) => write!(f, "IO error: {}", e),
            AppError::AccessDenied(p) => write!(f, "Access denied: {}", p),
            AppError::Other(s) => write!(f, "{}", s),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e)
    }
}

impl From<AppError> for String {
    fn from(e: AppError) -> Self {
        e.to_string()
    }
}
