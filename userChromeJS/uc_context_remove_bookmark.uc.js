// ==UserScript==
// @name			Удалить закладку текущей страницы
// @description		Пункт меню в контекстном меню страницы позволяющий удалить закладку на текущую страницу (если таковая имеется).
// @compatibility	Firefox 152
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==


if (!ChromeUtils.domProcessChild.childID) {
	const { PlacesUtils } = ChromeUtils.importESModule("resource://gre/modules/PlacesUtils.sys.mjs");
	let win = globalThis.window;

	const init = () => {
		// Настройка позиции пункта меню:
		// 1 - после панели навигации (#context-navigation)
		// 2 - до панели навигации
		// 3 - внутри панели навигации (сразу после кнопки-звёздочки #context-bookmarkpage)
		const MENU_POS = 1; 

		const popup = win.document.getElementById("contentAreaContextMenu");
		const menugroup = win.document.getElementById("context-navigation");
		
		if (!popup) return;

		const ID = "uc-context-remove-bookmark";
		if (win.document.getElementById(ID)) return;
		// fix иконки в context-navigation
		const styleId = "uc-remove-bookmark-style";
		if (!win.document.getElementById(styleId)) {
			let style = win.document.createElementNS("http://www.w3.org/1999/xhtml", "style");
			style.id = styleId;
			style.textContent = `
				#context-navigation #uc-context-remove-bookmark .menu-icon {
					height: 16px !important;
					width: 16px !important;
					padding: 0 !important;
				}
			`;
			win.document.documentElement.appendChild(style);
		}
		// 1. Создание пункта меню
		const menuitem = win.document.createXULElement("menuitem");
		menuitem.id = ID;
		menuitem.setAttribute("class", "menuitem-iconic");

		const labelText = "Удалить эту страницу из закладок";
		menuitem.setAttribute("label", labelText);

		// Если пункт будет внутри панели навигации, добавить всплывающую подсказку
		if (MENU_POS === 3) {
			menuitem.setAttribute("tooltiptext", labelText);
			menuitem.setAttribute("aria-label", labelText);
		}

		// 2. Поместить в нужное место согласно MENU_POS
		if (MENU_POS === 3 && menugroup) {
			const bookmarkPageBtn = win.document.getElementById("context-bookmarkpage");
			if (bookmarkPageBtn) {
				bookmarkPageBtn.after(menuitem);
			} else {
				menugroup.appendChild(menuitem); // Фолбэк, если кнопки-звездочки вдруг нет
			}
		} else if (MENU_POS === 2 && menugroup) {
			menugroup.before(menuitem);
		} else {
			// MENU_POS === 1 (или если menugroup вообще не найден)
			if (menugroup) {
				menugroup.after(menuitem);
			} else {
				popup.insertBefore(menuitem, popup.firstChild);
			}
		}

		let foundBookmarks = [];
		let currentUrl = "";

		// 3. Управление видимостью пункта меню перед показом
		popup.addEventListener("popupshowing", async () => {
			if (menugroup && menugroup.hidden) {
				menuitem.hidden = true;
				return;
			}

			currentUrl = win.gBrowser.currentURI.spec;
			foundBookmarks = [];

			try {
				await PlacesUtils.bookmarks.fetch(
					{ url: currentUrl }, 
					bm => foundBookmarks.push(bm)
				);
			} catch (e) {
				console.error("Ошибка поиска закладок:", e);
			}

			// Показ кнопки только если страница уже есть в закладках
			if (foundBookmarks.length > 0) {
				menuitem.hidden = false;
				menuitem.setAttribute("image", "page-icon:" + currentUrl);
			} else {
				menuitem.hidden = true;
			}
		});

		// 5. Логика удаления
		menuitem.addEventListener("command", async () => {
			if (foundBookmarks.length === 0) return;

			let num = 0;
			const crop = (str, limit = 80) => str.length <= limit ? str : str.slice(0, limit) + "…";
			// Пытаемся декодировать, если URL кривой — оставляем исходный
			let decodedUrl = currentUrl;
			try { decodedUrl = decodeURI(currentUrl); } catch (e) {}

			let msg = crop(decodedUrl) + "\nИз папок:";

			for (let bookmark of foundBookmarks) {
				try {
					let parentFolder = await PlacesUtils.bookmarks.fetch({ guid: bookmark.parentGuid });
					let title = PlacesUtils.bookmarks.getLocalizedTitle(parentFolder);

					await PlacesUtils.bookmarks.remove(bookmark.guid);
					num++;
					msg += `\n• ${title || "[Безымянная папка]"}`;
				} catch (err) {
					console.error("Не удалось удалить закладку:", err);
				}
			}

			if (num > 0) {
				let iconUrl = menuitem.getAttribute("image"); // "page-icon:https://..."
				showNotification(num, msg, iconUrl);
			}
		});

		function getPluralText(count) {
			let r10 = count % 10;
			let r100 = count % 100;
			if (r10 === 1 && r100 !== 11) return `Удалена ${count} закладка`;
			if ([2, 3, 4].includes(r10) && ![12, 13, 14].includes(r100)) return `Удалено ${count} закладки`;
			return `Удалено ${count} закладок`;
		}

		// 6. Уведомления
		async function showNotification(count, message, iconUrl) {
			const alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
			const title = getPluralText(count);
			let imageObj = null;
			let finalUrl = iconUrl || "chrome://global/skin/icons/defaultFavicon.svg";

			if (iconUrl && "fetchDecodedImage" in ChromeUtils) {
				try {
					let uri = Services.io.newURI(iconUrl); 
					let principal = Services.scriptSecurityManager.getSystemPrincipal();
					let channel = Services.io.newChannelFromURI(
						uri, null, principal, null,
						Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
						Ci.nsIContentPolicy.TYPE_IMAGE
					);
					channel.loadInfo.allowDeprecatedSystemRequests = true;
					imageObj = await ChromeUtils.fetchDecodedImage(uri, channel);
				} catch (e) {
					console.error("Ошибка декодирования иконки в память:", e);
				}
			}

			const AlertNotification = Components.Constructor("@mozilla.org/alert-notification;1", "nsIAlertNotification", "initWithObject");
			const alertName = "uc-bookmark-removed-alert";

			let alertOpts = {
				name: alertName,
				title: title,
				text: message,
				imageURL: finalUrl,
				textClickable: false
			};

			if (imageObj) alertOpts.image = imageObj;

			try {
				let alert = new AlertNotification(alertOpts);
				alertsService.showAlert(alert, null);
			} catch (e) {
				console.error("Ошибка показа алерта:", e);
			}
		}
	};

	if (win.document.readyState === "complete") {
		init();
	} else {
		win.addEventListener("DOMContentLoaded", init, { once: true });
	}
}
