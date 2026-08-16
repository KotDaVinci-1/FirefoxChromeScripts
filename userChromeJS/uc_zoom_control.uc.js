// ==UserScript==
// @name			Управление масштабом
// @description		Кнопка позволяет менять масштаб страницы.
// @compatibility	Firefox 152 
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

if (!ChromeUtils.domProcessChild.childID) {
	let { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");
	
	const ID = "uc-zoom-control";
	const PREF_NAME = "browser.zoom.full";
	const BTN_TYPE_PREF = "uc-zoom-control-btn";

	// Получение типа кнопки (возвращает 1, 2, 3 или 4. По умолчанию 1)
	const getBtnType = () => {
		try {
			let val = Services.prefs.getIntPref(BTN_TYPE_PREF);
			return [1, 2, 3, 4].includes(val) ? val : 1;
		} catch {
			return 1; 
		}
	};

	// Синхронное обновление атрибутов состояний на всех панелях
	const updateAllInstances = () => {
		try {
			let instances = CustomizableUI.getWidget(ID).instances;
			let isFull = Services.prefs.getBoolPref(PREF_NAME, true);
			let btnType = getBtnType();

			instances?.forEach?.(instance => {
				let node = instance?.node;
				if (node) {
					node.setAttribute("data-zoom-state", isFull ? "full" : "text");

					if (btnType === 1 || btnType === 3) {
						node.setAttribute("big-ico", "true");
					} else {
						node.removeAttribute("big-ico");
					}

					if (btnType === 3 || btnType === 4) {
						node.setAttribute("show-text", "true");
					} else {
						node.removeAttribute("show-text");
					}
				}
			});
		} catch (ex) {
			console.error("Ошибка при обновлении кнопки масштаба:", ex);
		}
	};

	CustomizableUI.createWidget({
		id: ID,
		label: "Управление масштабом",
		tooltiptext: "Масштаб",
		localized: false,
		type: "custom",
		defaultArea: CustomizableUI.AREA_NAVBAR,

		onBuild: function(doc) {
			if (!doc.getElementById("uc-zoom-control-styles")) {
				let style = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
				style.id = "uc-zoom-control-styles";

				const svgUrl = (text, width, xLeft, color, extraStyle = "") => {
					const svg = `<svg width="${width}" height="16" viewBox="0 0 ${width} 16" xmlns="http://www.w3.org/2000/svg"><text font-family="Georgia, serif" font-size="22" y="16" x="${xLeft}" fill="${color}" style="${extraStyle}">${text}</text></svg>`;
					return `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}')`;
				};

				const lightDarkRule = (text, width, xLeft, lightColor, darkColor, extraStyle = "") => {
					return `list-style-image: light-dark(${svgUrl(text, width, xLeft, lightColor, extraStyle)}, ${svgUrl(text, width, xLeft, darkColor, extraStyle)}) !important;`;
				};

				style.textContent = `
					/* --- Иконки для Большой кнопки (big-ico="true") --- */
					#uc-zoom-control[data-zoom-state="full"][big-ico="true"] .toolbarbutton-icon {
						${lightDarkRule("PAGE", 64, 1, "blue", "cyan", "letter-spacing: .4px;")}
					}
					#uc-zoom-control[data-zoom-state="text"][big-ico="true"] .toolbarbutton-icon {
						${lightDarkRule("TEXT", 64, 1, "green", "#0f2", "letter-spacing: 1px;")}
					}

					/* --- Иконки для Обычной кнопки (без big-ico) --- */
					#uc-zoom-control[data-zoom-state="full"]:not([big-ico="true"]) .toolbarbutton-icon {
						${lightDarkRule("P", 16, 1, "blue", "cyan")}
					}
					#uc-zoom-control[data-zoom-state="text"]:not([big-ico="true"]) .toolbarbutton-icon {
						${lightDarkRule("T", 16, 1, "green", "#0f2")}
					}
					/* --- Геометрия --- */
					#uc-zoom-control .toolbarbutton-icon {
						width: auto !important;
					}

					/* Размер кнопки для вывода текста масштаба (show-text="true") */
					#uc-zoom-control[show-text="true"] .toolbarbutton-icon {
						padding-right: calc(64px + var(--toolbarbutton-padding-inner)) !important;
					}

					/* Псевдоэлемент для вывода текста масштаба (show-text="true") */
					#uc-zoom-control[show-text="true"]::after {
						content: attr(data-zoom);
						display: block;
						position: relative;
						font-family: Segoe UI;
						font-size: 22px;
						height: 24px;
						width: 56px;
						margin-left: -58px;
						left: calc(var(--toolbarbutton-padding-inner) * -1);
						top: -4px;
						text-align: right;
					}

					/* Цвет текста масштаба когда он НЕ 100% */
					#uc-zoom-control[show-text="true"]:not([data-zoom="100%"])::after {
						color: light-dark(DarkViolet, lightpink);
					}

					/* FIX мобильного режима кнопок */
					:root[uidensity="touch"] #PersonalToolbar #uc-zoom-control.toolbarbutton-1 {
						align-items: center !important;
					}

				`;
				doc.documentElement.appendChild(style);
			}

			const btn = doc.createXULElement("toolbarbutton");
			btn.id = ID;
			btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
			btn.setAttribute("label", "Управление масштабом");

			let isFull = Services.prefs.getBoolPref(PREF_NAME, true);
			let btnType = getBtnType();

			btn.setAttribute("data-zoom-state", isFull ? "full" : "text");
			if (btnType === 1 || btnType === 3) {
				btn.setAttribute("big-ico", "true");
			}
			if (btnType === 3 || btnType === 4) {
				btn.setAttribute("show-text", "true");
			}

			const win = doc.defaultView;
			const updateDisplay = () => {
				win.setTimeout(() => {
					if (!win.ZoomManager) return;
					let zoom = Math.floor((win.ZoomManager.zoom + 0.005) * 100) + "%";

					btn.setAttribute("data-zoom", zoom);
					btn.setAttribute("tooltiptext", 
						"Zoom: " + zoom +
						"\nКолёсико: масштаб" +
						"\nЛКМ: 100%" +
						"\nСКМ: менять масштаб (страница/текст)" +
						"\nПКМ: переключить тип кнопки"
					);
				}, 20);
			};

			btn.addEventListener("click", (e) => {
				if (!win.FullZoom) return;
				if (e.button === 0) {
					win.FullZoom.reset();
				} else if (e.button === 1) {
					let currentPref = Services.prefs.getBoolPref(PREF_NAME, true);
					Services.prefs.setBoolPref(PREF_NAME, !currentPref);
				}
			});

			btn.addEventListener("contextmenu", (e) => {
				e.preventDefault(); 
				let currentType = getBtnType();
				if (currentType < 4) {
					Services.prefs.setIntPref(BTN_TYPE_PREF, currentType + 1);
				} else {
					if (Services.prefs.prefHasUserValue(BTN_TYPE_PREF)) {
						Services.prefs.clearUserPref(BTN_TYPE_PREF);
					}
				}
			});

			btn.addEventListener("wheel", (e) => {
				if (!win.FullZoom) return;
				if (e.deltaY > 0) {
					win.FullZoom.reduce();
				} else {
					win.FullZoom.enlarge();
				}
			});

			// --- БЛОК ГЛОБАЛЬНЫХ СЛУШАТЕЛЕЙ ОКНА ---
			// 1. Изменение масштаба пользователем
			win.addEventListener("FullZoomChange", updateDisplay);
			win.addEventListener("TextZoomChange", updateDisplay);
			// 2. Переключение между вкладками
			win.addEventListener("TabSelect", updateDisplay);

			win.setTimeout(updateDisplay, 100);
			return btn;
		}
	});

	if (!globalThis.ucZoomPrefObserverAdded) {
		Services.prefs.addObserver(PREF_NAME, updateAllInstances);
		Services.prefs.addObserver(BTN_TYPE_PREF, updateAllInstances);
		globalThis.ucZoomPrefObserverAdded = true;
	}
}
