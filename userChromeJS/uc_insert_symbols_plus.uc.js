// ==UserScript==
// @name			Вставка символов Plus
// @description		Кнопка с меню спецсимволов и текстовых шаблонов с поддержкой буфера обмена.
// @compatibility	Firefox 152 
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

(function() {
	if (window.uc_insertSymbolsP_initialized) return;
	window.uc_insertSymbolsP_initialized = true;

	const BUTTON_ID = "uc-insert-symbols-plus";

	// Структура колонок
	const columns = [
		[
			"§", "©", "«", "»", "¬", "®", "°", "¶", "—", "‘", "’", "“", "”", "•", "‹", "›", "™"
		],
		[
			"≈", "≠", "±", "×", "÷", "≥", "≤", "⩾", "⩽", "〈", "〉", "√", "∫", "‰", "∝", "∞"
		],
		[
			"а́", "е́", "и́", "о́", "у́", "ы́", "э́", "Ђ"
		],
		[
			"😂", "🌍", "🎉", "🍻", "🖖", "⚠", "🐷", "←", "→", "↑", "↓", "↳"
		],
		[
			"…", "✓", "✗", "シ", "ッ", "#", "¤", "µ"
		],
		[
			{ disp: "245", ins: "УК РФ Статья 245. Жестокое обращение с животными" },
			{ disp: "♥🗣", ins: "Я помню чудное мгновенье:\nПередо мной явилась ты,\nКак мимолетное виденье,\nКак гений чистой красоты." },
			{ disp: "`*•", ins: "`*•-.,_,,.-•*```*•-.,_,,.-•*```*•-.,_,,.-•*``*•-.,_,,.-•*```*•-.,_,,.-•*`" },
			{ disp: "зая", ins: "(\\__/)\n(='.'=)\n(\")_(\")" },
			{ disp: "📋", ins: "{CLIPBOARD}" },
			{ disp: "🔗📋", ins: "Вот ссылка: {CLIPBOARD}" }
		],
		[
			{ disp: "#", ins: "решётка" },
			{ disp: "й", ins: "И краткое" },
			{ disp: "_", ins: "нижнее подчёркивание" }
		]
	];

	// CSS для отображения символов в меню
	const CSS = `
		/* 1. Скрываем штатный текст и иконки. Это полностью отключает влияние userChrome.css на этот пункт */
		#${BUTTON_ID}-popup menuitem > .menu-text,
		#${BUTTON_ID}-popup menuitem > .menu-icon {
			display: none !important;
		}

		/* 2. Сбрасываем возможные боковые отступы у самого пункта меню и центрируем его содержимое */
		#${BUTTON_ID}-popup menuitem {
			padding-inline: 6px !important;
			justify-content: center !important;
			-moz-box-pack: center !important;
			min-height: 28px !important;
		}

		/* 3. Отрисовываем текст заново через псевдоэлемент, извлекая его прямо из атрибута label */
		#${BUTTON_ID}-popup menuitem::after {
			content: attr(label) !important;
			display: block !important;
			min-width: 24px !important;
			width: 100% !important;
			text-align: center !important;
			font-size: 14pt !important;
			font-family: Consolas, Cambria, Tahoma !important;
		}
	`;

	let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
	let uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(CSS));

	// ВАЖНО: Изменен уровень с AUTHOR_SHEET на USER_SHEET, чтобы перебить !important из userChrome.css
	if (!sss.sheetRegistered(uri, sss.USER_SHEET)) {
		sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
	}

	// ЛОГИКА ВСТАВКИ СИМВОЛОВ (теперь принимает сохраненный элемент фокуса)
	function insertSymbol(sym, targetEl) {
		let activeEl = targetEl || document.activeElement;

		// Сценарий А: Фокус находится на ВЕБ-СТРАНИЦЕ (e10s / контент)
		if (activeEl && activeEl.localName === "browser" && activeEl.isRemoteBrowser) {
			try {
				let fn = function(text) {
					let el = content.document.activeElement;
					if (!el) return;

					try {
						content.document.execCommand("insertText", false, text);
					} catch (e) {
						if (typeof el.selectionStart === "number") {
							let start = el.selectionStart;
							let end = el.selectionEnd;
							let val = el.value;
							el.value = val.slice(0, start) + text + val.slice(end);
							el.selectionStart = el.selectionEnd = start + text.length;
							el.dispatchEvent(new content.Event('input', { bubbles: true }));
						}
					}
				};

				// Превращаем текст в безопасный Unicode (\uXXXX)
				let safeSym = "";
				for (let i = 0; i < sym.length; i++) {
					safeSym += "\\u" + ("0000" + sym.charCodeAt(i).toString(16)).slice(-4);
				}

				let code = `(${fn.toString()})("${safeSym}");`;
				let script = `data:application/javascript,${encodeURIComponent(code)}`;
				activeEl.messageManager.loadFrameScript(script, false);
			} catch(e) { console.error("[UC]: Ошибка вставки в контент страницы", e); }
		} 
		// Сценарий Б: Фокус находится в ИНТЕРФЕЙСЕ БРАУЗЕРА
		else {
			try {
				let focusedEl = Services.focus.focusedElement || activeEl;
				if (!focusedEl) return;

				try {
					focusedEl.ownerDocument.execCommand("insertText", false, sym);
				} catch (e) {
					if (typeof focusedEl.selectionStart === "number") {
						let start = focusedEl.selectionStart;
						let end = focusedEl.selectionEnd;
						let val = focusedEl.value;
						let newVal = val.slice(0, start) + sym + val.slice(end);
						
						if (typeof focusedEl.setUserInput === "function") {
							focusedEl.setUserInput(newVal);
						} else {
							focusedEl.value = newVal;
							focusedEl.dispatchEvent(new Event('input', { bubbles: true }));
						}
						focusedEl.selectionStart = focusedEl.selectionEnd = start + sym.length;
					}
				}
			} catch (e) { console.error("[UC]: Ошибка вставки в UI браузера", e); }
		}
	}

	// Запуск Таблицы символов Windows
	function launchCharmap() {
		try {
			let file = Cc["@mozilla.org/file/directory_service;1"]
				.getService(Ci.nsIProperties)
				.get("SysD", Ci.nsIFile);
			file.append("charmap.exe");
			if (file.exists()) file.launch();
		} catch (e) { console.error("[UC]: Ошибка запуска charmap", e); }
	}

	// Регистрация кнопки в панели
	CustomizableUI.createWidget({
		id: BUTTON_ID,
		defaultArea: CustomizableUI.AREA_NAVBAR,
		label: "Вставка символов Plus",
		tooltiptext: "Вставка символов Plus.\n\n=Кнопка=\nЛКМ: Меню символов\nСКМ: Таблица символов Windows\n\n=Пункт меню=\nЛКМ: ставить символ\nПКМ: ставить символ без закрытия меню",

		onCreated: function(btn) {
			let doc = btn.ownerDocument;

			btn.setAttribute("type", "menu");
			btn.setAttribute("image", "data:image/svg+xml,<svg width='24' height='22' xmlns='http://www.w3.org/2000/svg'><text font-family='Tahoma' font-size='46px' y='25' x='0' fill='context-fill'>¤</text></svg>");

			// Обработка СКМ на кнопке панели (с фильтром всплытия)
			btn.addEventListener("click", function(e) {
				if (e.button === 1) {
					if (e.target.closest("menupopup")) return; // Игнорируем клики внутри меню
					
					e.preventDefault();
					e.stopPropagation();
					let popup = btn.querySelector("menupopup");
					if (popup) popup.hidePopup();
					launchCharmap();
				}
			});

			// Меню
			let popup = doc.createXULElement("menupopup");
			popup.id = BUTTON_ID + "-popup";
			popup.setAttribute("context", ""); 
			
			let hbox = doc.createXULElement("hbox");
			hbox.setAttribute("flex", "1");
			hbox.setAttribute("orient", "horizontal");
			popup.appendChild(hbox);
			
			// Генерация сетки
			columns.forEach(colData => {
				let menugroup = doc.createXULElement("menugroup");
				menugroup.setAttribute("orient", "vertical");

				colData.forEach(item => {
					if (!item) return;

					let dispText = typeof item === "string" ? item : item.disp;
					let insText  = typeof item === "string" ? item : item.ins;

					let menuitem = doc.createXULElement("menuitem");
					menuitem.setAttribute("label", dispText);
					menuitem.setAttribute("value", insText); // Сохранение текста для вставки
					if (typeof item === "object") {
						menuitem.setAttribute("tooltiptext", insText);
					}

					menugroup.appendChild(menuitem);
				});
				
				hbox.appendChild(menugroup);
			});

			// ОБЩИЙ ОБРАБОТЧИК КЛИКОВ (Асинхронный, для поддержки буфера)
			async function handleMenuClick(e) {
				let target = e.target;
				if (target.localName !== "menuitem") return;

				let textToInsert = target.getAttribute("value");
				let currentWin = target.ownerGlobal || target.ownerDocument.defaultView || window;
				
				// Захват активного элемента ДО паузы на чтение буфера
				let savedActiveElement = document.activeElement;

				// Если есть макрос, читаем буфер
				if (textToInsert.includes("{CLIPBOARD}")) {
					try {
						let clipText = await currentWin.navigator.clipboard.readText();
						textToInsert = textToInsert.split("{CLIPBOARD}").join(clipText || "");
					} catch (err) {
						console.error("[UC]: Ошибка чтения через navigator.clipboard:", err);
					}
				}

				// Передаем итоговый текст и захваченный элемент в функцию вставки
				insertSymbol(textToInsert, savedActiveElement);
			}

			// Клик ЛКМ по пункту меню (стандартная вставка)
			popup.addEventListener("command", handleMenuClick);

			// Клик ПКМ по пункту меню (вставка без закрытия)
			popup.addEventListener("contextmenu", (e) => {
				if (e.target.localName === "menuitem") {
					e.preventDefault();
					e.stopPropagation();
					handleMenuClick(e);
				}
			});

			btn.appendChild(popup);
		}
	});

})();
