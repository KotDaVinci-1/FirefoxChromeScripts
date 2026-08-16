// ==UserScript==
// @name			UC Script Manager Button
// @description		Создает кнопку на панели инструментов для управления скриптами userChrome.js
// @compatibility	Firefox 152
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

(function() {
	const PREF_DISABLED = 'userChromeJS.scriptsDisabled';
	const WIDGET_ID = 'uc-script-manager-button';
	const IGNORE_FILE = 'rebuild_userChrome.uc.js'

	// Получить список отключенных скриптов из about:config
	function getDisabledScripts() {
		try {
			return Services.prefs.getStringPref(PREF_DISABLED, "").split(",").filter(s => s);
		} catch(e) {
			return [];
		}
	}

	// Сохранить список отключенных скриптов в about:config
	function setDisabledScripts(arr) {
		Services.prefs.setStringPref(PREF_DISABLED, arr.filter(s => s).join(","));
	}

	// Синхронное чтение первых 2048 байт файла для извлечения метаданных
	function readHeader(file) {
		let nameMatch = null;
		let homeMatch = null;
		let descMatch = null;
		try {
			let stream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
			stream.init(file, 0x01, 0o444, 0);

			let converter = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
			converter.init(stream, "UTF-8", 2048, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

			let str = {};
			converter.readString(2048, str);
			let content = str.value;

			converter.close();
			
			nameMatch = content.match(/@name[ \t]*([^\r\n]*)/);
			homeMatch = content.match(/@homepage(?:URL)?[ \t]*([^\r\n]*)/);
			descMatch = content.match(/@description[ \t]*([^\r\n]*)/);
		} catch(e) {
			console.error("UC Manager: Не удалось прочитать заголовок", file.leafName, e);
		}

		return {
			name: (nameMatch && nameMatch[1].trim()) || file.leafName,
			homepage: homeMatch ? homeMatch[1].trim() : '',
			description: descMatch ? descMatch[1].trim() : ''
		};
	}

	// Регистрация кнопки
	CustomizableUI.createWidget({
		id: WIDGET_ID,
		type: "custom",
		defaultArea: CustomizableUI.AREA_NAVBAR,
		onBuild: function(doc) {
			let btn = doc.createXULElement("toolbarbutton");
			btn.id = WIDGET_ID;
			btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
			btn.setAttribute("label", "UC Scripts");
			btn.setAttribute("tooltiptext", "Менеджер скриптов userChrome");
			btn.setAttribute("type", "menu");
			btn.setAttribute("image", "data:image/svg+xml,<svg width='24px' height='24px' xmlns='http://www.w3.org/2000/svg'><path fill='context-fill' d='M 24 10 C 24 11 24 12 24 13 C 20.66 13 17.3 13 14 13 C 14 15.66 14 18.33 14 21 C 17.33 21 20.66 21 24 21 C 24 22 24 23 24 24 C 19.66 24 15.33 24 11 24 C 11 20.33 11 16.66 11 13 C 7.33 13 3.66 13 0 13 C 0 8.66 0 4.33 0 0 C 1 0 2 0 3 0 C 3 3.33 3 6.66 3 10 C 5.66 10 8.33 10 11 10 C 11 6.66 11 3.33 11 0 C 12 0 13 0 14 0 C 14 3.33 14 6.66 14 10 C 17.333 10 20.667 10 24 10 Z'/></svg>");

			let popup = doc.createXULElement("menupopup");
			popup.id = WIDGET_ID + "-popup";
			
			popup.addEventListener("popupshowing", onPopupShowing);
			popup.addEventListener("click", onPopupClick);
			popup.addEventListener("mouseup", onPopupMouseUp);
			popup.addEventListener("contextmenu", e => e.preventDefault());

			btn.appendChild(popup);
			return btn;
		}
	});

	// Генерация списка при открытии меню
	function onPopupShowing(event) {
		let popup = event.target;
		if (popup.id !== WIDGET_ID + "-popup") return;

		while (popup.firstChild) {
			popup.firstChild.remove();
		}

		let disabledList = getDisabledScripts();
		
		// Получение директории на основе chrome.manifest
		let chromeDir = null;
		try {
			let cr = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
			let uri = Services.io.newURI("chrome://userscripts/content/dummy.js");
			let fileURI = cr.convertChromeURL(uri);
			chromeDir = fileURI.QueryInterface(Ci.nsIFileURL).file.parent;
		} catch(e) {
			console.error("UC Manager: Не удалось разрешить путь chrome://userscripts/content/", e);
		}

		if (!chromeDir || !chromeDir.exists() || !chromeDir.isDirectory()) {
			let err = popup.ownerDocument.createXULElement("menuitem");
			err.setAttribute("label", "Папка скриптов не найдена (ошибка chrome.manifest)");
			err.setAttribute("disabled", "true");
			popup.appendChild(err);
			return;
		}

		let entries = chromeDir.directoryEntries;
		let scripts = [];

		while (entries.hasMoreElements()) {
			let file = entries.getNext().QueryInterface(Ci.nsIFile);
			if (file.isFile() && (file.leafName.endsWith(".uc.js") || file.leafName.endsWith(".uc.mjs") || file.leafName.endsWith(".sys.mjs"))) {

				if (file.leafName === IGNORE_FILE) continue; 

				let header = readHeader(file);
				scripts.push({
					file: file,
					filename: file.leafName,
					name: header.name,
					description: header.description,
					homepage: header.homepage,
					isEnabled: !disabledList.includes(file.leafName)
				});
			}
		}

		scripts.sort((a, b) => a.name.localeCompare(b.name)).forEach(script => {
			let mi = popup.ownerDocument.createXULElement("menuitem");
			mi.setAttribute("type", "checkbox");
			mi.setAttribute("image", "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4=");
			
			if (script.isEnabled) {
				mi.setAttribute("checked", "");
			}
			
			mi.setAttribute("label", script.name);
			mi.setAttribute("class", "userChromejs_script");
			mi.setAttribute("closemenu", "none"); 

			// --- Сборка Tooltip с учетом homepage ---
			let tooltip = `ЛКМ: Включить / Отключить\n`;
			if (script.homepage) {
				tooltip += `СКМ: Открыть домашнюю страницу\n`;
			}
			tooltip += `ПКМ: Редактировать скрипт\nФайл: ${script.filename}`;
			
			if (script.homepage) {
				tooltip += `\nСайт: ${script.homepage}`;
			}
			
			if (script.description) {
				tooltip = `Описание: ${script.description}\n\n` + tooltip;
			}
			// ----------------------------------------
			
			mi.setAttribute("tooltiptext", tooltip);
			mi._ucScriptData = script; 
			popup.appendChild(mi);
		});

		popup.appendChild(popup.ownerDocument.createXULElement("menuseparator"));

		// Кнопка: Открыть папку
		let openDir = popup.ownerDocument.createXULElement("menuitem");
		openDir.setAttribute("label", "Открыть папку со скриптами");
		openDir.setAttribute("class", "menuitem-iconic");
		openDir.setAttribute("image", "chrome://global/skin/icons/folder.svg");
		openDir.addEventListener("command", () => chromeDir.launch());
		popup.appendChild(openDir);

		// Кнопка: Выбрать редактор
		let setEditor = popup.ownerDocument.createXULElement("menuitem");
		setEditor.setAttribute("label", "Выбрать текстовый редактор...");
		setEditor.setAttribute("class", "menuitem-iconic");
		setEditor.setAttribute("image", "chrome://global/skin/icons/edit-outline.svg");
		setEditor.addEventListener("command", () => configureEditor());
		popup.appendChild(setEditor);

		// Кнопка: Рестарт
		let restartBtn = popup.ownerDocument.createXULElement("menuitem");
		restartBtn.setAttribute("label", "Перезапустить браузер");
		restartBtn.setAttribute("class", "menuitem-iconic");
		restartBtn.setAttribute("image", "chrome://global/skin/icons/reload.svg");
		restartBtn.addEventListener("command", () => {
			Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
		});
		popup.appendChild(restartBtn);
	}

	// Отдельная обработка отпускания кнопки мыши (для СКМ)
	function onPopupMouseUp(event) {
		if (event.button !== 1) return;

		let mi = event.target;
		if (!mi.classList.contains('userChromejs_script')) return;

		event.preventDefault();
		event.stopPropagation();

		let script = mi._ucScriptData;
		if (script && script.homepage) {
			// Открыть страницу в новой активной вкладке. 
			// Если нужно открывать в фоне без фокуса, заменить "tab" на "tabshifted"
			openWebLinkIn(script.homepage, "tab");
		}
	}

	// Обработка кликов (ЛКМ и ПКМ)
	function onPopupClick(event) {
		let mi = event.target;
		if (!mi.classList.contains('userChromejs_script')) return;

		let script = mi._ucScriptData;
		if (!script) return;

		if (event.button === 0) { // ЛКМ - Переключение статуса
			let disabledScripts = getDisabledScripts();
			let idx = disabledScripts.indexOf(script.filename);

			if (script.isEnabled) {
				if (idx === -1) disabledScripts.push(script.filename);
				script.isEnabled = false;
			} else {
				if (idx > -1) disabledScripts.splice(idx, 1);
				script.isEnabled = true;
			}
			setDisabledScripts(disabledScripts);

		} else if (event.button === 2) { // ПКМ - Открыть скрипт в редакторе
			launchEditor(script.file);
			mi.parentNode.hidePopup();
		}
	}

	// Интерактивная настройка текстового редактора
	function configureEditor() {
		let currentEditor = "";
		try {
			currentEditor = Services.prefs.getStringPref("view_source.editor.path", "");
		} catch(e) {}

		let fallback = 'C:\\WINDOWS\\system32\\notepad.exe';
		let obj = { value: currentEditor};
		let title = 'Менеджер скриптов';
		let desc = 'Введите полный путь к текстовому редактору\n(например, C:\\Program Files\\AkelPad\\AkelPad.exe)\n(при пустом поле будет использоваться системный текстовый редактор):'

		if (Services.prompt.prompt(null, title, desc, obj, null, { value: 0 })) {
			let newPath = obj.value.trim();
			// Если стерли всё и нажали ОК, принудительно сохраняем Блокнот
			Services.prefs.setStringPref('view_source.editor.path', newPath || fallback);
			return true;
		}
		return false;
	}

	// Логика запуска текстового редактора
	function launchEditor(nsIFileObject) {
		let editor = "";
		try {
			editor = Services.prefs.getStringPref("view_source.editor.path", "");
		} catch(e) {}

		// Если путь не задан, вызывается настройка
		if (!editor) {
			configureEditor();
			try {
				editor = Services.prefs.getStringPref("view_source.editor.path", "");
			} catch(e) {}

			// Если пользователь нажал "Отмена" в окне настройки
			if (!editor) {
				nsIFileObject.launch();
				return;
			}
		}

		try {
			let appfile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
			appfile.initWithPath(editor);
			let process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
			process.init(appfile);
			process.run(false, [nsIFileObject.path], 1, {});
		} catch(e) {
			console.error("Не удалось запустить редактор. Проверьте путь в view_source.editor.path", e);
			// Резервный запуск через систему, если путь кривой
			nsIFileObject.launch(); 
		}
	}
})();
