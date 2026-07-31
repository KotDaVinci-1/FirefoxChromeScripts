// ==UserScript==
// @name			Подсветка ссылок
// @description		Кнопка позволяет покрасить в разные цвета ссылки ведущие на внешние сайты, внутри сайта и внутри страницы.
// @compatibility	Firefox 152 
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

if (!ChromeUtils.domProcessChild.childID) {
	let { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");

	const ID = "uc_link_highlighter";
	const IMG_ICON = "chrome://global/skin/icons/link.svg";

	const updateAllInstances = (isActive) => {
		try {
			let instances = CustomizableUI.getWidget(ID).instances;
			instances?.forEach?.(instance => {
				let node = instance?.node;
				if (node) {
					if (isActive) {
						node.setAttribute("data-highlighted", "true");
					} else {
						node.removeAttribute("data-highlighted");
					}
				}
			});
		} catch (ex) {
			console.error("Ошибка при обновлении кнопки подсветки ссылок:", ex);
		}
	};

	CustomizableUI.createWidget({
		id: ID,
		label: "Подсветка ссылок",
		localized: false,
		type: "custom",
		defaultArea: CustomizableUI.AREA_NAVBAR,

		onBuild: function(doc) {
			if (!doc.getElementById("uc_link_highlighter-styles")) {
				let style = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
				style.id = "uc_link_highlighter-styles";
				style.textContent = `
					#uc_link_highlighter .toolbarbutton-icon {
						list-style-image: url("${IMG_ICON}") !important;
					}
					#uc_link_highlighter[data-highlighted="true"] .toolbarbutton-icon {
						fill: red !important;
					}
				`;
				doc.documentElement.appendChild(style);
			}

			const btn = doc.createXULElement("toolbarbutton");
			btn.id = ID;
			btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
			btn.setAttribute("label", "Подсветка ссылок");
			btn.setAttribute("tooltiptext", 
				"ЛКМ - Вкл/Выкл подсветку ссылок:\n" +
				"	красный	— внешние сайты\n" +
				"	голубой	— внутри сайта\n" +
				"	зеленый	— внутри страницы"
			);

			const win = doc.defaultView;

			// Предохранитель для защиты системных и спящих страниц
			const isInjectable = (tab, browser) => {
				if (!browser || !browser.currentURI) return false;
				if (tab && tab.hasAttribute("pending")) return false;
				return ["http", "https", "file"].includes(browser.currentURI.scheme);
			};

			// Генератор кода для инъекции внутрь вкладки
			const getFrameScriptCode = (isActive) => `
				(function() {
					try {
						if (typeof content === "undefined" || !content.document) return;
						let doc = content.document;
						let links = doc.links;
						let colors = ${isActive ? '["red", "blue", "green"]' : '["", "", ""]'};
						
						let fixPath = function(p) { 
							return (p.charAt(0) == "/" ? "" : "/") + p; 
						};

						let sim = function(a, b) { 
							if (a.hostname != b.hostname) return 0; 
							if (fixPath(a.pathname) != fixPath(b.pathname) || a.search != b.search) return 1; 
							return 2; 
						};

						for (let i = 0; i < links.length; ++i) {
							let x = links[i];
							x.style.color = colors[sim(x, doc.location)];
						}
					} catch(e) {}
				})();
			`;

			// Выполнение кода в контексте конкретного browser
			const applyToBrowser = (browser, isActive) => {
				let code = getFrameScriptCode(isActive);
				let scriptURI = "data:application/javascript," + encodeURIComponent(code);
				try {
					browser.messageManager.loadFrameScript(scriptURI, false);
				} catch (e) {}
			};

			// Применить только к активной вкладке
			const applyToActiveTab = () => {
				let currentTab = win.gBrowser.selectedTab;
				let browser = win.gBrowser.selectedBrowser;
				
				if (isInjectable(currentTab, browser)) {
					applyToBrowser(browser, true);
				}
			};

			// Сбросить стили на ВСЕХ прогруженных вкладках
			const clearAllTabs = () => {
				let allTabs = win.gBrowser.tabs;
				for (let tab of allTabs) {
					if (!tab.hasAttribute("pending")) {
						let browser = tab.linkedBrowser;
						if (isInjectable(tab, browser)) {
							applyToBrowser(browser, false);
						}
					}
				}
			};

			// --- ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ---
			const onTabSelect = () => {
				win.setTimeout(applyToActiveTab, 50);
			};

			const progressListener = {
				onStateChange(browser, webProgress, request, aStateFlags, aStatus) {
					if (!webProgress.isTopLevel) return;
					const STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
					if (aStateFlags & STATE_STOP) {
						if (browser === win.gBrowser.selectedBrowser) {
							win.setTimeout(applyToActiveTab, 150);
						}
					}
				},
				onLocationChange(browser, webProgress, request, location, flags) {
					if (!webProgress.isTopLevel) return;
					if (browser === win.gBrowser.selectedBrowser) {
						win.setTimeout(applyToActiveTab, 500);
					}
				}
			};

			// --- ЛОГИКА КНОПКИ ---
			btn.addEventListener("click", (e) => {
				if (e.button !== 0 || !win.gBrowser) return;

				const isActive = btn.getAttribute("data-highlighted") === "true";

				if (isActive) {
					// Выключение
					updateAllInstances(false);
					win.gBrowser.tabContainer.removeEventListener("TabSelect", onTabSelect);
					win.gBrowser.removeTabsProgressListener(progressListener);
					
					clearAllTabs(); // Очистка всех активных вкладок
				} else {
					// Включение
					updateAllInstances(true);
					win.gBrowser.tabContainer.addEventListener("TabSelect", onTabSelect);
					win.gBrowser.addTabsProgressListener(progressListener);
					
					applyToActiveTab(); // Покраска активной вкладки
				}
			});

			return btn;
		}
	});
}