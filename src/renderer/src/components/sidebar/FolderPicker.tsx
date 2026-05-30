import './FolderPicker.css'
import { useFileSystem } from '../../hooks/useFileSystem'

export default function FolderPicker() {
  const { openFolder } = useFileSystem()
  return (
    <div className="folder-picker">
      <div className="folder-picker__icon">📁</div>
      <p className="folder-picker__hint">No folder open</p>
      <button className="folder-picker__btn" onClick={openFolder}>
        Open Folder
      </button>
    </div>
  )
}
