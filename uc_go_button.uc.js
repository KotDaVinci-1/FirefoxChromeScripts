// ==UserScript==
// @name			Перейти
// @description		Аналог кнопки "Перейти по введённому адресу" из адресной строки.
// @compatibility	Firefox 152 
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

if (!ChromeUtils.domProcessChild.childID) {
	let { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");

	const ID = "uc_go_button";
	const ICON_URL = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20445%20445'%3E%3Cpath%20fill%3D'context-fill'%20d%3D'M421.9%20196.7%20236.1%2010.848C228.88%203.615%20220.219%200%20210.131%200c-9.9%200-18.464%203.615-25.697%2010.848L163.023%2032.26c-7.234%206.853-10.85%2015.418-10.85%2025.697%200%2010.277%203.616%2018.842%2010.85%2025.697l83.653%2083.937H45.677c-9.895%200-17.937%203.568-24.123%2010.707s-9.279%2015.752-9.279%2025.837v36.546c0%2010.088%203.094%2018.698%209.279%2025.837s14.228%2010.704%2024.123%2010.704h200.995L163.02%20360.88c-7.234%207.228-10.85%2015.89-10.85%2025.981%200%2010.1%203.616%2018.75%2010.85%2025.978l21.411%2021.412c7.426%207.043%2015.99%2010.564%2025.697%2010.564%209.9%200%2018.562-3.521%2025.981-10.564l185.864-185.864c7.043-7.043%2010.567-15.701%2010.567-25.981%200-10.467-3.524-19.036-10.564-25.694z'%2F%3E%3C%2Fsvg%3E";

	CustomizableUI.createWidget({
		id: ID,
		label: "Перейти",
		tooltiptext: "Перейти по введённому адресу",
		localized: false,
		type: "custom",
		defaultArea: CustomizableUI.AREA_NAVBAR,

		onBuild: function(doc) {
			const btn = doc.createXULElement("toolbarbutton");
			btn.id = ID;
			btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
			btn.setAttribute("label", this.label);
			btn.setAttribute("image", ICON_URL);
			btn.setAttribute("tooltiptext", this.tooltiptext);
			const win = doc.defaultView;
			// Обработка клика ЛКМ
			btn.addEventListener("click", (e) => {
				if (e.button === 0) {
					if (win.gURLBar) {
						win.gURLBar.handleCommand(); 
					}
				}
			});

			return btn;
		}
	});
}
