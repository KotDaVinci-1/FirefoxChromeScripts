// ==UserScript==
// @name			Яндекс Картинки
// @description		Кнопка при клике по которой открывается заранее заданный адрес.
// @compatibility	Firefox 152 
// @version			1.0.0 (релиз)
// @homepage	  	https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

if (!ChromeUtils.domProcessChild.childID) {
	let { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");

	const ID = "uc_yandex_images";
	const URL = "https://ya.ru/images/";

	const ICON_URL = "data:image/svg+xml,%3Csvg viewBox='2 3 20 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 5C2 3.35 3.35 2 5 2H19C20.6 2 22 3.35 22 5V19C22 20.6 20.6 22 19 22H5C3.35 22 2 20.6 2 19V5ZM5 4C4.5 4 4 4.5 4 5V16.6L6.6 14C7.4 13.2 8.63 13.2 9.4 14L10 14.6L14.6 10C15.37 9.22 16.63 9.22 17.41 10L20 12.6V5C20 4.5 19.55 4 19 4H5ZM20 15.41L16 11.41L10.707 16.707L10 17.41L9.29 16.7071L8 15.41L4.0633 19.351C4.20542 19.7301 4.57 20 5 20H19C19.55 20 20 19.55 20 19V15.41ZM9.5 8C9.224 8 9 8.224 9 8.5C9 8.78 9.224 9 9.5 9C9.78 9 10 8.78 10 8.5C10 8.224 9.78 8 9.5 8ZM7 8.5C7 7.12 8.12 6 9.5 6C10.88 6 12 7.12 12 8.5C12 9.881 10.88 11 9.5 11C8.12 11 7 9.88 7 8.5Z' fill='context-fill'/%3E%3C/svg%3E";

	CustomizableUI.createWidget({
		id: ID,
		label: "Яндекс Картинки",
		localized: false,
		type: "custom",
		defaultArea: CustomizableUI.AREA_NAVBAR,

		onBuild: function(doc) {
			const btn = doc.createXULElement("toolbarbutton");
			btn.id = ID;
			btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
			btn.setAttribute("label", this.label);
			btn.setAttribute("image", ICON_URL);
			btn.setAttribute("tooltiptext", this.label +  "\nЛКМ: открыть в новой активной вкладке\nСКМ: открыть в фоновой вкладке");

			const win = doc.defaultView;

			// Слушатель mouseup для обработки ЛКМ и СКМ
			btn.addEventListener("mouseup", (e) => {
				if (!win.gBrowser) return;

				if (e.button === 0) { 
					// ЛКМ: открыть в новой активной вкладке
					win.gBrowser.selectedTab = win.gBrowser.addTrustedTab(URL);
				} else if (e.button === 1) { 
					// СКМ: открыть в фоновой вкладке
					win.gBrowser.addTrustedTab(URL);
				}
			});

			return btn;
		}
	});
}