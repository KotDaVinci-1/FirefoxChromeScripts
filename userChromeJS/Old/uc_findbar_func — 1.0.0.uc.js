// ==UserScript==
// @name			Улучшенный Findbar
// @description		Добавляет: в Файндбар кнопку с действиями для инпута Файндбара; общий Файндбар для всех вкладок (опционально); Закрытие Файндбара по Ctrl+F (опционально).
// @compatibility	Firefox 152
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

if (!ChromeUtils.domProcessChild.childID) {
	let win = globalThis.window;
	// ВКЛ/ВЫКЛ Ctrl+F закрыть панель
	const FBAR_EXIT = true;
	// ВКЛ/ВЫКЛ Один файндбар для всех вкладок
	const FBAR_ALL = true;

	// --- 1. Синхронизация состояния панели поиска между вкладками ---
	if (FBAR_ALL) {
		win.gBrowser.tabContainer.addEventListener("TabSelect", async (e) => {
			let prevTab = e.detail.previousTab;
			let currentTab = e.target;
			let prevFindbar = prevTab._findBar;
			let currentFindbar = currentTab._findBar;
			let wasOpen = prevFindbar && !prevFindbar.hidden;

			if (wasOpen) {
				if (!currentFindbar) {
					await win.gBrowser.getFindBar();
					currentFindbar = currentTab._findBar;
				}
				if (currentFindbar && currentFindbar.hidden) {
					currentFindbar.setAttribute("noanim", "true");
					currentFindbar.open();
					win.setTimeout(() => currentFindbar.removeAttribute("noanim"), 50);
					if (currentFindbar._findField.value) {
						currentFindbar._enableFindButtons(true);
					}
				}
			} else {
				if (currentFindbar && !currentFindbar.hidden) {
					currentFindbar.close(true); 
				}
			}
		});
	}

	// --- 2. Ctrl+F закрывает панель, если она уже открыта ---
	if (FBAR_EXIT) {
		win.addEventListener('keydown', (e) => {
			if (e.ctrlKey && !e.altKey && !e.shiftKey && e.keyCode === 70) {
				if (win.gFindBarInitialized && win.gFindBar && !win.gFindBar.hidden) {
					e.preventDefault();
					e.stopPropagation();
					win.gFindBar.close();
				}
			}
		}, true);
	}

	// --- 3. Кастомизация элементов панели поиска ---
	function initFindbarModifications(findbar) {
		if (findbar.hasAttribute("uc-customized")) return;
		findbar.setAttribute("uc-customized", "true");

		let closeBtn = findbar.querySelector(".findbar-closebutton");
		if (closeBtn) {
			closeBtn.style.setProperty("order", "-1", "important");
		}

		findbar.addEventListener("wheel", (e) => {
			e.preventDefault();
			findbar.onFindAgainCommand(e.deltaY < 0);
		});

		let btn = win.document.createXULElement("toolbarbutton");
		btn.setAttribute("class", "toolbarbutton-1 uc-findbar-btn");
		btn.setAttribute("focusable", "false");
		btn.style.setProperty("margin", "0 6px", "important");
		
		btn.setAttribute("tooltiptext", "ЛКМ - вставить из буфера.\nСКМ - захватить выделенный текст с веб-страницы.\nПКМ - очистить поиск.");
		btn.setAttribute("image", "data:image/x-icon;base64,AAABAAEADhAAAAEAIADoAwAAFgAAACgAAAAOAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5eXn/eXl5/3l5ef95eXn/eXl5/3l5ef95eXn/eXl5/ylTda0pU3X/KVN1/ylTdf8pU3X/HTpS/4WFhf/w8PL/8fHz//Hx8//x8fP/8fHz//Hx8/+FhYX/KVN1/yRJaP8jSGf/I0dl/yNHZP8YMEX/j4+P//Hx8//x8vP/8fLz//Hy8//x8vP/8fLz/4+Pj/8pU3X/JUxr/yVLav8kSmn/JElo/xkyR/+cnJz/8vLz//Ly9P/y8vT/8vL0//Ly9P/y8vT/nJyc/ylTdf8nTm3/Jk1t/yVMa/8lSmn/GjNJ/6urq//y8vT/8/P1//Pz9f/z8/X/8/P1//Pz9f+rq6v/KVN1/ydPb/8nTm7/Jk1t/yZMa/8aNEr/srKy//X19v/19vf/9fb3//X29//19vf/9fb3/7Kysv8pU3X/J1Bx/ydQb/8nTm//Jk1t/xs2S/+8vLz/+fr6//r7+//6+/v/ubm5/7e3t/+3t7f/ubm5/ylTdf8oUXP/KFBx/ydQcf8nT2//GzZN/76+vv/6+/v/+/v8//v7/P/ExMT/9vb2/7e3t/na2tpfKVN1/ylTdP8pUXP/KFBy/yhPcP8bN03/v7+///v7/P/7/Pz/+/z8/8rKyv+3t7f/4OLgaQAAAAApU3X/KVN1/yhSdP8oUnT/KFJy/xw4UP+/v7//v7+//7+/v/+/v7//uru7/2OBmf8AAAAAAAAAAClTdf8pU3X/KVN1/ylSdP8pUnT/JEpn/yRIZv8kSGX/I0dk/yNGY/8jRWL/KVN1/wAAAAAAAAAAKVN1/ylTdf8lS2n/IztO/yM7Tv8jO07/IztO/yM7Tv8jO07/JUtp/ydOb/8lS2n/AAAAAAAAAAApU3X/K2GQ/yhahv91dXX/XV1d/11dXf9dXV3/XV1d/4B/f/8oWob/Kmad/ylTdf8AAAAAAAAAAClTda0pU3X/KVN1/7O0tP/h4eD/3t7f/97f3//g4OD/s7S0/ylTdf8pU3X/KVN1rQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG1yds1dXFv1XVxb9Wxxdc8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJUwFASZMCwAlTAsAI00LIys1CxcXFsEYFxbCJS01DAAlTQsAJk0LASZNCwAlTQUAAAAAAAAAAPwArEEAAKxBAACsQQAArEEAAKxBAACsQQAArEEAAKxBAASsQQAMrEEADKxBAAysQQAMrEEADKxB8PysQQAMrEE=");

		// --- БЛОК 1: Жестко гасим все события, способные украсть фокус ---
		function blockFocus(e) {
			e.preventDefault();
			e.stopPropagation();
		}
		btn.addEventListener("mouseup", blockFocus);
		btn.addEventListener("click", blockFocus);
		btn.addEventListener("contextmenu", blockFocus);

		// --- БЛОК 2: Основная логика ---
		btn.addEventListener("mousedown", async (e) => {
			blockFocus(e);

			if (e.button === 0) { 
				// ЛКМ: вставляем из буфера
				try {
					let clipboardText = await win.navigator.clipboard.readText();
					if (clipboardText) {
						findbar._findField.value = clipboardText.trim();
						findbar.onFindAgainCommand();
					}
				} catch (err) {
					console.error("[UC]: Ошибка чтения буфера:", err);
				}
			} 
			else if (e.button === 1) {
				// СКМ: асинхронный захват выделенного текста
				let selectedText = "";
				try {
					if (findbar.browser?.finder?.getInitialSelection) {
						let selData = await findbar.browser.finder.getInitialSelection();
						if (typeof selData === "string") {
							selectedText = selData;
						} else if (selData && selData.selectedText) {
							selectedText = selData.selectedText;
						}
					}
				} catch (err) {
					console.error("[UC]: Ошибка при запросе выделенного текста:", err);
				}

				if (selectedText) {
					findbar._findField.value = selectedText.trim();
					findbar.onFindAgainCommand();
				}
			} 
			else if (e.button === 2) { 
				// ПКМ: очищаем поле
				findbar._findField.value = "";
				findbar._findField.dispatchEvent(new win.Event("input", { bubbles: true }));
			}
		});

		let highlightBtn = findbar.getElement("highlight");
		if (highlightBtn) {
			highlightBtn.before(btn);
		} else {
			findbar.appendChild(btn);
		}
	}

	for (let tab of win.gBrowser.tabs) {
		if (tab._findBar) {
			initFindbarModifications(tab._findBar);
		}
	}

	win.gBrowser.tabContainer.addEventListener("TabFindInitialized", (e) => {
		initFindbarModifications(e.target._findBar);
	});
}