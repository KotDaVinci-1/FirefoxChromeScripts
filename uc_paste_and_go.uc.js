// ==UserScript==
// @name			Вставить и перейти 
// @description		Кнопка при клике ЛКМ на которую. Есть горячие клавиши (можно отключить) и список доменов где они работать не будут.
// @compatibility	Firefox 152
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

if (!ChromeUtils.domProcessChild.childID) {
	let { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");

	const ID = "uc_paste_and_go";
	const ICON_URL = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 492 492' fill='context-fill'%3E%3Cpath d='M 347.652 227.266 L 253.296 132.918 C 248.232 127.85 242.476 125.062 235.272 125.062 C 228.064 125.062 223.308 127.85 218.244 132.918 L 202.124 149.034 C 197.06 154.098 194.272 160.854 194.272 168.058 C 194.272 175.266 199.06 182.066 204.124 187.134 L 229.508 212.562 L 26.944 212.562 C 12.108 212.562 0 219.542 0 234.378 L 0 234.47 L 0 257.178 C 0 272.01 12.108 279.438 26.944 279.438 L 229.68 279.438 L 204.16 305.782 C 199.096 310.842 194.308 317.51 194.308 324.714 C 194.308 331.918 197.096 338.63 202.16 343.694 L 218.28 359.794 C 223.348 364.858 228.1 367.634 235.304 367.634 C 242.516 367.634 248.268 364.838 253.336 359.778 L 347.652 265.45 C 352.732 260.37 355.52 253.586 355.496 246.366 C 355.52 239.126 352.732 232.342 347.652 227.266 Z'/%3E%3Cpath d='M 0 0.002 L 102.22 0.002 C 81.024 0.002 70.908 17.466 70.908 38.662 L 70.908 99.942 L 124.384 99.942 L 124.384 51.878 L 440.128 51.878 L 440.128 440.126 L 124.416 440.126 L 124.384 392.062 L 70.908 392.062 L 70.908 453.562 C 70.908 474.758 81.024 491.998 102.22 491.998 L 453.316 491.998 C 474.512 491.998 492 474.754 492 453.562 L 492 38.662 C 492 17.466 474.512 0.002 453.316 0.002 L 0 0.002 Z'/%3E%3C/svg%3E";
	// ВКЛ/ВЫКЛ Клик колесиком по адресной строке
	const CLICK_URL = true;
	// ВКЛ/ВЫКЛ Хоткей Ctrl+Shift+V
	const HOT_KEY = true;
	// Список доменов-исключений для хоткея
	const EXCLUDED_DOMAINS = [
		"docs.google.com",
		"disk.yandex.ru",
		"excel.officeapps.live.com"
	];

	const pasteAndGoMacro = (win) => {
		try {
			win.BrowserCommands.openTab();
			win.goDoCommand("cmd_paste");
			win.gURLBar.handleCommand();
		} catch (ex) {
			console.error("Ошибка при выполнении макроса вставки:", ex);
		}
	};
	// Сборка подсказки для кнопки
	const BASE_TIP = "Вставить из буфера и открыть в новой вкладке\nЛКМ по кнопке";
	const HOT_KEY_TIP = "Хоткей: Ctrl+Shift+V";
	const CLICK_URL_TIP = "Клик колесиком по адресной строке";
	const tipParts = [BASE_TIP];
	if (HOT_KEY) {tipParts.push(HOT_KEY_TIP);}
	if (CLICK_URL) {tipParts.push(CLICK_URL_TIP);}
	const CUSTOM_TIP = tipParts.join("\n");

	CustomizableUI.createWidget({
		id: ID,
		label: "Вставить и перейти",
		tooltiptext: CUSTOM_TIP,
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

			// 1. Обработка клика ЛКМ по кнопке
			btn.addEventListener("click", (e) => {
				if (e.button === 0) { 
					pasteAndGoMacro(win);
				}
			});
			// 2. Интеграция хоткея с проверкой домена
			if (!win.ucfPasteAndGoHotkeyAdded && HOT_KEY) {
				win.addEventListener("keydown", (e) => {
					if (e.ctrlKey && e.shiftKey && e.code === "KeyV") {
						try {
							let currentHost = win.gBrowser.currentURI.host;
							if (EXCLUDED_DOMAINS.some(domain => currentHost.includes(domain))) {
								return; 
							}
						} catch (err) {}

						e.preventDefault(); 
						e.stopPropagation();
						pasteAndGoMacro(win);
					}
				}, true);
				win.ucfPasteAndGoHotkeyAdded = true;
			}
			// 3. Обработка клика СКМ по текстовому полю адресной строки
			if (!win.ucfPasteAndGoUrlbarClickAdded && CLICK_URL) {
				win.addEventListener("auxclick", (e) => {
					if (e.button === 1 && (e.target.id === "urlbar-input" || e.target.className === "claseLocationBar")) {
						e.preventDefault(); 
						e.stopPropagation();
						pasteAndGoMacro(win);
					}
				}, true);
				win.ucfPasteAndGoUrlbarClickAdded = true;
			}

			return btn;
		}
	});
}