// ==UserScript==
// @name			Редактор закладок+
// @description		Делает панель редактирования закладок изменяемой в размерах.
// @compatibility	Firefox 152 
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

(function() {
	if (window.uc_resizableBookmarkPanel_initialized) return;
	window.uc_resizableBookmarkPanel_initialized = true;

	const PREF_NAME = "uc.editBMPanel_folderTreeRow_WidthHeight";
	const DEFAULT_SIZE = "332 184";
	const ID_PANEL = "editBookmarkPanel";
	const ID_TREE_ROW = "editBMPanel_folderTreeRow";

	// 1. Внедрение стилей
	const CSS = `
		#editBookmarkPanel #editBMPanel_folderTreeRow {
			resize: both !important;
			overflow: hidden !important;
			min-width: 332px !important;
			padding: 0 !important;
			margin: 3px 0 !important;
		}
		#editBookmarkPanel :is(#editBookmarkSeparator, #editBookmarkPanelInfoArea, #editBookmarkHeaderSeparator) {
			display: none !important;
		}
		#editBookmarkPanel > .panel-header {
			padding: 0 !important;
			min-height: 0 !important;
			margin-top: 4px !important;
		}
		#editBookmarkPanel input {
			border-radius: 4px !important;
		}
		#editBookmarkPanel :is(#editBMPanel_keywordField, #editBMPanel_locationField) {
			display: block !important;
		}
		#editBookmarkPanel #editBookmarkPanelContent {
			row-gap: 3px !important;
			padding-block: 0 !important;
		}
		#editBookmarkPanel #editBookmarkPanelContent > label {
			margin: 0 !important;
			padding: 0 !important;
			display: flex !important;
		}
		#editBookmarkPanel input[type=text] {
			margin: 0 !important;
			padding: 3px !important;
			border-width: 1px !important;
			outline-width: 1px !important;
		}
		#editBookmarkPanel :is(.expander-up, .expander-down) {
			height: 24px !important;
			min-height: 0 !important;
			width: 24px !important;
			min-width: 0 !important;
		}
		#editBookmarkPanel :is(tree, #editBMPanel_tagsSelector, :is(.expander-up, .expander-down) > hbox > label) {
			margin: 0 !important;
		}
		#editBookmarkPanel menulist {
			padding: 0 8px !important;
		}
		#editBookmarkPanel #editBMPanel_tagsSelectorRow {
			padding: 0 !important;
		}
		#editBookmarkPanel #editBMPanel_newFolderButton {
			margin: 4px 0 0 0 !important;
		}
		#editBookmarkPanel #editBookmarkPanelBottomContent {
			padding-bottom: 0 !important;
		}
		#editBookmarkPanel #editBookmarkPanelBottomContent > checkbox {
			margin-bottom: 0 !important;
		}
	`;

	let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
	let uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(CSS));
	if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
		sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
	}

	let ro = null;
	let isResizing = false;
	let startX = 0;

	// 2. Делегирование событий с нулевым тайм-аутом
	window.addEventListener("popupshowing", (event) => {
		if (event.target.id !== ID_PANEL) return;

		const panel = event.target;
		const row = document.getElementById(ID_TREE_ROW);
		if (!row) return;

		// Размеры возвращаем жестко и синхронно до показа панели
		let [width, height] = Services.prefs.getCharPref(PREF_NAME, DEFAULT_SIZE).split(" ");
		row.style.width = width + "px";
		row.style.height = height + "px";

		// Раскрытие элемента
			const expander = document.getElementById("editBMPanel_foldersExpander");
			if (expander && expander.classList.contains("expander-down")) {
				expander.click();
			}

			// Инициализация ключевых слов
			try {
				if (typeof window.gEditItemOverlay !== "undefined") {
					if (window.gEditItemOverlay._paneInfo && window.gEditItemOverlay._paneInfo.visibleRows) {
						window.gEditItemOverlay._paneInfo.visibleRows.add("keywordRow");
					}
					if (typeof window.gEditItemOverlay._initKeywordField === "function") {
						window.gEditItemOverlay._initKeywordField().catch(() => {});
					}
				}
			} catch(e) {
				console.warn("[UC] Ошибка инициализации полей", e);
			};

		if (!ro) {
			ro = new ResizeObserver(() => {
				if (!row.matches(":hover")) return;
				isResizing = true;
				
				let r = panel.getOuterScreenRect();
				if (startX !== 0 && r.x !== startX) {
					panel.moveTo(startX, r.y);
				}
			});
			ro.observe(row);
		}
	});

	window.addEventListener("popupshown", (event) => {
		if (event.target.id !== ID_PANEL) return;
		isResizing = false;
		startX = event.target.getOuterScreenRect().x;
	});

	window.addEventListener("popuphidden", (event) => {
		if (event.target.id !== ID_PANEL) return;
		if (!isResizing) return;
		
		const row = document.getElementById(ID_TREE_ROW);
		if (row) {
			let w = parseInt(row.style.width) || 332;
			let h = parseInt(row.style.height) || 184;
			Services.prefs.setCharPref(PREF_NAME, `${w} ${Math.max(184, h)}`);
		}
		isResizing = false;
	});

})();
