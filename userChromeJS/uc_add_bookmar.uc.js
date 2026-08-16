// ==UserScript==
// @name			Добавить закладку в папку
// @description		Двойным кликом ЛКМ по папке на панели закладок добавлять закладку в папку (в начало или конец списка)
// @compatibility	Firefox 152 
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

(function() {
	if (ChromeUtils.domProcessChild.childID) return;
	if (location.href !== "chrome://browser/content/browser.xhtml") return;

	// === НАСТРОЙКА ПОЗИЦИИ КЛИКА ===
	// true  - добавлять в начало папки (первой по счету)
	// false - добавлять в конец папки (последней по счету)
	const ADD_TO_START = true;

	const { PlacesTransactions } = ChromeUtils.importESModule("resource://gre/modules/PlacesTransactions.sys.mjs");

	window.addEventListener("dblclick", async e => {
		if (e.button !== 0) return;

		const item = e.target.closest(".bookmark-item");
		if (!item) return;

		const node = item._placesNode || item._placesView?._resultNode;
		if (!node || !PlacesUtils.nodeIsFolderOrShortcut(node)) return;

		const parentGuid = PlacesUtils.getConcreteItemGuid(node);
		let msg, popupIconURL;

		// Базовые параметры транзакции
		const bookmarkOptions = {
			parentGuid,
			url: gBrowser.currentURI.spec,
			title: gBrowser.selectedTab.label
		};

		// В какое место сохранять
		if (ADD_TO_START) {
			bookmarkOptions.index = 0;
		}

		try {
			await PlacesTransactions.NewBookmark(bookmarkOptions).transact();

			const folderTitle = PlacesUtils.bookmarks.getLocalizedTitle({ guid: parentGuid, title: node.title });
			msg = `Добавил в папку: ${folderTitle}`;
			popupIconURL = gBrowser.selectedTab.image || "chrome://global/skin/icons/Portrait.png";
		} catch (ex) {
			msg = "ERROR! " + ex.message;
			popupIconURL = "chrome://global/skin/icons/warning.svg";
		}

		const notification = PopupNotifications.show(
			gBrowser.selectedBrowser, 
			"PDES-popup", 
			msg, 
			null, null, null, 
			{ popupIconURL, hideClose: true }
		);

		if (notification) {
			setTimeout(() => {
				try { notification.remove(); } catch {}
			}, 4000);
		}
	});
})();
