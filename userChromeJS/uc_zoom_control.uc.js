// ==UserScript==
// @name			Управление масштабом
// @description		Кнопка позволяет менять масштаб страницы.
// @compatibility	Firefox 152
// @version			1.1.0 Новая логика отрисовки/переключения внешнего вида кнопки, оптимизация кода.
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

				style.textContent = `
					/* --- Иконки --- */
					#uc-zoom-control .toolbarbutton-icon {
						list-style-image: url("data:image/svg+xml,%3Csvg width='64' height='16' viewBox='0 0 64 16' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext font-family='Georgia, serif' font-size='22' y='16' x='1' style='fill: light-dark(blue, cyan); color-scheme: light dark; letter-spacing: .4px;'%3EPAGE%3C/text%3E%3C/svg%3E");
					}
					@media -moz-pref("uc-zoom-control-btn",2), -moz-pref("uc-zoom-control-btn",4) {
						#uc-zoom-control .toolbarbutton-icon {
							list-style-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext font-family='Georgia, serif' font-size='22' y='16' x='1' style='fill: light-dark(blue, cyan); color-scheme: light dark;'%3EP%3C/text%3E%3C/svg%3E");
						}
					}

					@media not -moz-pref("browser.zoom.full") {
						#uc-zoom-control .toolbarbutton-icon {
							list-style-image: url("data:image/svg+xml,%3Csvg width='64' height='16' viewBox='0 0 64 16' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext font-family='Georgia, serif' font-size='22' y='16' x='1' style='fill: light-dark(green, %230f2); color-scheme: light dark; letter-spacing: 1px;'%3ETEXT%3C/text%3E%3C/svg%3E");
						}
						@media -moz-pref("uc-zoom-control-btn",2), -moz-pref("uc-zoom-control-btn",4) {
							#uc-zoom-control .toolbarbutton-icon {
								list-style-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext font-family='Georgia, serif' font-size='22' y='16' x='1' style='fill: light-dark(green, %230f2); color-scheme: light dark;'%3ET%3C/text%3E%3C/svg%3E");
							}
						}
					}
					/* --- Геометрия --- */
					#uc-zoom-control .toolbarbutton-icon {
						width: auto !important;
					}

					/* --- Текст масштаба --- */
					@media -moz-pref("uc-zoom-control-btn",3), -moz-pref("uc-zoom-control-btn",4) {
						/* Размер кнопки для вывода текста масштаба */
						#uc-zoom-control .toolbarbutton-icon {
							padding-right: calc(64px + var(--toolbarbutton-padding-inner)) !important;
						}

						/* Псевдоэлемент для вывода текста масштаба */
						#uc-zoom-control::after {
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
						#uc-zoom-control:not([data-zoom="100%"])::after {
							color: light-dark(DarkViolet, lightpink);
						}
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
}
