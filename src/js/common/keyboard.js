// Keyboard utility functions for shortcut detection

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
  
  // 修飾キー以外のキーを追加
  if (event.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
    // 特殊キーの処理
    let key = event.key;
    
    // 数字キーはそのまま
    if (/^[0-9]$/.test(key)) {
      parts.push(key);
    }
    // アルファベットは大文字に統一
    else if (/^[a-zA-Z]$/.test(key)) {
      parts.push(key.toUpperCase());
    }
    // その他のキー（F1-F12、Enter、Spaceなど）はそのまま
    else {
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
