// Keyboard utility functions for shortcut detection

// event.codeから実際のキー名を取得
function getKeyFromCode(code) {
  if (!code) return null;
  
  // Digit0-Digit9 → 0-9
  if (code.startsWith('Digit')) {
    return code.replace('Digit', '');
  }
  
  // KeyA-KeyZ → A-Z
  if (code.startsWith('Key')) {
    return code.replace('Key', '');
  }
  
  // Numpad0-Numpad9 → 0-9
  if (code.startsWith('Numpad')) {
    return code.replace('Numpad', '');
  }
  
  // その他の特殊キーはcodeをそのまま使用
  // ただし、よく使われるキーは読みやすい名前に変換
  const keyMap = {
    'Space': 'Space',
    'Enter': 'Enter',
    'Escape': 'Escape',
    'Tab': 'Tab',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'ArrowUp': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    'ArrowLeft': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
    'Home': 'Home',
    'End': 'End',
    'PageUp': 'PageUp',
    'PageDown': 'PageDown',
    'Insert': 'Insert',
    'F1': 'F1',
    'F2': 'F2',
    'F3': 'F3',
    'F4': 'F4',
    'F5': 'F5',
    'F6': 'F6',
    'F7': 'F7',
    'F8': 'F8',
    'F9': 'F9',
    'F10': 'F10',
    'F11': 'F11',
    'F12': 'F12',
    'Comma': ',',
    'Period': '.',
    'Slash': '/',
    'Backslash': '\\',
    'Semicolon': ';',
    'Quote': "'",
    'BracketLeft': '[',
    'BracketRight': ']',
    'Minus': '-',
    'Equal': '=',
    'Backquote': '`'
  };
  
  if (keyMap[code]) {
    return keyMap[code];
  }
  
  // F1-F12の処理
  if (/^F\d+$/.test(code)) {
    return code;
  }
  
  // その他のキーはcodeをそのまま返す
  return code;
}

// キーイベントからキーコンビネーション文字列を生成
export function getKeyCombination(event) {
  const parts = [];
  
  // Macの場合はMetaキー（Command）、それ以外はCtrl
  if (event.ctrlKey || event.metaKey) {
    parts.push(event.metaKey ? 'Meta' : 'Ctrl');
  }
  if (event.shiftKey) {
    parts.push('Shift');
  }
  if (event.altKey) {
    parts.push('Alt');
  }
  
  // event.codeを使用して物理的なキーを取得（修飾キーの影響を受けない）
  const key = getKeyFromCode(event.code);
  
  if (key && !['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    // アルファベットは大文字に統一
    if (/^[A-Z]$/.test(key)) {
      parts.push(key);
    } else {
      parts.push(key);
    }
  }
  
  return parts.join('+');
}

// 設定文字列とキーイベントが一致するか判定
export function matchesShortcut(shortcut, event) {
  if (!shortcut || !shortcut.trim()) {
    return false;
  }
  
  const combination = getKeyCombination(event);
  const normalizedShortcut = normalizeShortcut(shortcut);
  const normalizedCombination = normalizeShortcut(combination);
  
  return normalizedCombination === normalizedShortcut;
}

// ショートカット文字列を正規化（大文字小文字の統一など）
export function normalizeShortcut(shortcut) {
  if (!shortcut) {
    return '';
  }
  
  // 空白を除去
  const cleaned = shortcut.replace(/\s+/g, '');
  
  // +で分割して各部分を正規化
  return cleaned.split('+').map(part => {
    // 最初の文字を大文字に、残りを小文字に（ただし数字はそのまま）
    if (/^[0-9]$/.test(part)) {
      return part;
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('+');
}

// 入力フィールドにフォーカスがあるかチェック
export function isInputFocused(event) {
  const target = event.target;
  const tagName = target.tagName;
  const isContentEditable = target.isContentEditable;
  
  // input, textarea, select要素
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    // type="text"以外のinput（button, submit, resetなど）は除外
    if (tagName === 'INPUT' && target.type !== 'text' && target.type !== 'password' && 
        target.type !== 'search' && target.type !== 'email' && target.type !== 'url') {
      return false;
    }
    return true;
  }
  
  // contenteditable要素
  if (isContentEditable) {
    return true;
  }
  
  return false;
}
